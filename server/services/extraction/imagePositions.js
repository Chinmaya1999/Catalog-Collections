const { niceSpawn } = require('./procSpawn');
const path = require('path');
const fs = require('fs');
const os = require('os');

function runCapture(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = niceSpawn(cmd, args);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', (err) => reject(new Error(`Failed to start "${cmd}": ${err.message}`)));
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${cmd} exited with code ${code}: ${stderr.trim()}`));
    });
  });
}

// Extracts PDF page text positions and rasterized pictures together so product photos can be
// matched to their corresponding model rows rather than relying on image object order.
const decodeXml = (value) => value
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (match, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (match, code) => String.fromCodePoint(parseInt(code, 16)));

const attributesOf = (tag) => Object.fromEntries(
  [...tag.matchAll(/([a-z]+)="([^"]*)"/gi)].map((match) => [match[1], decodeXml(match[2])])
);

async function getPdfPageLayouts(pdfPath, workDir, pageRange = null) {
  await fs.promises.mkdir(workDir, { recursive: true });
  const outputPrefix = path.join(workDir, 'layout');
  const rangeArgs = pageRange
    ? ['-f', String(pageRange.first), '-l', String(pageRange.last)]
    : [];
  await runCapture('pdftohtml', ['-xml', ...rangeArgs, pdfPath, outputPrefix]);
  const xml = await fs.promises.readFile(`${outputPrefix}.xml`, 'utf8');
  const layouts = [];
  const pageRegex = /<page\b([^>]*)>([\s\S]*?)<\/page>/g;
  let pageMatch;

  while ((pageMatch = pageRegex.exec(xml)) !== null) {
    const pageAttributes = attributesOf(pageMatch[1]);
    const content = pageMatch[2];
    const images = [];
    const texts = [];
    const imageRegex = /<image\b([^>]*)\/?>/g;
    const textRegex = /<text\b([^>]*)>([\s\S]*?)<\/text>/g;
    let match;

    while ((match = imageRegex.exec(content)) !== null) {
      const attributes = attributesOf(match[1]);
      const top = Number(attributes.top);
      const left = Number(attributes.left);
      const width = Number(attributes.width);
      const height = Number(attributes.height);
      if (![top, left, width, height].every(Number.isFinite) || width < 20 || height < 20 || !attributes.src) continue;
      images.push({
        top,
        left,
        width,
        height,
        centerY: top + height / 2,
        filePath: path.join(workDir, path.basename(attributes.src))
      });
    }

    while ((match = textRegex.exec(content)) !== null) {
      const attributes = attributesOf(match[1]);
      const top = Number(attributes.top);
      const left = Number(attributes.left);
      const height = Number(attributes.height);
      const text = decodeXml(match[2].replace(/<[^>]*>/g, '')).trim();
      if (!text || ![top, left, height].every(Number.isFinite)) continue;
      texts.push({ top, left, height, text, centerY: top + height / 2 });
    }

    layouts.push({
      pageNumber: Number(pageAttributes.number),
      width: Number(pageAttributes.width),
      height: Number(pageAttributes.height),
      images,
      texts
    });
  }

  return layouts;
}

async function getImagePositions(pdfPath, pageNumber) {
  const workDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'pdf-image-positions-'));
  try {
    const layout = (await getPdfPageLayouts(pdfPath, workDir, { first: pageNumber, last: pageNumber }))
      .find((page) => page.pageNumber === pageNumber);
    return {
      pageWidth: layout?.width || null,
      pageHeight: layout?.height || null,
      boxes: (layout?.images || []).map(({ top, left, width, height }) => ({ top, left, width, height }))
    };
  } finally {
    await fs.promises.rm(workDir, { recursive: true, force: true });
  }
}

module.exports = { getImagePositions, getPdfPageLayouts };
