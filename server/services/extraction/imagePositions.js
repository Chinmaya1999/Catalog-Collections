const { niceSpawn } = require('./procSpawn');

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

// Reads each embedded image's placement on the page via pdftohtml's XML output (pdfimages
// only reports an image's own pixel dimensions, not where it sits on the page - pdftohtml
// parses the same content stream and additionally reports position). Base-image/soft-mask
// pairs are written as two <image> entries with identical geometry; consecutive duplicates
// are collapsed to one. Returns boxes in pdftohtml's own coordinate units alongside the page's
// declared width/height so callers can scale into their own pixel space.
async function getImagePositions(pdfPath, pageNumber) {
  const xml = await runCapture('pdftohtml', ['-f', String(pageNumber), '-l', String(pageNumber), '-xml', '-i', '-stdout', pdfPath]);

  const pageMatch = xml.match(/<page[^>]*width="(\d+)"[^>]*height="(\d+)"/);
  const pageWidth = pageMatch ? parseInt(pageMatch[1], 10) : null;
  const pageHeight = pageMatch ? parseInt(pageMatch[2], 10) : null;

  const boxes = [];
  const imageRegex = /<image\s+top="(\d+)"\s+left="(\d+)"\s+width="(\d+)"\s+height="(\d+)"/g;
  let match;
  while ((match = imageRegex.exec(xml)) !== null) {
    boxes.push({
      top: parseInt(match[1], 10),
      left: parseInt(match[2], 10),
      width: parseInt(match[3], 10),
      height: parseInt(match[4], 10)
    });
  }

  const deduped = boxes.filter((box, i) => {
    const prev = boxes[i - 1];
    return !prev || prev.top !== box.top || prev.left !== box.left || prev.width !== box.width || prev.height !== box.height;
  });

  return { pageWidth, pageHeight, boxes: deduped };
}

module.exports = { getImagePositions };
