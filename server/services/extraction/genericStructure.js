const { ocrRegion } = require('./ocr');
const { getImagePositions } = require('./imagePositions');
const sharp = require('sharp');

// Fallback for catalogs that don't match the tuned template in heuristicStructure.js (a
// different brand/category - t-shirts, electronics, gifts, bottles, ...). It makes no
// assumption about where anything sits on the page: it OCRs the whole page, looks for
// price-shaped text anywhere, treats each cluster of nearby lines containing a price as one
// product, and assigns the nearest embedded image by position. This generalizes to far more
// layouts than the fixed-region pipeline, but is intentionally the lower-precision tier - it
// has not been calibrated against a real sample of any specific non-AMT catalog, unlike
// heuristicStructure.js which was verified field-by-field against the real target PDF.
// \b boundaries matter here - without them "Rs" matches inside ordinary words like "yea-RS,"
// (found on a marketing page during testing), and the digit group must start with an actual
// digit so a run of bare commas can't satisfy it.
// The boundary on "Rs" sits right after the letters (\bRs\b), not after the optional trailing
// period (the old \bRs\.?\b) - a period is a non-word character, so when it's followed by
// another non-word character (almost always: "Rs. 1599", "Rs. " before a space) there is no
// word/non-word transition there for \b to match, and the whole alternative silently failed to
// match a hugely common real-world price format.
const CURRENCY_PRICE = /(?:₹|\bRs\b\.?|\bINR\b|\bMRP\b|\bPrice\b)\s*[:\-]?\s*(\d[\d,]*(?:\.\d{1,2})?)/i;

// Wholesale/B2B catalogs (seen in a real VIP Industries corporate catalog) often quote a "Net
// Rate"/"Base Rate" as "<number>+GST@<pct>%" instead of a currency symbol - e.g. "1440+GST@18%".
// The "+GST@" suffix is distinctive enough to be safe to match anywhere in a block's text
// (unlike BARE_PRICE below, it doesn't need the whole-line guard), and unlike CURRENCY_PRICE it
// doesn't require the number to sit immediately next to a keyword - useful since in a table this
// value is a whole table cell away from any "Net Rate"/"Base Rate" header.
const GST_SUFFIXED_PRICE = /(\d[\d,]*(?:\.\d{1,2})?)\s*\+\s*GST\s*@?\s*\d{1,2}\s*%/i;

// The ₹ glyph gets misread as something else entirely often enough (seen: "3", "T", "Z", "X")
// that requiring a recognizable currency marker misses real prices outright. A comma-grouped
// number (Indian lakh/thousand formatting, e.g. "4,299") is a distinctive enough shape to stand
// in for a currency symbol on its own - but a bare number like that also shows up in ordinary
// marketing copy ("15,000 points of sale", "more than 120 countries"). Rather than trying to
// blocklist every non-price word that can follow a count, this only accepts a bare number when
// it's essentially the *entire* line by itself - true of how a price is actually laid out on a
// catalog page (its own line, maybe with a trailing "/-"), never true of a number inside a
// sentence. Comma-grouping is preferred as the more confident shape, but plain digits (e.g. a
// price written as "10000.00" with no thousands separator, also seen in that VIP catalog) are
// accepted too, bounded to a plausible price length (4-7 digits) so short numbers like a "360°"
// spec detail or a "12" month warranty can't be mistaken for one.
const BARE_PRICE = /\b(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|\d{4,7}(?:\.\d{1,2})?)\b/;
const BARE_PRICE_LINE_LEFTOVER_MAX = 6;

function matchPrice(blockText) {
  const gstMatch = blockText.match(GST_SUFFIXED_PRICE);
  if (gstMatch) return gstMatch;

  const currencyMatch = blockText.match(CURRENCY_PRICE);
  if (currencyMatch) return currencyMatch;

  for (const line of blockText.split('\n')) {
    const trimmed = line.trim();
    const bareMatch = trimmed.match(BARE_PRICE);
    if (!bareMatch) continue;
    const leftover = trimmed.replace(bareMatch[0], '').trim();
    if (leftover.length <= BARE_PRICE_LINE_LEFTOVER_MAX) return bareMatch;
  }
  return null;
}

