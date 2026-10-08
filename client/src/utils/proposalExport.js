import { getImageUrl } from '../config/api';

// A proposal row, as built by the Shop page:
// { id, code, supplierCode, name, category, image, priced, shown, base, addons, landed, profit, margin, qty }
// `shown` is the per-unit price the customer sees; base/addons/landed/profit/margin are internal and
// only present for the superadmin's My pricing view.

const inrText = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const rsText = (n) => `Rs. ${Math.round(n).toLocaleString('en-IN')}`;

const byPrice = (rows) => rows.filter((r) => r.priced).sort((a, b) => a.shown - b.shown);

export const buildWhatsAppText = (rows, { brand, sub, customer, note, footer, contact, gst, totals }) => {
  const lines = [`*${brand}${sub ? ` · ${sub}` : ''}*`, customer ? `Gift options for ${customer}` : 'Gift options', ''];
  byPrice(rows).forEach((r, i) => {
    lines.push(`${i + 1}. ${r.code ? `${r.code} – ` : ''}${r.name}`);
    lines.push(`   ${inrText(r.shown)} per unit ${gst}${totals && r.qty > 0 ? ` · ${r.qty} pcs = ${inrText(r.shown * r.qty)}` : ''}`);
  });
  if (note) lines.push('', note);
  if (footer) lines.push('', `_${footer}_`);
  if (contact) lines.push(contact);
  return lines.join('\n');
};

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const fixed = (n, d = 2) => (typeof n === 'number' ? n.toFixed(d) : '');

export const buildCostingCsv = (rows, gst) => {
  const head = ['Customer code', 'Supplier code', 'Category', 'Item', 'Supplier cost', 'Add-ons', 'Landed cost', 'Profit per unit',
    'Margin %', 'Price per unit', 'GST basis', 'Qty', 'Order value', 'Order profit'];
  const lines = [head.map(csvCell).join(',')];
  rows.forEach((r) => {
    lines.push([
      r.code, r.supplierCode, r.category, r.name,
      r.priced ? fixed(r.base) : '', r.priced ? fixed(r.addons) : '', r.priced ? fixed(r.landed) : '', r.priced ? fixed(r.profit) : '',
      r.priced ? fixed(r.margin, 1) : '', r.priced ? fixed(r.shown) : '', gst, r.qty || '',
      r.priced && r.qty ? fixed(r.shown * r.qty) : '', r.priced && r.qty ? fixed(r.profit * r.qty) : ''
    ].map(csvCell).join(','));
  });
  return lines.join('\n');
};

// jsPDF's built-in fonts are Latin-1 only, so swap the rupee sign and typographic punctuation.
const latin = (s) => String(s || '')
  .replace(/₹/g, 'Rs. ').replace(/[–—]/g, '-').replace(/[’‘]/g, "'").replace(/[“”]/g, '"')
  .replace(/[^\x20-\xFF]/g, '');

