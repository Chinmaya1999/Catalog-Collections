const { ocrRegion } = require('./ocr');

// Region boundaries as fractions of the full rendered page (left, top, width, height, all 0-1).
// Calibrated against this catalog's template (one product per page: name/material top-left,
// hero photo + "Available in" colour swatches on the right, a SKU table along the bottom).
// A different catalog layout would need different regions - this module is the one place that
// would need to change to support one.
const REGIONS = {
  title: { left: 0, top: 0.06, width: 0.55, height: 0.22 },
  colors: { left: 0.76, top: 0.14, width: 0.24, height: 0.78 },
  table: { left: 0.03, top: 0.72, width: 0.76, height: 0.26 }
};

// The table always has these 6 columns, left to right.
const COLUMN_KEYS = ['sku', 'description', 'dimensionsCm', 'weightKg', 'volumeLtr', 'mrp'];

// Splitting by a fixed x-fraction per column (calibrated against one page) turned out too
// brittle - a value landing a handful of pixels the wrong side of a boundary silently moved
// into the neighbouring cell (observed: an MRP value falling into the volume cell, dropping
// the whole row). Instead, split each row where the gaps between its own words are largest -
// self-calibrating per row, and matches how a table visually reads regardless of exactly where
// each column happens to sit on a given page. Table-border "|" characters that OCR occasionally
// reads as a standalone word are dropped first so they don't fragment a real gap into two.
function splitRowIntoColumns(row) {
  const words = row.filter(w => !/^[|Il]{1,2}$/.test(w.text));
  const cells = COLUMN_KEYS.reduce((acc, k) => ({ ...acc, [k]: '' }), {});
  if (words.length === 0) return cells;

  const gaps = [];
  for (let i = 0; i < words.length - 1; i++) {
    gaps.push({ afterIndex: i, size: words[i + 1].x - (words[i].x + words[i].width) });
  }
  gaps.sort((a, b) => b.size - a.size);
  const numSplits = Math.min(COLUMN_KEYS.length - 1, gaps.length);
  const splitAfter = new Set(gaps.slice(0, numSplits).map(g => g.afterIndex));

  const groups = [];
  let current = [];
  for (let i = 0; i < words.length; i++) {
    current.push(words[i]);
    if (splitAfter.has(i)) {
      groups.push(current);
      current = [];
    }
  }
  if (current.length) groups.push(current);

  // Fewer than 6 groups means a column went unread somewhere - map what was found to columns
  // left-to-right (SKU/Description are the most reliably-read columns and always come first,
  // so this keeps them correct even when a later numeric cell is missing).
  groups.forEach((group, i) => {
    const key = COLUMN_KEYS[i];
    if (key) cells[key] = group.map(w => w.text).join(' ');
  });
  return cells;
}

function cleanText(s) {
  return s.replace(/[|]+/g, ' ').replace(/\s+/g, ' ').trim();
}

// Strips everything but digits/dot/comma, then parses. Returns null only when nothing numeric
// was read at all - otherwise passes through whatever OCR found (including any digit-recognition
// noise) since a mandatory human review step follows and a garbled-but-present number is more
// useful to a reviewer than a silently blank field.
function parseNumber(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d.,]/g, '').replace(/,/g, '');
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

function parseTableRows(rows) {
  const parsed = [];
  for (const row of rows) {
    const cells = splitRowIntoColumns(row);
    const sku = cleanText(cells.sku);
    const mrpText = cleanText(cells.mrp);
    // A real data row has digits in both the SKU and MRP cells, and every SKU in this catalog
    // follows an "XXX (X) XX ###" pattern - both checks together rule out the header row and
    // stray marketing-page text that happens to contain a number (e.g. a "15,000 cycles"
    // durability claim was briefly misread as a table row before this check was added).
    if (!/\d/.test(sku) || !/\d/.test(mrpText) || !/\(X\)|XX/i.test(sku)) continue;

    parsed.push({
      sku: sku || null,
      description: cleanText(cells.description) || null,
      dimensionsCm: cleanText(cells.dimensionsCm) || null,
      weightKg: parseNumber(cells.weightKg),
      volumeLtr: parseNumber(cells.volumeLtr),
      mrp: parseNumber(mrpText)
    });
  }
  return parsed;
}

const COLOR_LINE = /^([A-Za-z][A-Za-z\/\s]{1,28}?)\s*[:;]\s*([A-Za-z0-9]{1,4})\s*$/;

function parseColorLines(text) {
  const colors = [];
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || /^available/i.test(line)) continue;
    const match = line.match(COLOR_LINE);
    if (match) {
      colors.push({ name: match[1].trim(), code: match[2].trim() });
    }
  }
  return colors;
}

function parseName(nameOcrText) {
  const lines = nameOcrText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  // A short second line (e.g. "STYLE 01") is a size/style suffix, not a separate product.
  if (lines[1] && lines[1].length <= 20) return `${lines[0]} ${lines[1]}`;
  return lines[0];
}

function parseMaterial(materialOcrText) {
  const materialLine = materialOcrText.split('\n').map(l => l.trim()).find(l => /^material/i.test(l));
  if (!materialLine) return null;
  return materialLine.replace(/^material\s*[-–:]?\s*/i, '').trim() || null;
}

// Drop-in replacement for the old AI vision call: reads the same rendered page image but via
// OCR + layout heuristics instead of a paid API. Returns the same shape aiStructure.js did so
// pipeline.js doesn't need to change how it consumes the result. Calls are sequential (not
// Promise.all) - see the warning in ocr.js about concurrent calls on the shared worker.
async function structurePage(pageImagePath) {
  // PSM 11 ("sparse text") reliably finds the big bold headline; PSM 3 (auto) reliably finds the
  // small pill-shaped material badge - neither mode reads both well, so the same crop is read
  // twice. PSM 4 (single column of variable-size text) is what actually reads the "Available
  // in:" colour labels and the SKU table without them, both modes tried, fell back to garbage.
  const nameResult = await ocrRegion(pageImagePath, REGIONS.title, 11);
  const materialResult = await ocrRegion(pageImagePath, REGIONS.title, 3);
  const colorsResult = await ocrRegion(pageImagePath, REGIONS.colors, 4);
  const tableResult = await ocrRegion(pageImagePath, REGIONS.table, 4);

  const variants = parseTableRows(tableResult.rows);
  if (variants.length === 0) {
    return { isProductPage: false, products: [] };
  }

  const name = parseName(nameResult.text);
  const material = parseMaterial(materialResult.text);
  const colors = parseColorLines(colorsResult.text);

  return {
    isProductPage: true,
    products: [{
      name,
      brand: null,
      material,
      description: null,
      badges: [],
      variants,
      colors,
      confidence: 0.55,
      rawOcrText: {
        name: nameResult.text,
        material: materialResult.text,
        colors: colorsResult.text,
        table: tableResult.text
      }
    }]
  };
}

module.exports = { structurePage };
