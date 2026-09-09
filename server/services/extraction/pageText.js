const { spawn } = require('child_process');

function runCapture(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
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

const CODE_PATTERN = /\b[A-Z]{2,8}-\d{2,5}\b/;

// Returns the page's real selectable text (this catalog only ever prints a short code like
// "AHAMT-032" as real text - everything else is baked into the page graphics) and, if it looks
// like a catalog page code, that code specifically.
async function getPageText(pdfPath, pageNumber) {
  const text = await runCapture('pdftotext', ['-f', String(pageNumber), '-l', String(pageNumber), pdfPath, '-']);
  const match = text.match(CODE_PATTERN);
  return { text: text.trim(), pageCode: match ? match[0] : null };
}

module.exports = { getPageText };
