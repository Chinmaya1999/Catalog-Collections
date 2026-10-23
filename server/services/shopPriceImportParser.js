const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { getPdfPageLayouts } = require('./extraction/imagePositions');

const normalizeHeader = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const parseAmount = (value) => {
  const match = String(value || '').replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const headerColumns = (line) => {
  const cells = line.trim().split(/\s{2,}|\t+/).map(normalizeHeader);
  const find = (matcher) => cells.findIndex((cell) => matcher.test(cell));
  const columns = {
    itemType: find(/^(type|typeofitem|itemtype|item)$/),
    modelName: find(/^(model|modelname|modelno|modelnumber|modelnameno|code|sku)$/),
    price: find(/^(price|rate|listprice|mrp)$/),
    hsnCode: find(/^(hsn|hsncode|hsnnumber)$/),
    gstPercent: find(/^(gst|gstpercent|gstpercentage|tax)$/)
  };
  return columns.modelName >= 0 && columns.price >= 0 ? columns : null;
};

const parseDelimitedRow = (line, columns) => {
  const cells = line.trim().split(/\s{2,}|\t+/).map((cell) => cell.trim());
  const maxIndex = Math.max(...Object.values(columns));
  if (cells.length <= maxIndex) return null;

  const modelName = columns.modelName >= 0 ? cells[columns.modelName] : '';
  const pdfPrice = columns.price >= 0 ? parseAmount(cells[columns.price]) : null;
  if (!modelName || pdfPrice === null) return null;

  return {
    itemType: columns.itemType >= 0 ? cells[columns.itemType] || '' : '',
    modelName,
    pdfPrice,
    hsnCode: columns.hsnCode >= 0 ? cells[columns.hsnCode] || '' : '',
    gstPercent: columns.gstPercent >= 0 ? parseAmount(cells[columns.gstPercent]) : null
  };
};

const parseTrailingValuesRow = (line) => {
  const match = line.trim().match(
    /^(.*?)\s+(?:₹\s*)?(\d[\d,]*(?:\.\d+)?)\s+(\d{4,8})\s+(\d{1,2}(?:\.\d+)?)\s*%?\s*$/i
  );
  if (!match) return null;

  const prefix = match[1].trim();
  const spacedParts = prefix.split(/\s{2,}|\t+/).map((part) => part.trim()).filter(Boolean);
  const itemType = spacedParts.length > 1 ? spacedParts[0] : (prefix.split(/\s+/)[0] || '');
  const modelName = spacedParts.length > 1
    ? spacedParts.slice(1).join(' ')
    : prefix.slice(itemType.length).trim();
  const pdfPrice = parseAmount(match[2]);
  if (!modelName || pdfPrice === null) return null;

  return {
    itemType,
    modelName,
    pdfPrice,
    hsnCode: match[3],
    gstPercent: parseAmount(match[4])
  };
};

const parseShopPriceImportPageText = (text) => {
  const items = [];
  let columns = null;

  for (const line of String(text || '').split(/\r?\n/).map((value) => value.trim()).filter(Boolean)) {
    const detectedColumns = headerColumns(line);
    if (detectedColumns) {
      columns = detectedColumns;
      continue;
    }

    const item = (columns && parseDelimitedRow(line, columns)) || parseTrailingValuesRow(line);
    if (item) items.push(item);
  }

  return items;
};

const uniqueItems = (items) => {
  const byModel = new Map();
  items.forEach((item) => byModel.set(item.modelName.toUpperCase(), item));
  return [...byModel.values()];
};

const parseShopPriceImportText = (text) => uniqueItems(parseShopPriceImportPageText(text));

const normalizeLabel = (value) => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();

const assignPageImages = async (items, layout, pageNumber, imageDirectory, publicImageDirectory) => {
  if (!layout || items.length === 0) return 0;
  const rows = items.map((item) => ({
    item,
    text: layout.texts.find((entry) => normalizeLabel(entry.text) === normalizeLabel(item.modelName))
  }));
  const locatedRows = rows
    .filter((row) => row.text)
    .sort((a, b) => a.text.centerY - b.text.centerY);
  let assigned = 0;

  for (const [index, row] of locatedRows.entries()) {
    const previous = locatedRows[index - 1];
    const next = locatedRows[index + 1];
    const lowerBound = previous ? (previous.text.centerY + row.text.centerY) / 2 : -Infinity;
    const upperBound = next ? (row.text.centerY + next.text.centerY) / 2 : Infinity;
    const image = layout.images
      .filter((candidate) => candidate.centerY >= lowerBound && candidate.centerY < upperBound)
      .sort((a, b) => (b.width * b.height) - (a.width * a.height))[0];

    if (!image || !fs.existsSync(image.filePath)) continue;
    await fs.promises.mkdir(imageDirectory, { recursive: true });
    const imageName = `page-${pageNumber}-item-${items.indexOf(row.item) + 1}.jpg`;
    await fs.promises.copyFile(image.filePath, path.join(imageDirectory, imageName));
    row.item.picture = `${publicImageDirectory}/${imageName}`;
    assigned += 1;
  }

  return assigned;
};

const parseShopPriceImportPdf = async (filePath, imageDirectory, publicImageDirectory) => {
  const parser = new PDFParse({ data: fs.readFileSync(filePath) });
  const imageWorkDir = path.join(imageDirectory, 'extracted');
  try {
    const textResult = await parser.getText();
    const pageTexts = textResult.pages?.length ? textResult.pages.map((page) => page.text) : [textResult.text || ''];
    const items = [];
    const warnings = [];
    let layouts = [];

    try {
      layouts = await getPdfPageLayouts(filePath, imageWorkDir);
    } catch (error) {
      console.error('Could not extract images from Shop Price List PDF:', error);
      warnings.push('PDF pictures could not be extracted; existing catalog pictures will be matched by model where possible.');
    }

    for (const [pageIndex, pageText] of pageTexts.entries()) {
      const pageItems = parseShopPriceImportPageText(pageText);
      const pageNumber = pageIndex + 1;
      const layout = layouts.find((page) => page.pageNumber === pageNumber);
      await assignPageImages(pageItems, layout, pageNumber, imageDirectory, publicImageDirectory);

      items.push(...pageItems);
    }

    const missingPictures = items.filter((item) => !item.picture).length;
    if (missingPictures > 0) {
      warnings.push(`${missingPictures} products had no reliably matched PDF picture.`);
    }
    return { items: uniqueItems(items), warnings: [...new Set(warnings)] };
  } finally {
    await Promise.all([
      parser.destroy(),
      fs.promises.rm(imageWorkDir, { recursive: true, force: true })
    ]);
  }
};

module.exports = { assignPageImages, parseShopPriceImportPdf, parseShopPriceImportText };
