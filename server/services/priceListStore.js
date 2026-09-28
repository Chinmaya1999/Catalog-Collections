const { PriceListFile, PriceListItem } = require('../models/PriceList');

const refreshFileCounts = async (fileIds) => {
  await Promise.all(
    fileIds.map(async (id) => {
      const itemCount = await PriceListItem.countDocuments({ sourceFile: id });
      await PriceListFile.findByIdAndUpdate(id, { itemCount });
    })
  );
};

// Save parsed rows from one file. A SKU code lives in exactly one row, so any
// code already on record takes the newer price and moves to this file.
const savePriceList = async ({ items, warnings = [], originalName, fileName, fileType, category, uploadedBy = '' }) => {
  const existing = await PriceListItem.find({ skuKey: { $in: items.map((i) => i.skuKey) } }, 'sourceFile');
  const previousFileIds = [...new Set(existing.map((e) => String(e.sourceFile)))];

  const doc = await PriceListFile.create({
    originalName,
    fileName,
    filePath: `/uploads/price-lists/${fileName}`,
    fileType,
    category,
    itemCount: items.length,
    warnings,
    uploadedBy
  });

  await PriceListItem.bulkWrite(
    items.map((item) => ({
      updateOne: {
        filter: { skuKey: item.skuKey },
        update: { $set: { ...item, category, sourceFile: doc._id, updatedAt: new Date() } },
        upsert: true
      }
    }))
  );
  await refreshFileCounts(previousFileIds);

  return {
    fileName: originalName,
    category,
    imported: items.length,
    updated: existing.length,
    withoutPrice: items.filter((i) => !i.price).length,
    warnings
  };
};

module.exports = { savePriceList, refreshFileCounts };
