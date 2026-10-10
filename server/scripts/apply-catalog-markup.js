// One-time repricing of vendor-catalogue products (those with no supplier cost yet).
//
// The catalogue price (variant sellingPrice, else mrp) becomes the product's supplierCost, and the
// price shown in the Shop becomes catalogue price + MARKUP_PCT, rounded to the nearest ₹5. The
// catalogue price is then cleared from the variant (mrp) so the public API no longer exposes it.
//
// Skipped: price-list products (shopPricing.js prices them), HGS products, and products that
// already have a supplier cost. Products already repriced by apply-shop-markup.js keep their
// current price; they just get their old price recorded as supplierCost.
// The original variant prices are saved in attributes.catalogMarkup so this is reversible and
// re-running it changes nothing.
//
// Usage:
//   node scripts/apply-catalog-markup.js --dry-run
//   node scripts/apply-catalog-markup.js [--markup 40]

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { PriceListItem } = require('../models/PriceList');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const mi = args.indexOf('--markup');
const MARKUP_PCT = mi >= 0 ? Number(args[mi + 1]) : 40;

const skuKeyOf = (sku) => String(sku || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const withMarkup = (price) => Math.round((price * (1 + MARKUP_PCT / 100)) / 5) * 5;
const isNum = (n) => typeof n === 'number' && !Number.isNaN(n);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const listed = new Set((await PriceListItem.find({ priceValue: { $ne: null } }, 'skuKey')).map((r) => r.skuKey));

  let marked = 0, costOnly = 0, skipped = 0;
  const sample = [];
  for await (const product of Product.find({}).select('+supplierCost').cursor()) {
    const skus = product.variants.map((v) => skuKeyOf(v.sku));
    if (skus.some((k) => listed.has(k) || k.startsWith('HGS')) || isNum(product.supplierCost) || product.attributes?.catalogMarkup) {
      skipped += 1;
      continue;
    }

    const prior = product.attributes?.priceBeforeMarkup;
    if (isNum(prior)) {
      // Already repriced by apply-shop-markup.js: keep the price, record the cost.
      costOnly += 1;
      if (!DRY_RUN) { product.supplierCost = prior; await product.save(); }
      continue;
    }

    const bases = product.variants.map((v) => (isNum(v.sellingPrice) ? v.sellingPrice : v.mrp)).filter(isNum);
    if (!bases.length) { skipped += 1; continue; }

    const original = product.variants.map((v) => ({ id: String(v._id), mrp: v.mrp ?? null, sellingPrice: v.sellingPrice ?? null }));
    for (const v of product.variants) {
      const base = isNum(v.sellingPrice) ? v.sellingPrice : v.mrp;
      if (!isNum(base)) continue;
      v.sellingPrice = withMarkup(base);
      v.mrp = null;
    }
    product.supplierCost = Math.min(...bases);
    product.attributes = { ...(product.attributes || {}), catalogMarkup: { percent: MARKUP_PCT, variants: original } };
    product.markModified('attributes');
    marked += 1;
    if (sample.length < 10) sample.push(`${product.variants[0]?.sku || product._id}: cost ${product.supplierCost} -> shop ${withMarkup(Math.min(...bases))}`);
    if (!DRY_RUN) await product.save();
  }
  console.log(`${DRY_RUN ? '[dry run] ' : ''}repriced ${marked} (+${MARKUP_PCT}%), cost recorded only ${costOnly}, skipped ${skipped}`);
  console.log(sample.join('\n'));
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
