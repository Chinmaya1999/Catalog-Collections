const fs = require('fs');
const path = require('path');
const { niceSpawn } = require('./procSpawn');

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = niceSpawn(cmd, args);
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', (err) => {
      reject(new Error(`Failed to start "${cmd}" (is poppler-utils installed?): ${err.message}`));
    });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}: ${stderr.trim()}`));
    });
  });
}

// Renders a single PDF page to a PNG file using pdftoppm and returns its absolute path.
async function renderPage(pdfPath, pageNumber, outDir) {
  await fs.promises.mkdir(outDir, { recursive: true });
  const prefix = path.join(outDir, `page-${pageNumber}`);
  await run('pdftoppm', [
    '-png', '-r', '300',
    '-f', String(pageNumber), '-l', String(pageNumber),
    '-singlefile', pdfPath, prefix
  ]);
  const outPath = `${prefix}.png`;
  if (!fs.existsSync(outPath)) {
    throw new Error(`pdftoppm did not produce an image for page ${pageNumber}`);
  }
  return outPath;
}

module.exports = { renderPage, run };
