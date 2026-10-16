'use strict';
const root = document.getElementById('app');
let me = null, cfg = null, tab = 'dashboard';
let calMonth = null, holYear = null;

// Tiny DOM helper. Text is always set via textContent/createTextNode, never innerHTML.
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(kid));
  return el;
}
async function api(method, url, body) {
  const r = await fetch(url, {
    method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 && me) { me = null; render(); }
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const niceDate = (s) => { const [y, m, d] = s.split('-'); return `${+d} ${MONTHS[+m - 1].slice(0, 3)} ${y}`; };
const range = (l) => (l.from_date === l.to_date ? niceDate(l.from_date) : `${niceDate(l.from_date)} → ${niceDate(l.to_date)}`);
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const msg = (kind, text) => h('div', { class: `msg ${kind}` }, text);
function flash(box, kind, text) { box.replaceChildren(msg(kind, text)); }

// ---------- shell ----------
async function boot() {
  try { const r = await api('GET', '/api/me'); me = r.user; cfg = r; } catch { me = null; }
  if (me) { calMonth = cfg.today.slice(0, 7); holYear = cfg.today.slice(0, 4); }
  render();
}
function render() {
  root.replaceChildren();
  if (!me) return root.append(loginView());
  const tabs = me.role === 'admin'
    ? [['dashboard', 'Requests'], ['calendar', 'Calendar'], ['holidays', 'Holidays'], ['employees', 'Employees'], ['account', 'Account']]
    : [['dashboard', 'My Leave'], ['apply', 'Apply'], ['calendar', 'Calendar'], ['holidays', 'Holidays'], ['account', 'Account']];
  if (!tabs.some((t) => t[0] === tab)) tab = 'dashboard';
  const body = h('main');
  root.append(
    h('header', {}, h('h1', {}, 'Leave Portal'), h('span', { class: 'who' }, `${me.name} (${me.emp_code})`),
      h('button', { class: 'btn sec sm', onclick: async () => { await api('POST', '/api/logout'); me = null; render(); } }, 'Log out')),
    h('nav', {}, tabs.map(([id, label]) => h('button', { class: id === tab ? 'on' : '', onclick: () => { tab = id; render(); } }, label))),
    body);
  const view = { dashboard: me.role === 'admin' ? adminRequests : myLeaves, apply: applyView, calendar: calendarView, holidays: holidaysView, employees: employeesView, account: accountView }[tab];
  Promise.resolve(view(body)).catch((e) => body.append(msg('err', e.message)));
}

function loginView() {
  const err = h('div');
  const form = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      try {
        me = (await api('POST', '/api/login', { emp_code: form.emp.value, password: form.pw.value }));
        cfg = await api('GET', '/api/me'); me = cfg.user; tab = 'dashboard';
        calMonth = cfg.today.slice(0, 7); holYear = cfg.today.slice(0, 4); render();
      } catch (x) { flash(err, 'err', x.message); }
    },
  }, h('label', {}, 'Employee ID', h('input', { name: 'emp', autocomplete: 'username', required: true, autofocus: true })),
    h('label', {}, 'Password', h('input', { name: 'pw', type: 'password', autocomplete: 'current-password', required: true })),
    err, h('button', { class: 'btn', type: 'submit' }, 'Log in'));
  return h('div', { class: 'login' }, h('div', { class: 'card' }, h('h2', {}, 'Leave Portal — Log in'), form));
}

