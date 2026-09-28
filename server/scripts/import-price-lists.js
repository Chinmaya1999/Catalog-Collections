// Bulk-import price list PDF / Excel files into the Price List section.
//
//   node scripts/import-price-lists.js "<dir>" "file1.pdf" "file2.pdf" ...
//
// A PDF whose RATE column sits on separate pages with blank cells (Notebook
// Pricelist.pdf) can't be aligned from the PDF alone. If an .xlsx with the same
// name sits next to it, its blank/non-blank rows are used to place the PDF's
// rates — but only when the Excel has the same codes and the same rate sequence.
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { PDFParse } = require('pdf-parse');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { parsePriceListFile, categoryFromFileName } = require('../services/priceListParser');
const { savePriceList } = require('../services/priceListStore');

const PRICE_LIST_DIR = path.join(__dirname, '../uploads/price-lists');

const pdfRateLines = async (filePath) => {
  const parser = new PDFParse({ data: fs.readFileSync(filePath) });
  try {
    const { text } = await parser.getText();
    return text.split(/\r?\n/).map((l) => l.trim()).filter((l) => /^\d[\d,]*(?:\.\d+)?$/.test(l));
  } finally {
    await parser.destroy();
  }
};

const alignWithExcelLayout = async (pdfPath, parsed) => {
  const xlsxPath = pdfPath.replace(/\.pdf$/i, '.xlsx');
  if (!fs.existsSync(xlsxPath)) return null;

  const excel = (await parsePriceListFile(xlsxPath, path.basename(xlsxPath))).items;
  const rates = await pdfRateLines(pdfPath);
  const sameCodes = JSON.stringify(excel.map((i) => i.skuKey)) === JSON.stringify(parsed.items.map((i) => i.skuKey));
  const sameRates = JSON.stringify(excel.filter((i) => i.price).map((i) => i.price)) === JSON.stringify(rates);
  if (!sameCodes || !sameRates) return null;

  let next = 0;
  const items = parsed.items.map((item, idx) => {
    if (!excel[idx].price) return item;
    const rate = rates[next++];
    return { ...item, price: rate, priceValue: Number(rate.replace(/,/g, '')), plusGst: false };
  });
  return { items, warnings: [] };
};

(async () => {
  const [dir, ...names] = process.argv.slice(2);
  if (!dir || names.length === 0) {
    console.error('Usage: node scripts/import-price-lists.js <dir> <file> [file ...]');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  fs.mkdirSync(PRICE_LIST_DIR, { recursive: true });

  for (const name of names) {
    const source = path.join(dir, name);
    try {
      let parsed = await parsePriceListFile(source, name);
      const isPdf = /\.pdf$/i.test(name);
      if (isPdf && parsed.warnings.length) {
        const aligned = await alignWithExcelLayout(source, parsed);
        if (aligned) {
          parsed = aligned;
          console.log(`  (${name}: rates placed using the blank rows of the matching .xlsx)`);
        }
      }
      if (parsed.items.length === 0) {
        console.log(`✗ ${name}: no SKU codes found`);
        continue;
      }

      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(name).toLowerCase()}`;
      fs.copyFileSync(source, path.join(PRICE_LIST_DIR, fileName));

      const r = await savePriceList({
        ...parsed,
        originalName: name,
        fileName,
        fileType: isPdf ? 'pdf' : 'excel',
        category: categoryFromFileName(name),
        uploadedBy: 'bulk import'
      });
      console.log(
        `✓ ${name} → ${r.category}: ${r.imported} SKUs` +
          (r.updated ? `, ${r.updated} updated` : '') +
          (r.withoutPrice ? `, ${r.withoutPrice} without price` : '') +
          (r.warnings.length ? `\n    ⚠ ${r.warnings.join(' ')}` : '')
      );
    } catch (error) {
      console.error(`✗ ${name}: ${error.message}`);
    }
  }

  await mongoose.disconnect();
})();