// Every bare (non-GST-suffixed) price-shaped number in the text, applying the same
// almost-whole-line guard as matchPrice's own bare-number tier.
function extractBarePrices(blockText) {
  const values = [];
  for (const rawLine of blockText.split('\n')) {
    const line = rawLine.trim();
    const bareMatch = line.match(BARE_PRICE);
    if (!bareMatch) continue;
    const leftover = line.replace(bareMatch[0], '').trim();
    if (leftover.length <= BARE_PRICE_LINE_LEFTOVER_MAX) {
      const n = parseNumber(bareMatch[1]);
      if (n !== null) values.push(n);
    }
  }
  return values;
}

// A block can carry two distinct prices - a catalog MRP and a "Net Rate"/"Base Rate" wholesale
// price quoted as "<number>+GST@<pct>%" (see GST_SUFFIXED_PRICE). Conflating the two would be a
// real mistake, not just an inconvenience - publishing the wholesale rate as the customer-facing
// MRP would show a price far below what it should be. When both are present, the MRP is taken as
// the larger of the two (true in every real catalog: a marked-up MRP is always >= the wholesale
// rate it's discounted from), the net rate is kept separately as a selling price, and if only one
// number is found at all it's used as the MRP with no separate selling price - better to
// under-populate than to silently mislabel a wholesale rate as the retail price.
function extractPrices(blockText) {
  const gstMatch = blockText.match(GST_SUFFIXED_PRICE);
  const netRate = gstMatch ? parseNumber(gstMatch[1]) : null;

  const currencyMatch = blockText.match(CURRENCY_PRICE);
  const bareValues = extractBarePrices(gstMatch ? blockText.replace(gstMatch[0], ' ') : blockText);

  let mrp = currencyMatch ? parseNumber(currencyMatch[1]) : null;
  if (mrp === null && bareValues.length > 0) mrp = Math.max(...bareValues);
  if (mrp === null) mrp = netRate;

  const sellingPrice = netRate !== null && netRate !== mrp ? netRate : null;
  return { mrp, sellingPrice };
}

// Lines whose vertical gap from the previous line is within this many line-heights are
// considered part of the same product's text cluster.
const BLOCK_GAP_MULTIPLIER = 2.2;

function groupLinesIntoBlocks(rows) {
  if (rows.length === 0) return [];
  const lines = rows.map(row => {
    const minX = Math.min(...row.map(w => w.x));
    const maxX = Math.max(...row.map(w => w.x + w.width));
    const minY = Math.min(...row.map(w => w.y));
    const maxY = Math.max(...row.map(w => w.y + w.height));
    return { text: row.map(w => w.text).join(' '), top: minY, bottom: maxY, left: minX, right: maxX, height: maxY - minY };
  }).sort((a, b) => a.top - b.top);

  const avgHeight = lines.reduce((sum, l) => sum + l.height, 0) / lines.length || 20;

  const blocks = [];
  let current = [lines[0]];
  for (let i = 1; i < lines.length; i++) {
    const gap = lines[i].top - current[current.length - 1].bottom;
    if (gap <= avgHeight * BLOCK_GAP_MULTIPLIER) {
      current.push(lines[i]);
    } else {
      blocks.push(current);
      current = [lines[i]];
    }
  }
  blocks.push(current);

  return blocks.map(blockLines => ({
    text: blockLines.map(l => l.text).join('\n'),
    top: Math.min(...blockLines.map(l => l.top)),
    bottom: Math.max(...blockLines.map(l => l.bottom)),
    left: Math.min(...blockLines.map(l => l.left)),
    right: Math.max(...blockLines.map(l => l.right)),
    lines: blockLines
  }));
}

