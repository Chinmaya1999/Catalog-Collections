const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { niceSpawn } = require('./procSpawn');

// Minimum dimension (px) for an extracted image to be treated as a candidate product
// photo rather than a decorative icon/badge graphic.
const MIN_PHOTO_DIMENSION = 120;

function runCapture(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = niceSpawn(cmd, args);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', (err) => {
      reject(new Error(`Failed to start "${cmd}" (is poppler-utils installed?): ${err.message}`));
    });
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${cmd} exited with code ${code}: ${stderr.trim()}`));
    });
  });
}

// Parses `pdfimages -list` output into rows: { num, type, width, height, object }.
// `object` is the underlying PDF object id - an "image" row and its "smask" (soft
// mask / alpha channel) row share the same object id, which is how PDFs represent
// cutout product photos with a transparent background.
function parseImageList(listOutput) {
  const lines = listOutput.split('\n').map(l => l.trim()).filter(Boolean);
  const rows = [];
  for (const line of lines) {
    const cols = line.split(/\s+/);
    if (cols.length < 11) continue;
    const num = parseInt(cols[1], 10);
    const type = cols[2];
    const width = parseInt(cols[3], 10);
    const height = parseInt(cols[4], 10);
    const object = cols[10];
    if (Number.isNaN(num) || Number.isNaN(width) || Number.isNaN(height)) continue;
    rows.push({ num, type, width, height, object });
  }
  return rows;
}

// Composites a base image with its soft-mask (alpha channel) into a single RGBA PNG.
// PDF soft masks are luminosity masks (white = opaque, black = transparent) that can
// be a different pixel size than the base image, so it's resized to match before
// being joined as the raw 4th (alpha) channel. Falls back to the plain base image if
// compositing fails for any reason.
async function compositeWithMask(basePath, maskPath, outPath) {
  try {
    const { width, height } = await sharp(basePath).metadata();
    const { data: maskData, info: maskInfo } = await sharp(maskPath)
      .resize(width, height)
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    await sharp(basePath)
      .joinChannel(maskData, { raw: { width: maskInfo.width, height: maskInfo.height, channels: 1 } })
      .png()
      .toFile(outPath);
    return outPath;
  } catch (err) {
    return basePath;
  }
}

// Extracts every embedded image object on a single PDF page, compositing any
// base-image/soft-mask pairs into proper RGBA photos. Returns candidates sorted by
// area (largest first), each flagged as a likely product photo vs a small decorative
// graphic.
async function extractPageImages(pdfPath, pageNumber, workDir) {
  await fs.promises.mkdir(workDir, { recursive: true });
  const prefix = path.join(workDir, 'img');

  const listOutput = await runCapture('pdfimages', ['-list', '-f', String(pageNumber), '-l', String(pageNumber), pdfPath]);
  const allRows = parseImageList(listOutput);
  const imageRows = allRows.filter(r => r.type === 'image');
  if (imageRows.length === 0) return [];

  await runCapture('pdfimages', ['-all', '-f', String(pageNumber), '-l', String(pageNumber), pdfPath, prefix]);

  const files = await fs.promises.readdir(workDir);
  const fileByNum = new Map();
  for (const file of files) {
    const match = file.match(/-(\d+)\.\w+$/);
    if (match) fileByNum.set(parseInt(match[1], 10), path.join(workDir, file));
  }

  const maskRowByObject = new Map();
  allRows.filter(r => r.type === 'smask').forEach(r => maskRowByObject.set(r.object, r));

  const candidates = [];
  for (const row of imageRows) {
    const basePath = fileByNum.get(row.num);
    if (!basePath) continue;

    const maskRow = maskRowByObject.get(row.object);
    let finalPath = basePath;
    if (maskRow) {
      const maskPath = fileByNum.get(maskRow.num);
      if (maskPath) {
        const outPath = path.join(workDir, `composited-${row.num}.png`);
        finalPath = await compositeWithMask(basePath, maskPath, outPath);
      }
    }

    candidates.push({
      path: finalPath,
      width: row.width,
      height: row.height,
      isLikelyPhoto: row.width >= MIN_PHOTO_DIMENSION && row.height >= MIN_PHOTO_DIMENSION
    });
  }

  candidates.sort((a, b) => (b.width * b.height) - (a.width * a.height));
  return candidates;
}

module.exports = { extractPageImages, MIN_PHOTO_DIMENSION };
