// One-off migration: links every Shop product to the vendor-facing Catalog
// (the Catalog model used by Find Product Vendors / PDF browsing) whose name
// matches the product's brand, so Shop Product Management can show a
// "View in catalog" button that opens the real vendor catalog PDF.
//
// Usage:
//   node scripts/link-products-to-vendor-catalogs.js --dry-run
//   node scripts/link-products-to-vendor-catalogs.js

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Catalog = require('../models/Catalog');

const DRY_RUN = process.argv.includes('--dry-run');

const normalize = (s) => (s || '')
  .toLowerCase()
  .replace(/[^a-z0-9 ]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Dry run:', DRY_RUN);

  const catalogs = await Catalog.find().select('name products').lean();
  const brands = await Product.distinct('brand');

  const brandToCatalog = {};
  const unmatchedBrands = [];

  for (const brand of brands) {
    if (!brand) continue;
    const nb = normalize(brand);
    const candidates = catalogs.filter((c) => {
      const nc = normalize(c.name);
      return nc === nb || nc.includes(nb) || nb.includes(nc);
    });
    if (candidates.length === 0) {
      unmatchedBrands.push(brand);
      continue;
    }
    // Prefer an exact normalized match; break ties by whichever catalog has
    // more indexed products (the more complete/likely-current upload).
    const exact = candidates.filter((c) => normalize(c.name) === nb);
    const pool = exact.length > 0 ? exact : candidates;
    const best = pool.reduce((a, b) => ((b.products || []).length > (a.products || []).length ? b : a));
    brandToCatalog[brand] = best;
  }

  console.log('\n=== Brand -> Catalog matches ===');
  for (const [brand, catalog] of Object.entries(brandToCatalog)) {
    console.log(`  ${brand} -> "${catalog.name}" (${catalog._id})`);
  }
  console.log('\n=== Brands with no matching catalog (left untouched) ===');
  console.log(' ', unmatchedBrands.join(', ') || '(none)');

  let updated = 0;
  for (const [brand, catalog] of Object.entries(brandToCatalog)) {
    if (DRY_RUN) {
      const count = await Product.countDocuments({ brand });
      console.log(`  [dry-run] would set ${count} "${brand}" products -> ${catalog.name}`);
      continue;
    }
    const result = await Product.updateMany(
      { brand },
      { $set: { vendorCatalogId: catalog._id } }
    );
    updated += result.modifiedCount;
    console.log(`  Set vendorCatalogId for ${result.modifiedCount} "${brand}" products`);
  }

  console.log(DRY_RUN ? '\nDry run complete.' : `\nDone. Updated ${updated} products total.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