function parseNumber(raw) {
  const cleaned = (raw || '').replace(/[^\d.]/g, '');
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

// Table header cells/labels that can end up as their own line in a block, or - if OCR keeps a
// header row intact - as several of these words together on one line (e.g. "Product Name Brand
// MRP Net Rate"). Never a real product name, so a line made up entirely of these is skipped when
// picking which line to use as one.
const HEADER_LABEL_WORDS = new Set([
  'product', 'name', 'brand', 'mrp', 'net', 'rate', 'base', 'price',
  'specification', 'specifications', 's.no', 'sno', 'no'
]);

function isHeaderLabelLine(line) {
  const tokens = line.toLowerCase().replace(/[:.]/g, '').split(/\s+/).filter(Boolean);
  return tokens.length > 0 && tokens.every(t => HEADER_LABEL_WORDS.has(t));
}

// A single-product spec sheet (seen in a real Adidas catalog: one product per page, a fixed
// "Article No. / MRP / Color / Material / HSN Code / GST / Sizes available" block down the side)
// lists these as their own "Label: value" or "Label. value" lines - often longer than the actual
// product title, which would otherwise win the "richest remaining line" name heuristic below
// (e.g. picking "Sizes available : S, M, L, XL, XXL & 3XL" as the product name). None of these
// labels are a product name under any real catalog convention, so lines starting with one are
// dropped from the name candidates regardless of length.
const FIELD_LABEL_PREFIXES = [
  'article no', 'article', 'sku', 'color', 'colour', 'material', 'sizes available', 'sizes',
  'size', 'hsn code', 'hsn', 'gst', 'weight', 'dimensions', 'capacity', 'warranty'
];
const FIELD_LABEL_LINE = new RegExp(
  `^(?:${FIELD_LABEL_PREFIXES.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\.?\\s*[:\\-]`,
  'i'
);
function isFieldLabelLine(line) {
  return FIELD_LABEL_LINE.test(line.trim());
}

// Strips every price-shaped token out of a line (a GST-suffixed net rate, plus any bare MRP-like
// number) rather than discarding the whole line - needed when a table row puts the name, brand
// AND price(s) on one OCR line together, so the name/brand text isn't lost along with the price.
// Safe for this domain's product names: they only ever carry 2-3 digit numbers (sizes like "55",
// "360°"), well under BARE_PRICE's 4-digit floor, so a real size never gets stripped out.
function stripPricesFromLine(line) {
  return line
    .replace(new RegExp(GST_SUFFIXED_PRICE.source, 'gi'), ' ')
    .replace(new RegExp(BARE_PRICE.source, 'g'), ' ')
    // A table's vertical column rule is sometimes OCR'd as a literal "|" fused onto the
    // adjacent cell's text (e.g. a name cell reading "MIRO STROLLY 55 360° | VIP") - never
    // meaningful content, so it's dropped along with the prices.
    .replace(/\|/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// A small set of brands seen across real catalogs this tool has processed - a bonus signal only.
// Superadmin can bulk-set/correct the brand for an entire extraction job regardless (Product
// Extraction tab), so a miss here just leaves it blank rather than wrong.
const KNOWN_BRANDS = [
  'American Tourister', 'Samsonite', 'Skybags', 'VIP', 'Aristocrat', 'Safari',
  'Wildcraft', 'Tommy Hilfiger', 'Delsey', 'High Sierra', 'United Colors of Benetton'
];
const KNOWN_BRAND_RE = new RegExp(`\\b(${KNOWN_BRANDS.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'i');

function detectBrand(text) {
  const match = text.match(KNOWN_BRAND_RE);
  if (!match) return null;
  // Report back in the canonical casing from KNOWN_BRANDS rather than however the page/OCR
  // happened to capitalize it.
  return KNOWN_BRANDS.find(b => b.toLowerCase() === match[1].toLowerCase()) || match[1];
}

// Greedy nearest-image-per-block assignment using centre-to-centre distance.
function assignImagesToBlocks(blocks, imageBoxes) {
  const assigned = blocks.map(() => []);
  const claimed = new Set();
  const blockCentres = blocks.map(b => ({ x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2 }));

  imageBoxes.forEach((img, imgIdx) => {
    const cx = img.left + img.width / 2;
    const cy = img.top + img.height / 2;
    let bestBlock = -1;
    let bestDist = Infinity;
    blockCentres.forEach((c, blockIdx) => {
      const dist = Math.hypot(c.x - cx, c.y - cy);
      if (dist < bestDist) {
        bestDist = dist;
        bestBlock = blockIdx;
      }
    });
    if (bestBlock !== -1) {
      assigned[bestBlock].push(imgIdx);
      claimed.add(imgIdx);
    }
  });

  return assigned;
}

async function structurePage(pageImagePath, pdfPath, pageNumber, extractedImages) {
  const meta = await sharp(pageImagePath).metadata();
  // The whole page at native (300 DPI) resolution is the single heaviest OCR call in the
  // pipeline; downscaling it is safe here because this pass only hunts for large display text
  // (prices, headlines), not small print, and matchPrice's regexes tolerate the odd misread digit.
  const whole = await ocrRegion(pageImagePath, { left: 0, top: 0, width: 1, height: 1 }, 11, 1600);
  const blocks = groupLinesIntoBlocks(whole.rows);

  const productBlocks = blocks
    .map(block => ({ block, priceMatch: matchPrice(block.text) }))
    .filter(({ priceMatch }) => priceMatch && parseNumber(priceMatch[1]) !== null);

  if (productBlocks.length === 0) {
    return { isProductPage: false, products: [] };
  }

  let imageBoxes = [];
  try {
    const positions = await getImagePositions(pdfPath, pageNumber);
    if (positions.pageWidth) {
      const scale = meta.width / positions.pageWidth;
      imageBoxes = positions.boxes.map(b => ({
        top: b.top * scale, left: b.left * scale, width: b.width * scale, height: b.height * scale
      }));
    }
  } catch (err) {
    // Position lookup is a nice-to-have for multi-product pages; fall back to no positions
    // (every extracted image just gets attached to every block below) rather than failing.
  }

  const blockList = productBlocks.map(({ block }) => block);
  const imageAssignments = imageBoxes.length > 0 ? assignImagesToBlocks(blockList, imageBoxes) : null;

  const products = productBlocks.map(({ block }, i) => {
    const rawLines = block.text.split('\n').map(l => l.trim()).filter(Boolean);

    // Build name candidates by stripping every price-shaped token out of each line rather than
    // dropping a line whole - a table row can share its line with the price(s) - and drop lines
    // that are just table-header labels. The richest remaining line is taken as the name: a real
    // product title tends to be longer than a leftover label or a bare brand/SKU fragment.
    const nameCandidates = rawLines
      .map(stripPricesFromLine)
      .filter(line => line && !isHeaderLabelLine(line) && !isFieldLabelLine(line));
    const name = nameCandidates.reduce((best, line) => (
      !best || line.length > best.length ? line : best
    ), null);

    const { mrp, sellingPrice } = extractPrices(block.text);

    // With no reliable per-image position match, every extracted image on the page is offered
    // to every block found on that page - correct for the common single-product-per-page case,
    // a guess for a genuine multi-product grid page.
    const relevantImages = imageAssignments
      ? imageAssignments[i].map(idx => extractedImages[idx]).filter(Boolean)
      : extractedImages;

    return {
      name,
      brand: detectBrand(block.text),
      material: null,
      description: nameCandidates.join(' ') || null,
      badges: [],
      variants: [{
        sku: null,
        description: name,
        dimensionsCm: null,
        weightKg: null,
        volumeLtr: null,
        mrp,
        sellingPrice
      }],
      colors: [],
      confidence: 0.35,
      _images: relevantImages,
      rawOcrText: { block: block.text }
    };
  });

  return { isProductPage: true, products };
}

module.exports = { structurePage };
