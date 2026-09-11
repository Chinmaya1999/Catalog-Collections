const { spawn } = require('child_process');

// Runs poppler/tesseract helper binaries at a lower OS scheduling priority than the main
// server process, so a busy extraction job can't starve the event loop of CPU time and make
// the public site (running in the same Node process) feel unresponsive. `nice` ships with
// macOS/Linux; on platforms without it (Windows) this just falls back to a plain spawn.
function niceSpawn(cmd, args) {
  if (process.platform === 'win32') return spawn(cmd, args);
  return spawn('nice', ['-n', '15', cmd, ...args]);
}

module.exports = { niceSpawn };
