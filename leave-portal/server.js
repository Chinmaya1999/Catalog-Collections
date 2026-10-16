'use strict';
// Holiday calendar + employee leave portal. No npm dependencies (Node >= 22.13).
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = Number(process.env.PORT) || 4000;
const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'leave.db');
// Leave policy: per calendar month. Change here to change the policy.
const MONTHLY_QUOTA = { casual: 1, sick: 2 };
// Weekly off days (0 = Sunday ... 6 = Saturday). Not counted as leave days.
const WEEKLY_OFF = (process.env.WEEKLY_OFF || '0,6').split(',').map(Number);
const BACKDATE_DAYS = 30;
const PUBLIC_DIR = path.join(__dirname, 'public');

// ---------- database ----------
const db = new DatabaseSync(DB_FILE);
db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, emp_code TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  email TEXT, department TEXT, role TEXT NOT NULL DEFAULT 'employee',
  pass_hash TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS holidays (
  id INTEGER PRIMARY KEY, date TEXT NOT NULL, name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'national', UNIQUE(date, name)
);
CREATE TABLE IF NOT EXISTS leaves (
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL, from_date TEXT NOT NULL, to_date TEXT NOT NULL, days INTEGER NOT NULL,
  reason TEXT, status TEXT NOT NULL DEFAULT 'pending', admin_comment TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, decided_at TEXT
);
CREATE TABLE IF NOT EXISTS leave_days (
  leave_id INTEGER NOT NULL REFERENCES leaves(id) ON DELETE CASCADE, date TEXT NOT NULL,
  PRIMARY KEY (leave_id, date)
);
`);

// ---------- helpers ----------
const hashPassword = (pw) => {
  const salt = crypto.randomBytes(16);
  return `${salt.toString('hex')}:${crypto.scryptSync(pw, salt, 64).toString('hex')}`;
};
const checkPassword = (pw, stored) => {
  const [salt, hash] = stored.split(':');
  const got = crypto.scryptSync(pw, Buffer.from(salt, 'hex'), 64);
  return crypto.timingSafeEqual(got, Buffer.from(hash, 'hex'));
};
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const bad = (msg) => new HttpError(400, msg);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;
const parseDate = (s) => {
  if (!DATE_RE.test(s || '')) throw bad('Invalid date');
  const d = new Date(`${s}T00:00:00Z`);
  if (isNaN(d) || d.toISOString().slice(0, 10) !== s) throw bad('Invalid date');
  return d;
};
const fmt = (d) => d.toISOString().slice(0, 10);
const today = () => fmt(new Date(Date.now() + 5.5 * 3600e3)); // IST

// Working days between two dates (inclusive), skipping weekly offs and holidays.
function workingDays(from, to) {
  const start = parseDate(from), end = parseDate(to);
  if (end < start) throw bad('End date is before start date');
  if ((end - start) / 864e5 > 92) throw bad('A single request can span at most 3 months');
  const hol = new Set(db.prepare('SELECT date FROM holidays WHERE date BETWEEN ? AND ?').all(from, to).map((r) => r.date));
  const out = [];
  for (let d = start; d <= end; d = new Date(d.getTime() + 864e5)) {
    if (!WEEKLY_OFF.includes(d.getUTCDay()) && !hol.has(fmt(d))) out.push(fmt(d));
  }
  return out;
}

// Days already used or reserved (pending + approved) in a month, per leave type.
function monthUsage(userId, month) {
  const rows = db.prepare(`
    SELECT l.type, COUNT(*) AS n FROM leave_days d JOIN leaves l ON l.id = d.leave_id
    WHERE l.user_id = ? AND l.status IN ('pending','approved') AND substr(d.date,1,7) = ?
    GROUP BY l.type`).all(userId, month);
  const used = { casual: 0, sick: 0 };
  for (const r of rows) used[r.type] = r.n;
  return used;
}
function balance(userId, month) {
  const used = monthUsage(userId, month);
  const out = {};
  for (const t of Object.keys(MONTHLY_QUOTA)) {
    out[t] = { quota: MONTHLY_QUOTA[t], used: used[t], left: MONTHLY_QUOTA[t] - used[t] };
  }
  return out;
}

const DEFAULT_HOLIDAYS = [
  // National holidays (fixed dates)
  ...[2026, 2027, 2028].flatMap((y) => [
    [`${y}-01-26`, 'Republic Day', 'national'],
    [`${y}-08-15`, 'Independence Day', 'national'],
    [`${y}-10-02`, 'Gandhi Jayanti', 'national'],
    [`${y}-12-25`, 'Christmas', 'national'],
  ]),
  // 2026 festival holidays (lunar dates - HR should verify against the official list)
  ['2026-02-15', 'Maha Shivaratri', 'festival'], ['2026-03-04', 'Holi', 'festival'],
  ['2026-03-21', 'Eid-ul-Fitr', 'festival'], ['2026-03-26', 'Ram Navami', 'festival'],
  ['2026-03-31', 'Mahavir Jayanti', 'festival'], ['2026-04-03', 'Good Friday', 'festival'],
  ['2026-04-14', 'Dr. Ambedkar Jayanti', 'national'], ['2026-05-01', 'Buddha Purnima', 'festival'],
  ['2026-05-27', 'Bakrid (Eid-ul-Adha)', 'festival'], ['2026-06-26', 'Muharram', 'festival'],
  ['2026-08-26', 'Milad-un-Nabi', 'festival'], ['2026-09-04', 'Janmashtami', 'festival'],
  ['2026-10-20', 'Dussehra', 'festival'], ['2026-11-08', 'Diwali', 'festival'],
  ['2026-11-24', 'Guru Nanak Jayanti', 'festival'],
];
const insHoliday = db.prepare('INSERT OR IGNORE INTO holidays (date, name, type) VALUES (?,?,?)');
if (db.prepare('SELECT COUNT(*) AS n FROM holidays').get().n === 0) {
  for (const h of DEFAULT_HOLIDAYS) insHoliday.run(...h);
}

// First run: create the admin account with a random password (or ADMIN_PASSWORD).
if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n === 0) {
  const pw = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
  db.prepare("INSERT INTO users (emp_code, name, role, pass_hash) VALUES ('admin','HR Admin','admin',?)").run(hashPassword(pw));
  console.log(`\nAdmin account created.\n  Login: admin\n  Password: ${pw}\n  (change it after first login)\n`);
}

// ---------- auth ----------
const SESSION_MS = 12 * 3600e3;
const loginAttempts = new Map(); // ip -> {n, reset}
function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter((p) => p[0]));
}
function currentUser(req) {
  const tok = parseCookies(req).sid;
  if (!tok) return null;
  const row = db.prepare(`SELECT u.id, u.emp_code, u.name, u.email, u.department, u.role, s.expires
    FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND u.active = 1`).get(tok);
  if (!row || row.expires < Date.now()) return null;
  return row;
}
const requireUser = (req) => currentUser(req) || (() => { throw new HttpError(401, 'Please log in'); })();
const requireAdmin = (req) => {
  const u = requireUser(req);
  if (u.role !== 'admin') throw new HttpError(403, 'Admin only');
  return u;
};
const publicUser = (u) => ({ id: u.id, emp_code: u.emp_code, name: u.name, email: u.email, department: u.department, role: u.role });

// ---------- routes ----------
const routes = [];
const route = (method, pattern, handler) => routes.push({ method, re: new RegExp(`^${pattern}$`), handler });

route('POST', '/api/login', (req, res, _m, body) => {
  const ip = req.socket.remoteAddress;
  const a = loginAttempts.get(ip);
  if (a && a.reset > Date.now() && a.n >= 10) throw new HttpError(429, 'Too many attempts. Try again in a few minutes.');
  const user = db.prepare('SELECT * FROM users WHERE lower(emp_code) = lower(?) AND active = 1').get(String(body.emp_code || ''));
  if (!user || !checkPassword(String(body.password || ''), user.pass_hash)) {
    loginAttempts.set(ip, { n: (a && a.reset > Date.now() ? a.n : 0) + 1, reset: Date.now() + 10 * 60e3 });
    throw new HttpError(401, 'Wrong employee ID or password');
  }
  loginAttempts.delete(ip);
  const token = crypto.randomBytes(32).toString('base64url');
  db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());
  db.prepare('INSERT INTO sessions (token, user_id, expires) VALUES (?,?,?)').run(token, user.id, Date.now() + SESSION_MS);
  res.setHeader('Set-Cookie', `sid=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}`);
  return publicUser(user);
});
route('POST', '/api/logout', (req, res) => {
  const tok = parseCookies(req).sid;
  if (tok) db.prepare('DELETE FROM sessions WHERE token = ?').run(tok);
  res.setHeader('Set-Cookie', 'sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  return { ok: true };
});
route('GET', '/api/me', (req) => {
  const u = requireUser(req);
  return { user: publicUser(u), quota: MONTHLY_QUOTA, today: today() };
});
route('POST', '/api/password', (req, _res, _m, body) => {
  const u = requireUser(req);
  const row = db.prepare('SELECT pass_hash FROM users WHERE id = ?').get(u.id);
  if (!checkPassword(String(body.current || ''), row.pass_hash)) throw bad('Current password is wrong');
  if (String(body.next || '').length < 8) throw bad('New password must be at least 8 characters');
  db.prepare('UPDATE users SET pass_hash = ? WHERE id = ?').run(hashPassword(body.next), u.id);
  return { ok: true };
});

// Holidays
route('GET', '/api/holidays', (req, _res, _m, _b, q) => {
  requireUser(req);
  const year = /^\d{4}$/.test(q.get('year') || '') ? q.get('year') : today().slice(0, 4);
  return db.prepare("SELECT id, date, name, type FROM holidays WHERE substr(date,1,4) = ? ORDER BY date").all(year);
});
route('POST', '/api/holidays', (req, _res, _m, body) => {
  requireAdmin(req);
  parseDate(body.date);
  const name = String(body.name || '').trim();
  if (!name) throw bad('Holiday name is required');
  const type = ['national', 'festival', 'company'].includes(body.type) ? body.type : 'company';
  db.prepare('INSERT OR IGNORE INTO holidays (date, name, type) VALUES (?,?,?)').run(body.date, name, type);
  return { ok: true };
});
route('DELETE', '/api/holidays/(\\d+)', (req, _res, m) => {
  requireAdmin(req);
  db.prepare('DELETE FROM holidays WHERE id = ?').run(Number(m[1]));
  return { ok: true };
});

// Balance + calendar
route('GET', '/api/balance', (req, _res, _m, _b, q) => {
  const u = requireUser(req);
  const month = q.get('month') || today().slice(0, 7);
  if (!MONTH_RE.test(month)) throw bad('Invalid month');
  return { month, balance: balance(u.id, month) };
});
route('GET', '/api/calendar', (req, _res, _m, _b, q) => {
  const u = requireUser(req);
  const month = q.get('month') || today().slice(0, 7);
  if (!MONTH_RE.test(month)) throw bad('Invalid month');
  const holidays = db.prepare('SELECT date, name, type FROM holidays WHERE substr(date,1,7) = ?').all(month);
  // Employees see only their own leave; admins see everyone's approved/pending leave.
  const leaves = db.prepare(`
    SELECT d.date, l.type, l.status, u.name FROM leave_days d
    JOIN leaves l ON l.id = d.leave_id JOIN users u ON u.id = l.user_id
    WHERE substr(d.date,1,7) = ? AND l.status IN ('pending','approved') ${u.role === 'admin' ? '' : 'AND l.user_id = ?'}
    ORDER BY d.date`).all(...(u.role === 'admin' ? [month] : [month, u.id]));
  return { month, holidays, leaves, weeklyOff: WEEKLY_OFF };
});

// Leaves
route('POST', '/api/leaves', (req, _res, _m, body) => {
  const u = requireUser(req);
  if (u.role === 'admin') throw bad('Admin accounts do not take leave. Use an employee account.');
  if (!(body.type in MONTHLY_QUOTA)) throw bad('Leave type must be casual or sick');
  const reason = String(body.reason || '').trim().slice(0, 500);
  if (!reason) throw bad('Please give a reason');
  const earliest = fmt(new Date(parseDate(today()).getTime() - BACKDATE_DAYS * 864e5));
  if (body.from < earliest) throw bad(`Cannot apply for dates more than ${BACKDATE_DAYS} days in the past`);
  const days = workingDays(body.from, body.to);
  if (!days.length) throw bad('Those dates are all weekends/holidays - no leave needed');

  const perMonth = {};
  for (const d of days) perMonth[d.slice(0, 7)] = (perMonth[d.slice(0, 7)] || 0) + 1;

  db.exec('BEGIN IMMEDIATE');
  try {
    const overlap = db.prepare(`SELECT d.date FROM leave_days d JOIN leaves l ON l.id = d.leave_id
      WHERE l.user_id = ? AND l.status IN ('pending','approved') AND d.date BETWEEN ? AND ? LIMIT 1`).get(u.id, body.from, body.to);
    if (overlap) throw bad(`You already have leave on ${overlap.date}`);
    for (const [month, n] of Object.entries(perMonth)) {
      const left = balance(u.id, month)[body.type].left;
      if (n > left) {
        throw bad(`Not enough ${body.type} leave in ${month}: you asked for ${n} day(s) but ${Math.max(left, 0)} left (limit ${MONTHLY_QUOTA[body.type]}/month)`);
      }
    }
    const id = db.prepare('INSERT INTO leaves (user_id, type, from_date, to_date, days, reason) VALUES (?,?,?,?,?,?)')
      .run(u.id, body.type, body.from, body.to, days.length, reason).lastInsertRowid;
    const ins = db.prepare('INSERT INTO leave_days (leave_id, date) VALUES (?,?)');
    for (const d of days) ins.run(id, d);
    db.exec('COMMIT');
    return { id: Number(id), days: days.length };
  } catch (e) { db.exec('ROLLBACK'); throw e; }
});
route('GET', '/api/leaves', (req, _res, _m, _b, q) => {
  const u = requireUser(req);
  const status = q.get('status');
  const where = [], args = [];
  if (u.role !== 'admin') { where.push('l.user_id = ?'); args.push(u.id); }
  if (['pending', 'approved', 'rejected', 'cancelled'].includes(status)) { where.push('l.status = ?'); args.push(status); }
  return db.prepare(`SELECT l.*, u.name AS employee, u.emp_code FROM leaves l JOIN users u ON u.id = l.user_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY l.created_at DESC, l.id DESC LIMIT 500`).all(...args);
});
route('POST', '/api/leaves/(\\d+)/cancel', (req, _res, m) => {
  const u = requireUser(req);
  const l = db.prepare('SELECT * FROM leaves WHERE id = ? AND user_id = ?').get(Number(m[1]), u.id);
  if (!l) throw new HttpError(404, 'Leave not found');
  if (l.status === 'cancelled' || l.status === 'rejected') throw bad('Already closed');
  if (l.status === 'approved' && l.from_date <= today()) throw bad('Approved leave that has already started cannot be cancelled');
  db.prepare("UPDATE leaves SET status = 'cancelled' WHERE id = ?").run(l.id);
  return { ok: true };
});
route('POST', '/api/leaves/(\\d+)/decide', (req, _res, m, body) => {
  requireAdmin(req);
  if (!['approve', 'reject'].includes(body.action)) throw bad('Action must be approve or reject');
  const l = db.prepare('SELECT * FROM leaves WHERE id = ?').get(Number(m[1]));
  if (!l) throw new HttpError(404, 'Leave not found');
  if (l.status !== 'pending') throw bad('This request has already been decided');
  db.prepare("UPDATE leaves SET status = ?, admin_comment = ?, decided_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(body.action === 'approve' ? 'approved' : 'rejected', String(body.comment || '').slice(0, 300), l.id);
  return { ok: true };
});

// Employees (admin)
route('GET', '/api/employees', (req) => {
  requireAdmin(req);
  const month = today().slice(0, 7);
  return db.prepare("SELECT id, emp_code, name, email, department, active FROM users WHERE role = 'employee' ORDER BY name").all()
    .map((e) => ({ ...e, balance: balance(e.id, month) }));
});
route('POST', '/api/employees', (req, _res, _m, body) => {
  requireAdmin(req);
  const code = String(body.emp_code || '').trim(), name = String(body.name || '').trim();
  if (!/^[A-Za-z0-9_.-]{2,20}$/.test(code)) throw bad('Employee ID must be 2-20 letters/numbers');
  if (!name) throw bad('Name is required');
  if (String(body.password || '').length < 8) throw bad('Password must be at least 8 characters');
  if (db.prepare('SELECT 1 FROM users WHERE lower(emp_code) = lower(?)').get(code)) throw bad('Employee ID already exists');
  db.prepare("INSERT INTO users (emp_code, name, email, department, role, pass_hash) VALUES (?,?,?,?, 'employee', ?)")
    .run(code, name, String(body.email || '').trim(), String(body.department || '').trim(), hashPassword(body.password));
  return { ok: true };
});
route('PATCH', '/api/employees/(\\d+)', (req, _res, m, body) => {
  requireAdmin(req);
  const id = Number(m[1]);
  const e = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'employee'").get(id);
  if (!e) throw new HttpError(404, 'Employee not found');
  if (typeof body.active === 'boolean') {
    db.prepare('UPDATE users SET active = ? WHERE id = ?').run(body.active ? 1 : 0, id);
    if (!body.active) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
  }
  if (body.password !== undefined) {
    if (String(body.password).length < 8) throw bad('Password must be at least 8 characters');
    db.prepare('UPDATE users SET pass_hash = ? WHERE id = ?').run(hashPassword(body.password), id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
  }
  return { ok: true };
});

// ---------- server ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > 100e3) { reject(new HttpError(413, 'Body too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks))); } catch { reject(bad('Invalid JSON')); }
    });
  });
}
const send = (res, status, data, headers = {}) => {
  const body = typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin', ...headers,
  });
  res.end(body);
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) {
      const r = routes.find((x) => x.method === req.method && x.re.test(url.pathname));
      if (!r) throw new HttpError(404, 'Not found');
      let body = {};
      if (req.method !== 'GET') {
        if (!(req.headers['content-type'] || '').startsWith('application/json') && Number(req.headers['content-length'] || 0) > 0) {
          throw bad('Content-Type must be application/json');
        }
        body = await readBody(req);
      }
      res.setHeader('Cache-Control', 'no-store');
      const out = r.handler(req, res, url.pathname.match(r.re), body, url.searchParams);
      return send(res, 200, out, res.hasHeader('Set-Cookie') ? { 'Set-Cookie': res.getHeader('Set-Cookie') } : {});
    }
    // static files
    const rel = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const file = path.join(PUBLIC_DIR, rel);
    if (!file.startsWith(PUBLIC_DIR + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
    }
    send(res, 200, fs.readFileSync(file), {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Content-Security-Policy': "default-src 'self'; style-src 'self'; script-src 'self'",
    });
  } catch (e) {
    if (!(e instanceof HttpError)) console.error(e);
    send(res, e.status || 500, { error: e instanceof HttpError ? e.message : 'Server error' });
  }
}).listen(PORT, () => console.log(`Leave portal running at http://localhost:${PORT}`));