// ---------- employee ----------
async function myLeaves(body) {
  const [{ balance }, leaves] = await Promise.all([api('GET', '/api/balance'), api('GET', '/api/leaves')]);
  const month = cfg.today.slice(0, 7);
  body.append(
    h('div', { class: 'card' }, h('h2', {}, `This month's balance — ${MONTHS[+month.slice(5) - 1]} ${month.slice(0, 4)}`),
      h('div', { class: 'bal' }, Object.entries(balance).map(([t, b]) =>
        h('div', {}, h('b', {}, `${b.left} / ${b.quota}`), h('small', {}, `${cap(t)} leave left`)))),
      h('p', { class: 'muted' }, 'Monthly quota: 1 casual + 2 sick. Unused leave does not carry over. Pending requests count against your balance.')),
    h('div', { class: 'card' }, h('h2', {}, 'My requests'), leaveTable(leaves, false)));
}
function leaveTable(leaves, admin, reload) {
  if (!leaves.length) return h('p', { class: 'muted' }, 'Nothing here yet.');
  return h('div', { class: 'tablewrap' }, h('table', {},
    h('thead', {}, h('tr', {}, admin && h('th', {}, 'Employee'), h('th', {}, 'Dates'), h('th', {}, 'Type'), h('th', {}, 'Days'), h('th', {}, 'Reason'), h('th', {}, 'Status'), h('th', {}))),
    h('tbody', {}, leaves.map((l) => h('tr', {},
      admin && h('td', {}, `${l.employee} (${l.emp_code})`),
      h('td', {}, range(l)), h('td', {}, cap(l.type)), h('td', {}, l.days),
      h('td', {}, l.reason, l.admin_comment && h('div', { class: 'muted' }, `HR: ${l.admin_comment}`)),
      h('td', {}, h('span', { class: `pill ${l.status}` }, cap(l.status))),
      h('td', {}, admin ? (l.status === 'pending' ? decideButtons(l, reload) : null)
        : (['pending', 'approved'].includes(l.status) && h('button', { class: 'btn sec sm', onclick: async () => {
          if (!confirm('Cancel this leave request?')) return;
          try { await api('POST', `/api/leaves/${l.id}/cancel`); render(); } catch (e) { alert(e.message); }
        } }, 'Cancel'))))))));
}
function applyView(body) {
  const box = h('div');
  const f = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      try {
        const r = await api('POST', '/api/leaves', { type: f.type.value, from: f.from.value, to: f.to.value, reason: f.reason.value });
        f.reset(); flash(box, 'ok', `Request submitted for ${r.days} working day(s). Weekends and holidays are not counted.`);
      } catch (x) { flash(box, 'err', x.message); }
    },
  },
    h('div', { class: 'row' },
      h('label', {}, 'Leave type', h('select', { name: 'type' }, h('option', { value: 'casual' }, 'Casual (1 per month)'), h('option', { value: 'sick' }, 'Sick (2 per month)'))),
      h('label', {}, 'From', h('input', { type: 'date', name: 'from', required: true })),
      h('label', {}, 'To', h('input', { type: 'date', name: 'to', required: true }))),
    h('label', {}, 'Reason', h('textarea', { name: 'reason', rows: 3, maxlength: 500, required: true })),
    box, h('button', { class: 'btn', type: 'submit' }, 'Submit request'));
  f.from.addEventListener('change', () => { if (!f.to.value || f.to.value < f.from.value) f.to.value = f.from.value; f.to.min = f.from.value; });
  body.append(h('div', { class: 'card' }, h('h2', {}, 'Apply for leave'), f));
}

