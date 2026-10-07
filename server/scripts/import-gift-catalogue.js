// Syncs the ADIHUMAN Gift Catalogue (products.json + img/<pack>.json exported from the
// catalogue artifact) into the live Shop: any catalogue product whose supplier code isn't
// already a variant SKU in the DB is created as an approved, published Product. Existing
// products are never modified (re-running only ever adds what's still missing).
//
// Public price = supplier cost + MARKUP_PCT, rounded up to the next ₹5 (shown "+ GST").
// The supplier cost itself is stored in Product.supplierCost (select:false, admin-only).
//
// Usage:
//   node scripts/import-gift-catalogue.js --data <dir> --dry-run
//   node scripts/import-gift-catalogue.js --data <dir> [--markup 30]
// <dir> must contain products.json and an img/ folder of <pack>.json files.
//
// Photos are written to uploads/products/<SKU>/photo1.webp. uploads/ is a bind-mounted
// volume on the server, so after a real run copy uploads/products/HGS-* to the host.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');

const args = process.argv.slice(2);
const argVal = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const DRY_RUN = args.includes('--dry-run');
const DATA_DIR = argVal('--data', null);
const MARKUP_PCT = Number(argVal('--markup', 30));
const UPLOADS_DIR = path.join(__dirname, '../uploads/products');

// Catalogue category -> existing Shop category name.
const CATEGORY_MAP = {
  '2-in-1 Diary & Pen': 'Combo & Gift Sets',
  '2-in-1 Pen & Keychain': 'Combo & Gift Sets',
  '2-in-1 Pen & Cardholder': 'Combo & Gift Sets',
  '3-in-1 Gift Sets': 'Combo & Gift Sets',
  '4-in-1 Gift Sets': 'Combo & Gift Sets',
  '5-in-1 Gift Sets': 'Combo & Gift Sets',
  '6-in-1 Gift Sets': 'Combo & Gift Sets',
  '7-in-1 Gift Sets': 'Combo & Gift Sets',
  'Ball Pens': 'Pens & Writing',
  Bottles: 'Drinkware',
  'Mugs & Tumblers': 'Drinkware',
  Cardholders: 'Keychains & Cardholders',
  Keychains: 'Keychains & Cardholders',
  Gadgets: 'Gadgets',
  'Wooden Desk Stands': 'Desk Accessories',
  'Tote & Canvas Bags': 'Bags & Backpacks',
  'Laptop & Travel Bags': 'Bags & Backpacks',
  'Eco-friendly Notebooks': 'Diary & Notebooks',
  'Notebooks & Diaries': 'Diary & Notebooks',
  'Eco-friendly Range': 'Eco-Friendly'
};

const sellPrice = (cost) => (typeof cost === 'number' ? Math.ceil((cost * (1 + MARKUP_PCT / 100)) / 5) * 5 : null);

async function main() {
  if (!DATA_DIR) throw new Error('Pass --data <dir> (folder with products.json and img/)');
  const list = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'products.json'), 'utf8'));

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected. Dry run: ${DRY_RUN}. Markup: ${MARKUP_PCT}%. Catalogue products: ${list.length}`);

  const existing = new Set(
    (await Product.find({ 'variants.sku': { $in: list.map((p) => p.code) } }).select('variants.sku').lean())
      .flatMap((p) => p.variants.map((v) => v.sku))
  );
  const missing = list.filter((p) => !existing.has(p.code));

  const categories = new Map((await Category.find().select('name').lean()).map((c) => [c.name, c._id]));
  const unmapped = [...new Set(missing.map((p) => p.cat))].filter((c) => !categories.has(CATEGORY_MAP[c]));
  if (unmapped.length) throw new Error(`No Shop category for: ${unmapped.join(', ')}`);

  const packs = new Map();
  const photoFor = (p) => {
    if (!p.img) return null;
    if (!packs.has(p.img)) {
      const file = path.join(DATA_DIR, 'img', `${p.img}.json`);
      packs.set(p.img, fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {});
    }
    return packs.get(p.img)[p.code] || null;
  };

  const stats = { total: missing.length, withPhoto: 0, withPrice: 0, created: 0, failed: 0 };
  const byCategory = {};

  for (const item of missing) {
    const photo = photoFor(item);
    const price = sellPrice(item.cost);
    if (photo) stats.withPhoto++;
    if (price != null) stats.withPrice++;
    const catName = CATEGORY_MAP[item.cat];
    byCategory[catName] = (byCategory[catName] || 0) + 1;
    if (DRY_RUN) continue;

    try {
      let images = [];
      if (photo) {
        const m = photo.match(/^data:image\/(\w+);base64,(.+)$/);
        if (m) {
          const dir = path.join(UPLOADS_DIR, item.code);
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, `photo1.${m[1]}`), Buffer.from(m[2], 'base64'));
          images = [{ path: `/uploads/products/${item.code}/photo1.${m[1]}`, isPrimary: true, source: 'embedded' }];
        }
      }
      const catId = categories.get(catName);
      await new Product({
        name: item.desc || item.cat,
        brand: 'Adihuman',
        category: catId,
        categoryName: catName,
        categories: [catId],
        categoryNames: [catName],
        variants: [{ sku: item.code, sellingPrice: price, heroImage: images[0]?.path || null }],
        images,
        supplierCost: item.cost ?? null,
        supplierCode: item.code,
        source: { pageNumber: item.page, pageCode: item.code },
        status: 'approved',
        isPublished: true,
        publishedAt: new Date()
      }).save();
      stats.created++;
    } catch (err) {
      stats.failed++;
      console.error(`  failed ${item.code}: ${err.message}`);
    }
  }

  console.log('Already in shop:', list.length - missing.length);
  console.log('To add by category:', byCategory);
  console.log(DRY_RUN ? 'DRY RUN (nothing written):' : 'Result:', stats);
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
