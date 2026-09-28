const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { PDFParse } = require('pdf-parse');

// Matches SKU codes as they appear in the vendor price lists, e.g.
// "HGS - K301", "HGS - 01", "HGS - G108 - B", "NO-1", "No- 41", "AB :01", "AB : 27".
// An optional leading serial number ("12 No-12 ...") is skipped.
const SKU_LINE_RE = /^(?:\d{1,4}\s+)?([A-Za-z]{1,6}\s*[-:]\s*[A-Za-z]{0,3}\s?\d{1,5}(?:\s*-\s*[A-Za-z](?![A-Za-z]))?)(?:\s+(.*))?$/;
const PRICE_ONLY_RE = /^\d[\d,]*(?:\.\d+)?$/;
const HEADER_CODE_RE = /\b(code|sku)\b/i;
const HEADER_PRICE_RE = /\b(price|rate|mrp|cost|amount)\b/i;
const HEADER_DESC_RE = /\b(desc|description|name|product|item|particulars)\b/i;

// "HGS - K301" -> "HGSK301"; used for de-duplication and forgiving search.
const normalizeSku = (sku) => String(sku || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// Tidy spacing so the same code always displays the same way: "HGS-K301" -> "HGS - K301".
const formatSku = (sku) =>
  String(sku || '')
    .trim()
    .replace(/\s*([-:])\s*/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .toUpperCase();

const parsePrice = (raw) => {
  const text = String(raw ?? '').trim();
  if (!text || /^n\/?a$/i.test(text)) {
    return { price: text.toUpperCase() === 'N/A' ? 'N/A' : '', priceValue: null, plusGst: false };
  }
  const num = text.match(/\d[\d,]*(?:\.\d+)?/);
  return {
    price: text,
    priceValue: num ? Number(num[0].replace(/,/g, '')) : null,
    // The source lists sometimes misspell it ("350+gdt").
    plusGst: /\+\s*g[sd]t/i.test(text)
  };
};

// A remainder like "375+gst", "N/A", "450 ml - 255, 500 ml-295" or "Box 25+gst , pen 6+gst"
// is a price; anything else starting with a word is a description.
const looksLikePrice = (text) => /^\d/.test(text) || /^n\/?a$/i.test(text) || /^box\b.*\d/i.test(text);

const makeItem = ({ sku, price, description, section }) => ({
  sku: formatSku(sku),
  skuKey: normalizeSku(sku),
  description: (description || '').replace(/\s+/g, ' ').trim(),
  section: section || '',
  ...parsePrice(price)
});

// ---------------------------------------------------------------- PDF

const parsePdfText = (text) => {
  const items = [];
  const orphanPrices = [];
  const warnings = [];
  let section = '';

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^--\s*\d+\s+of\s+\d+\s*--$/.test(l));

  for (const line of lines) {
    // Table headings such as "6 in 1 - Code Price" start a new section.
    if (HEADER_CODE_RE.test(line) && !SKU_LINE_RE.test(line)) {
      const heading = line.replace(/\b(code|price|sku|rate)\b/gi, '').replace(/[-\s]+$/, '').trim();
      if (/\d\s*in\s*\d/i.test(heading)) section = heading;
      continue;
    }

    const m = line.match(SKU_LINE_RE);
    if (m) {
      const rest = (m[2] || '').trim();
      if (!rest) {
        items.push(makeItem({ sku: m[1], price: '', section }));
      } else if (looksLikePrice(rest)) {
        items.push(makeItem({ sku: m[1], price: rest, section }));
      } else {
        items.push(makeItem({ sku: m[1], price: '', description: rest, section }));
      }
      continue;
    }

    // Some lists put the RATE column on its own pages after the codes.
    if (PRICE_ONLY_RE.test(line)) orphanPrices.push(line);
  }

  if (orphanPrices.length) {
    const unpriced = items.filter((i) => !i.price);
    if (orphanPrices.length === unpriced.length) {
      unpriced.forEach((item, idx) => Object.assign(item, parsePrice(orphanPrices[idx])));
    } else {
      warnings.push(
        `The RATE column is on separate pages and has blank cells (${orphanPrices.length} rates for ${unpriced.length} codes), ` +
          'so rates could not be matched to codes reliably. Codes were imported without a price — upload the Excel version of this list for prices.'
      );
    }
  }

  return { items, warnings };
};

const parsePdf = async (filePath) => {
  const parser = new PDFParse({ data: fs.readFileSync(filePath) });
  try {
    const { text } = await parser.getText();
    return parsePdfText(text || '');
  } finally {
    await parser.destroy();
  }
};

// ---------------------------------------------------------------- Excel

const findColumns = (row) => {
  const cells = row.map((c) => String(c ?? '').trim());
  const code = cells.findIndex((c) => HEADER_CODE_RE.test(c));
  if (code === -1) return null;
  const price = cells.findIndex((c, i) => i !== code && HEADER_PRICE_RE.test(c));
  const desc = cells.findIndex((c, i) => i !== code && i !== price && HEADER_DESC_RE.test(c));
  const heading = cells[code].replace(/\b(code|sku|no\.?)\b/gi, '').replace(/[-\s]+$/, '').trim();
  return { code, price, desc, section: /\d\s*in\s*\d/i.test(heading) ? heading : '' };
};

const parseExcel = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const items = [];

  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '', raw: false });
    let cols = null;

    for (const row of rows) {
      const header = findColumns(row);
      if (header) {
        cols = header;
        continue;
      }

      const cells = row.map((c) => String(c ?? '').trim());
      if (!cells.some(Boolean)) continue;

      if (cols) {
        const sku = cells[cols.code];
        if (!sku || !SKU_LINE_RE.test(sku)) continue;
        items.push(
          makeItem({
            sku: sku.match(SKU_LINE_RE)[1],
            price: cols.price >= 0 ? cells[cols.price] : '',
            description: cols.desc >= 0 ? cells[cols.desc] : '',
            section: cols.section
          })
        );
      } else {
        // No header row: treat the row like a line of PDF text ("HGS - K301 | 375+gst").
        items.push(...parsePdfText(cells.filter(Boolean).join(' ')).items);
      }
    }
  }

  return { items, warnings: [] };
};

// ---------------------------------------------------------------- Entry point

const parsePriceListFile = async (filePath, originalName) => {
  const ext = path.extname(originalName || filePath).toLowerCase();
  const result = ext === '.pdf' ? await parsePdf(filePath) : parseExcel(filePath);

  // Within one file the last occurrence of a code wins.
  const byKey = new Map();
  result.items.filter((i) => i.skuKey).forEach((i) => byKey.set(i.skuKey, i));
  return { items: [...byKey.values()], warnings: result.warnings };
};

// "3 in 1 - updated price list.pdf" -> "3 in 1"
const categoryFromFileName = (name) =>
  path
    .basename(name || '', path.extname(name || ''))
    .replace(/\b(updated|price\s*list|pricelist|copy)\b/gi, '')
    .replace(/[\s\-_]+$/g, '')
    .replace(/^[\s\-_]+/g, '')
    .replace(/\s+/g, ' ')
    .trim() || 'Uncategorized';

module.exports = { parsePriceListFile, parsePdfText, normalizeSku, categoryFromFileName };
