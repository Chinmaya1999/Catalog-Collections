const Product = require('../models/Product');
const { PriceListItem } = require('../models/PriceList');

// Shop price = price-list price + 80%.
const SHOP_MARKUP_PERCENT = 80;
// Cheap items (shop price under the minimum) are lifted to a floor of ₹250.
const SHOP_MIN_PRICE = 250;
const shopPriceFor = (priceValue, override = null) => (
  typeof override === 'number' ? override : Math.max(SHOP_MIN_PRICE, Math.round(priceValue * (1 + SHOP_MARKUP_PERCENT / 100)))
);

const skuKeyOf = (sku) => String(sku || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// Push price-list prices into the shop. A product variant whose SKU code equals a price-list SKU
// code gets sellingPrice = list price + 80%; the list price itself is kept as the product's
// supplierCost so the superadmin "My pricing" view shows the real profit. Pass skuKeys to limit
// the sync to those codes, or nothing to sync every priced row.
const syncShopPrices = async (skuKeys) => {
  const filter = { priceValue: { $ne: null } };
  if (skuKeys && skuKeys.length) filter.skuKey = { $in: skuKeys };
  const rows = await PriceListItem.find(filter, 'skuKey priceValue shopPrice');
  if (rows.length === 0) return { matched: 0, updated: 0 };

  const listPrice = new Map(rows.map((r) => [r.skuKey, { base: r.priceValue, override: r.shopPrice }]));
  const keys = [...listPrice.keys()];
  // Product SKUs are stored as typed ("HGS-K301"), so match on the normalised form in memory.
  // Only products whose variant SKU could match, streamed one at a time to keep memory flat.
  const cursor = Product.find({ 'variants.sku': { $ne: null } }).select('+supplierCost variants priceFrom').cursor();

  let matched = 0;
  let updated = 0;
  for await (const product of cursor) {
    let changed = false;
    let cost = null;
    for (const variant of product.variants) {
      const key = skuKeyOf(variant.sku);
      if (!listPrice.has(key)) continue;
      const { base, override } = listPrice.get(key);
      const shop = shopPriceFor(base, override);
      cost = cost === null ? base : Math.min(cost, base);
      if (variant.sellingPrice !== shop) { variant.sellingPrice = shop; changed = true; }
    }
    if (cost === null) continue;
    matched += 1;
    if (product.supplierCost !== cost) { product.supplierCost = cost; changed = true; }
    if (changed) { await product.save(); updated += 1; }
  }
  return { matched, updated, skuCount: keys.length };
};

module.exports = { syncShopPrices, shopPriceFor, SHOP_MARKUP_PERCENT };
