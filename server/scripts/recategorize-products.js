// One-off migration: reassigns every Shop product from its current category
// (mostly brand names like "FUZO"/"American Tourister", or generic buckets)
// to a proper product-type category (Diary & Notebooks, Pens & Writing, etc.)
// so customers can actually browse by what a product IS.
//
// Input: /tmp/category_mapping.json - { productId: targetCategoryName }
// built by the classifier in this conversation.
//
// Usage:
//   node scripts/recategorize-products.js --dry-run   (report only, no writes)
//   node scripts/recategorize-products.js             (apply)

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const Product = require('../models/Product');
const Category = require('../models/Category');

const DRY_RUN = process.argv.includes('--dry-run');

// Existing categories to rename (id stays the same, so slug/links keep working).
const RENAMES = {
  'Combo Sets': 'Combo & Gift Sets',
  'T-Shirts': 'Apparel & T-Shirts',
  'BACKPACK': 'Bags & Backpacks',
};

// Categories that already exist under the right name - reused as-is.
const REUSE_NAMES = ['Drinkware', 'Electronics', 'Home & Living', 'Desk Accessories'];

// Brand-new categories to create.
const NEW_CATEGORIES = [
  { name: 'Diary & Notebooks', slug: 'diary-notebooks', icon: '📔' },
  { name: 'Pens & Writing', slug: 'pens-writing', icon: '🖊️' },
  { name: 'Luggage & Trolleys', slug: 'luggage-trolleys', icon: '🧳' },
  { name: 'Keychains & Cardholders', slug: 'keychains-cardholders', icon: '🔑' },
  { name: 'Awards & Trophies', slug: 'awards-trophies', icon: '🏆' },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Dry run:', DRY_RUN);

  const mapping = JSON.parse(fs.readFileSync('/tmp/category_mapping.json', 'utf8'));
  const targetNames = [...new Set(Object.values(mapping))];
  console.log('Target categories needed:', targetNames.length);

  // Resolve/create every target category document up front.
  const categoryByName = {};

  for (const [oldName, newName] of Object.entries(RENAMES)) {
    const doc = await Category.findOne({ name: oldName });
    if (!doc) { console.warn(`  ! Expected existing category "${oldName}" not found`); continue; }
    if (doc.name !== newName) {
      console.log(`  Rename category "${oldName}" -> "${newName}"`);
      if (!DRY_RUN) { doc.name = newName; await doc.save(); }
    }
    categoryByName[newName] = doc;
  }

  for (const name of REUSE_NAMES) {
    const doc = await Category.findOne({ name });
    if (!doc) { console.warn(`  ! Expected existing category "${name}" not found`); continue; }
    categoryByName[name] = doc;
  }

  for (const spec of NEW_CATEGORIES) {
    let doc = await Category.findOne({ name: spec.name });
    if (!doc) {
      console.log(`  Create new category "${spec.name}"`);
      if (!DRY_RUN) {
        doc = await Category.create({ name: spec.name, slug: spec.slug, icon: spec.icon, order: 300, featured: false });
      } else {
        doc = { _id: 'DRY-RUN-PLACEHOLDER', name: spec.name };
      }
    }
    categoryByName[spec.name] = doc;
  }

  const missing = targetNames.filter((n) => !categoryByName[n]);
  if (missing.length > 0) {
    console.error('Missing category resolution for:', missing);
    process.exit(1);
  }

  // Apply to every product.
  let updated = 0;
  let unchanged = 0;
  const perCategoryCount = {};

  for (const [productId, targetName] of Object.entries(mapping)) {
    const category = categoryByName[targetName];
    perCategoryCount[targetName] = (perCategoryCount[targetName] || 0) + 1;

    if (DRY_RUN) continue;

    const result = await Product.updateOne(
      { _id: productId },
      {
        $set: {
          category: category._id,
          categoryName: category.name,
          categories: [category._id],
          categoryNames: [category.name],
        },
      }
    );
    if (result.modifiedCount > 0) updated += 1;
    else unchanged += 1;
  }

  console.log('\n=== Per-category product counts ===');
  for (const [name, count] of Object.entries(perCategoryCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${name}: ${count}`);
  }

  if (!DRY_RUN) {
    console.log(`\nUpdated ${updated} products (${unchanged} already matched).`);
  } else {
    console.log(`\nDry run - would update ${Object.keys(mapping).length} products.`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