// ---------- calendar ----------
async function calendarView(body) {
  const data = await api('GET', `/api/calendar?month=${calMonth}`);
  const [y, m] = calMonth.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(), count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const hol = Object.fromEntries(data.holidays.map((x) => [x.date, x]));
  const lv = {};
  for (const l of data.leaves) (lv[l.date] ||= []).push(l);
  const shift = (d) => { const t = new Date(Date.UTC(y, m - 1 + d, 1)); calMonth = t.toISOString().slice(0, 7); render(); };
  const cells = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => h('div', { class: 'dow' }, d));
  for (let i = 0; i < first; i++) cells.push(h('div', { class: 'day blank' }));
  for (let d = 1; d <= count; d++) {
    const date = `${calMonth}-${String(d).padStart(2, '0')}`, dow = (first + d - 1) % 7, ho = hol[date];
    cells.push(h('div', { class: ['day', data.weeklyOff.includes(dow) && 'off', ho && (ho.type === 'festival' ? 'fest' : 'hol'), date === cfg.today && 'today'].filter(Boolean).join(' ') },
      h('span', { class: 'n' }, d),
      ho && h('span', { class: `tag ${ho.type === 'festival' ? 'fest' : 'hol'}`, title: ho.name }, ho.name),
      (lv[date] || []).map((l) => h('span', { class: 'tag leave', title: `${l.name} — ${l.type} (${l.status})` }, me.role === 'admin' ? `${l.name} · ${l.type[0].toUpperCase()}` : `${cap(l.type)}${l.status === 'pending' ? ' (pending)' : ''}`))));
  }
  body.append(h('div', { class: 'card' },
    h('div', { class: 'cal-head' }, h('button', { class: 'btn sec sm', onclick: () => shift(-1) }, '‹'), h('h2', {}, `${MONTHS[m - 1]} ${y}`),
      h('button', { class: 'btn sec sm', onclick: () => { calMonth = cfg.today.slice(0, 7); render(); } }, 'Today'), h('button', { class: 'btn sec sm', onclick: () => shift(1) }, '›')),
    h('div', { class: 'cal' }, cells),
    h('div', { class: 'legend' }, h('span', {}, '🟥 National holiday'), h('span', {}, '🟨 Festival holiday'), h('span', {}, '⬜ Weekly off'), h('span', {}, '🟦 Leave'))));
}