// Fetch a photo and re-encode it as a letterboxed JPEG so any source format (webp/png) embeds in the PDF.
// Resolves null on any failure (CORS, 404, decode) - the card then shows "Photo on request".
const photoAsJpeg = async (path, w, h) => {
  if (!path) return null;
  try {
    const res = await fetch(getImageUrl(path));
    if (!res.ok) return null;
    const url = URL.createObjectURL(await res.blob());
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const g = canvas.getContext('2d');
      g.fillStyle = '#fff';
      g.fillRect(0, 0, w, h);
      const scale = Math.min(w / img.width, h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      g.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      return canvas.toDataURL('image/jpeg', 0.82);
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return null;
  }
};

/** Customer-facing PDF: 3-up grid of photo cards with code, name and price. Returns { blob, filename }. */
export const buildCustomerPdf = async (rows, { brand, sub, contact, footer, customer, note, gst, totals }) => {
  const { jsPDF } = await import('jspdf');
  const list = byPrice(rows);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const ACC = [13, 106, 85];
  const INK = [23, 33, 30];
  const MUT = [100, 112, 108];
  const W = 210;
  const M = 14;
  const cols = 3;
  const gap = 6;
  const cw = (W - 2 * M - gap * (cols - 1)) / cols;
  const ih = 46;
  const ch = ih + 27;

  const header = (first) => {
    doc.setFillColor(...ACC); doc.rect(0, 0, W, 3, 'F');
    doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(first ? 18 : 12);
    doc.text(latin(brand), M, first ? 16 : 12);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUT);
    if (first) {
      doc.text(latin(sub), M, 21.5);
      if (contact) doc.text(latin(contact), M, 26.5);
      doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text(latin(customer ? `Gift options for ${customer}` : 'Gift options'), W - M, 16, { align: 'right' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUT);
      doc.text(`${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}  ·  ${list.length} products`, W - M, 21.5, { align: 'right' });
      const lo = list[0].shown;
      const hi = list[list.length - 1].shown;
      doc.text(latin(`${rsText(lo)}${hi !== lo ? ` - ${rsText(hi)}` : ''} per unit ${gst}`), W - M, 26.5, { align: 'right' });
    }
    doc.setDrawColor(220, 225, 222); doc.line(M, first ? 31 : 16, W - M, first ? 31 : 16);
    return first ? 36 : 21;
  };

  let y = header(true);
  if (note) {
    doc.setFontSize(9.5); doc.setTextColor(...INK);
    const t = doc.splitTextToSize(latin(note), W - 2 * M);
    doc.text(t, M, y + 2);
    y += t.length * 4.4 + 4;
  }

  let col = 0;
  for (const r of list) {
    if (col === 0 && y + ch > 283) { doc.addPage(); y = header(false); }
    const x = M + col * (cw + gap);
    doc.setDrawColor(225, 229, 226); doc.setFillColor(255, 255, 255); doc.roundedRect(x, y, cw, ch, 2, 2, 'FD');
    // eslint-disable-next-line no-await-in-loop
    const jpeg = await photoAsJpeg(r.image, 520, Math.round((520 * ih) / cw));
    if (jpeg) {
      doc.addImage(jpeg, 'JPEG', x + 0.6, y + 0.6, cw - 1.2, ih - 1.2);
    } else {
      doc.setFillColor(240, 243, 241); doc.rect(x + 0.6, y + 0.6, cw - 1.2, ih - 1.2, 'F');
      doc.setFontSize(8); doc.setTextColor(...MUT); doc.text('Photo on request', x + cw / 2, y + ih / 2, { align: 'center' });
    }
    const ty = y + ih + 4.5;
    doc.setFont('courier', 'bold'); doc.setFontSize(8); doc.setTextColor(...MUT); doc.text(latin(r.code), x + 3, ty);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...INK);
    doc.text(doc.splitTextToSize(latin(r.name), cw - 6).slice(0, 2), x + 3, ty + 4.2);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5); doc.setTextColor(...ACC); doc.text(rsText(r.shown), x + 3, y + ch - 4);
    const pw = doc.getTextWidth(rsText(r.shown));
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUT); doc.text(gst, x + 4.5 + pw, y + ch - 4);
    if (totals && r.qty > 0) doc.text(`${r.qty} pcs = ${rsText(r.shown * r.qty)}`, x + cw - 3, y + ch - 4, { align: 'right' });
    col += 1;
    if (col === cols) { col = 0; y += ch + gap; }
  }
  if (col) y += ch + gap;

  const withQty = list.filter((r) => r.qty > 0);
  if (totals && withQty.length) {
    if (y + 14 > 283) { doc.addPage(); y = header(false); }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...INK);
    const units = withQty.reduce((a, r) => a + r.qty, 0);
    const value = withQty.reduce((a, r) => a + r.shown * r.qty, 0);
    doc.text(latin(`Total for ${units.toLocaleString('en-IN')} units: ${rsText(value)} ${gst}`), W - M, y + 4, { align: 'right' });
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUT);
    doc.text(doc.splitTextToSize(latin(footer), W - 2 * M - 20), M, 289);
    doc.text(`${i} / ${pages}`, W - M, 289, { align: 'right' });
  }

  const filename = latin(`${brand || 'Gift'} - ${customer || 'gift options'}.pdf`).replace(/[\\/:*?"<>|]/g, '');
  return { blob: doc.output('blob'), filename };
};

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
