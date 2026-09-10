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
const CURRENCY_PRICE = /(?:₹|\bRs\.?\b|\bINR\b|\bMRP\b|\bPrice\b)\s*[:\-]?\s*(\d[\d,]*(?:\.\d{1,2})?)/i;

// The ₹ glyph gets misread as something else entirely often enough (seen: "3", "T", "Z", "X")
// that requiring a recognizable currency marker misses real prices outright. A comma-grouped
// number (Indian lakh/thousand formatting, e.g. "4,299") is a distinctive enough shape to stand
// in for a currency symbol on its own - but a bare number like that also shows up in ordinary
// marketing copy ("15,000 points of sale", "more than 120 countries"). Rather than trying to
// blocklist every non-price word that can follow a count, this only accepts a bare number when
// it's essentially the *entire* line by itself - true of how a price is actually laid out on a
// catalog page (its own line, maybe with a trailing "/-"), never true of a number inside a
// sentence.
const BARE_PRICE = /\b(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?)\b/;
const BARE_PRICE_LINE_LEFTOVER_MAX = 6;

function matchPrice(blockText) {
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
  const whole = await ocrRegion(pageImagePath, { left: 0, top: 0, width: 1, height: 1 }, 11);
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

  const products = productBlocks.map(({ block, priceMatch }, i) => {
    const lines = block.text.split('\n').map(l => l.trim()).filter(Boolean);
    const priceLineIdx = lines.findIndex(l => !!matchPrice(l));
    const nameLines = lines.filter((_, idx) => idx !== priceLineIdx);
    const name = nameLines[0] || null;

    // With no reliable per-image position match, every extracted image on the page is offered
    // to every block found on that page - correct for the common single-product-per-page case,
    // a guess for a genuine multi-product grid page.
    const relevantImages = imageAssignments
      ? imageAssignments[i].map(idx => extractedImages[idx]).filter(Boolean)
      : extractedImages;

    return {
      name,
      brand: null,
      material: null,
      description: nameLines.join(' ') || null,
      badges: [],
      variants: [{
        sku: null,
        description: name,
        dimensionsCm: null,
        weightKg: null,
        volumeLtr: null,
        mrp: parseNumber(priceMatch[1])
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