// ---------- holidays ----------
async function holidaysView(body) {
  const list = await api('GET', `/api/holidays?year=${holYear}`);
  const admin = me.role === 'admin';
  const box = h('div');
  const dayName = (s) => new Date(`${s}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'UTC' });
  if (admin) {
    const f = h('form', {
      onsubmit: async (e) => {
        e.preventDefault();
        try { await api('POST', '/api/holidays', { date: f.date.value, name: f.name.value, type: f.type.value }); render(); } catch (x) { flash(box, 'err', x.message); }
      },
    }, h('div', { class: 'row' },
      h('label', {}, 'Date', h('input', { type: 'date', name: 'date', required: true })),
      h('label', {}, 'Name', h('input', { name: 'name', required: true, maxlength: 80 })),
      h('label', {}, 'Type', h('select', { name: 'type' }, h('option', { value: 'national' }, 'National'), h('option', { value: 'festival' }, 'Festival'), h('option', { value: 'company' }, 'Company')))),
      box, h('button', { class: 'btn', type: 'submit' }, 'Add holiday'));
    body.append(h('div', { class: 'card' }, h('h2', {}, 'Add a holiday'), f));
  }
  const yr = Number(holYear);
  body.append(h('div', { class: 'card' },
    h('div', { class: 'cal-head' }, h('button', { class: 'btn sec sm', onclick: () => { holYear = String(yr - 1); render(); } }, '‹'),
      h('h2', {}, `Holidays ${yr}`), h('button', { class: 'btn sec sm', onclick: () => { holYear = String(yr + 1); render(); } }, '›')),
    list.length ? h('div', { class: 'tablewrap' }, h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Date'), h('th', {}, 'Day'), h('th', {}, 'Holiday'), h('th', {}, 'Type'), admin && h('th', {}))),
      h('tbody', {}, list.map((x) => h('tr', {}, h('td', {}, niceDate(x.date)), h('td', {}, dayName(x.date)), h('td', {}, x.name), h('td', {}, cap(x.type)),
        admin && h('td', {}, h('button', { class: 'btn sec sm', onclick: async () => { if (confirm(`Remove ${x.name}?`)) { await api('DELETE', `/api/holidays/${x.id}`); render(); } } }, 'Remove')))))))
      : h('p', { class: 'muted' }, 'No holidays added for this year.'),
    h('p', { class: 'muted' }, 'Festival dates follow the lunar calendar and can shift by a day — HR should confirm against the official list.')));
}

// ---------- admin ----------
async function adminRequests(body) {
  const reload = () => render();
  const leaves = await api('GET', `/api/leaves?status=${adminFilter}`);
  body.append(h('div', { class: 'card' }, h('h2', {}, 'Leave requests'), leaveTable(leaves, true, reload),
    h('p', {}, h('button', { class: 'btn sec sm', onclick: () => { adminFilter = adminFilter === 'pending' ? '' : 'pending'; render(); } }, adminFilter === 'pending' ? 'Show all requests' : 'Show only pending'))));
}
let adminFilter = 'pending';
function decideButtons(l, reload) {
  const act = (action) => async () => {
    const comment = action === 'reject' ? prompt('Reason for rejecting (optional):') : '';
    if (comment === null) return;
    try { await api('POST', `/api/leaves/${l.id}/decide`, { action, comment }); reload(); } catch (e) { alert(e.message); }
  };
  return h('div', { class: 'row' }, h('button', { class: 'btn ok sm', onclick: act('approve') }, 'Approve'), h('button', { class: 'btn no sm', onclick: act('reject') }, 'Reject'));
}
async function employeesView(body) {
  const emps = await api('GET', '/api/employees');
  const box = h('div');
  const f = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      try {
        await api('POST', '/api/employees', Object.fromEntries(new FormData(f)));
        render();
      } catch (x) { flash(box, 'err', x.message); }
    },
  }, h('div', { class: 'row' },
    h('label', {}, 'Employee ID', h('input', { name: 'emp_code', required: true })), h('label', {}, 'Full name', h('input', { name: 'name', required: true })),
    h('label', {}, 'Email', h('input', { name: 'email', type: 'email' })), h('label', {}, 'Department', h('input', { name: 'department' })),
    h('label', {}, 'Initial password (min 8)', h('input', { name: 'password', type: 'text', minlength: 8, required: true, autocomplete: 'off' }))),
    box, h('button', { class: 'btn', type: 'submit' }, 'Add employee'));
  body.append(h('div', { class: 'card' }, h('h2', {}, 'Add employee'), f),
    h('div', { class: 'card' }, h('h2', {}, 'Employees'), emps.length ? h('div', { class: 'tablewrap' }, h('table', {},
      h('thead', {}, h('tr', {}, ['ID', 'Name', 'Dept', 'Casual left', 'Sick left', 'Status', ''].map((x) => h('th', {}, x)))),
      h('tbody', {}, emps.map((e) => h('tr', {}, h('td', {}, e.emp_code), h('td', {}, e.name, e.email && h('div', { class: 'muted' }, e.email)), h('td', {}, e.department || '—'),
        h('td', {}, `${e.balance.casual.left}/${e.balance.casual.quota}`), h('td', {}, `${e.balance.sick.left}/${e.balance.sick.quota}`),
        h('td', {}, e.active ? 'Active' : 'Disabled'),
        h('td', {}, h('div', { class: 'row' },
          h('button', { class: 'btn sec sm', onclick: async () => { const pw = prompt(`New password for ${e.name} (min 8 chars):`); if (pw) { try { await api('PATCH', `/api/employees/${e.id}`, { password: pw }); alert('Password reset.'); } catch (x) { alert(x.message); } } } }, 'Reset password'),
          h('button', { class: 'btn sec sm', onclick: async () => { await api('PATCH', `/api/employees/${e.id}`, { active: !e.active }); render(); } }, e.active ? 'Disable' : 'Enable'))))))))
      : h('p', { class: 'muted' }, 'No employees yet. Add the first one above.')));
}

function accountView(body) {
  const box = h('div');
  const f = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      try { await api('POST', '/api/password', { current: f.cur.value, next: f.nw.value }); f.reset(); flash(box, 'ok', 'Password changed.'); } catch (x) { flash(box, 'err', x.message); }
    },
  }, h('label', {}, 'Current password', h('input', { name: 'cur', type: 'password', required: true, autocomplete: 'current-password' })),
    h('label', {}, 'New password (min 8)', h('input', { name: 'nw', type: 'password', required: true, minlength: 8, autocomplete: 'new-password' })),
    box, h('button', { class: 'btn', type: 'submit' }, 'Change password'));
  body.append(h('div', { class: 'card' }, h('h2', {}, 'Change password'), f));
}

boot();
