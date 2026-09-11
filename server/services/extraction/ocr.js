const { createWorker } = require('tesseract.js');
const sharp = require('sharp');

// A small pool of tesseract workers, one per concurrent page slot the pipeline runs (see
// PAGE_CONCURRENCY in pipeline.js - keep these in sync). A single shared worker was tried first
// and found to silently corrupt results (merged columns, vanished digits) when two OCR calls
// overlapped in time, since the underlying worker only really processes one job at a time; a
// pool gives true parallelism without that hazard, and multiple regions *within* one page are
// still read sequentially by heuristicStructure.js regardless.
// Kept at 1 (serial page processing) rather than 2+: each OCR worker and its accompanying
// pdftoppm/pdfimages/pdftohtml child processes are genuine CPU-bound work, and running two
// pages' worth of that at once on a small server was enough to starve the same Node process's
// event loop of CPU and make the public site hang mid-upload. Raise this only on a box with
// CPU headroom to spare.
const POOL_SIZE = 1;
let poolPromise = null;

function initPool() {
  if (!poolPromise) {
    poolPromise = Promise.all(
      Array.from({ length: POOL_SIZE }, () => createWorker('eng'))
    ).then(workers => workers.map(worker => ({ worker, busy: false })));
  }
  return poolPromise;
}

async function acquireWorker() {
  const pool = await initPool();
  for (;;) {
    const slot = pool.find(s => !s.busy);
    if (slot) {
      slot.busy = true;
      return slot;
    }
    await new Promise(resolve => setTimeout(resolve, 30));
  }
}

async function terminateWorker() {
  if (!poolPromise) return;
  const pool = await poolPromise;
  poolPromise = null;
  await Promise.all(pool.map(s => s.worker.terminate()));
}

// Parses tesseract's TSV output into word-level entries: { text, x, y, width, height, confidence }.
// TSV columns: level page_num block_num par_num line_num word_num left top width height conf text
function parseTsv(tsv) {
  const lines = tsv.split('\n');
  const words = [];
  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.length < 12) continue;
    const level = parseInt(cols[0], 10);
    if (level !== 5) continue; // word-level rows only
    const text = cols[11].trim();
    if (!text) continue;
    words.push({
      block: parseInt(cols[2], 10),
      par: parseInt(cols[3], 10),
      line: parseInt(cols[4], 10),
      word: parseInt(cols[5], 10),
      x: parseInt(cols[6], 10),
      y: parseInt(cols[7], 10),
      width: parseInt(cols[8], 10),
      height: parseInt(cols[9], 10),
      confidence: parseFloat(cols[10]),
      text
    });
  }
  return words;
}

// Crops a fractional region {left, top, width, height} (0-1 relative to page size) out of the
// rendered page image and OCRs it. Returns { text, words, rows } where `rows` groups words by
// their (block, par, line) so table rows can be reconstructed.
//
// `psm` selects tesseract's page segmentation mode - this matters a lot more than usual here
// because the page mixes a few very different text styles (a huge bold display headline, a
// small pill-shaped badge, a dense grid table, isolated labels floating next to photos) and no
// single mode reads all of them reliably. Callers pick the mode that suits what they're cropping
// (see heuristicStructure.js).
async function ocrRegion(pageImagePath, region, psm) {
  const meta = await sharp(pageImagePath).metadata();
  const left = Math.round(meta.width * region.left);
  const top = Math.round(meta.height * region.top);
  const width = Math.min(Math.round(meta.width * region.width), meta.width - left);
  const height = Math.min(Math.round(meta.height * region.height), meta.height - top);

  const cropBuffer = await sharp(pageImagePath)
    .extract({ left, top, width, height })
    .toBuffer();

  const slot = await acquireWorker();
  try {
    if (psm) await slot.worker.setParameters({ tessedit_pageseg_mode: String(psm) });
    const { data } = await slot.worker.recognize(cropBuffer, {}, { text: true, tsv: true });
    const words = parseTsv(data.tsv);

    const rowMap = new Map();
    for (const w of words) {
      const key = `${w.block}-${w.par}-${w.line}`;
      if (!rowMap.has(key)) rowMap.set(key, []);
      rowMap.get(key).push(w);
    }
    const rows = Array.from(rowMap.values()).map(row => row.sort((a, b) => a.x - b.x));
    rows.sort((a, b) => a[0].y - b[0].y);

    return { text: data.text || '', words, rows, cropWidth: width };
  } finally {
    slot.busy = false;
  }
}

module.exports = { ocrRegion, terminateWorker, POOL_SIZE };
