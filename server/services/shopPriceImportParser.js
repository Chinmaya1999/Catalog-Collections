const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

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

const imageExtension = (data) => {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'jpg';
  if (data.length >= 8 && data.slice(0, 8).toString() === '\x89PNG\r\n\x1a\n') return 'png';
  if (data.length >= 12 && data.slice(0, 4).toString() === 'RIFF' && data.slice(8, 12).toString() === 'WEBP') return 'webp';
  return 'png';
};

const parseShopPriceImportPdf = async (filePath, imageDirectory, publicImageDirectory) => {
  const parser = new PDFParse({ data: fs.readFileSync(filePath) });
  try {
    const textResult = await parser.getText();
    const pageTexts = textResult.pages?.length ? textResult.pages.map((page) => page.text) : [textResult.text || ''];
    const items = [];
    const warnings = [];
    let imageResult = null;

    try {
      imageResult = await parser.getImage({ imageThreshold: 120, imageDataUrl: false });
    } catch (error) {
      console.error('Could not extract images from Shop Price List PDF:', error);
      warnings.push('PDF pictures could not be extracted; existing catalog pictures will be matched by model where possible.');
    }

    for (const [pageIndex, pageText] of pageTexts.entries()) {
      const pageItems = parseShopPriceImportPageText(pageText);
      const pageNumber = pageIndex + 1;
      const pageImages = imageResult?.pages.find((page) => page.pageNumber === pageNumber)?.images || [];

      if (pageItems.length > 0 && pageImages.length === pageItems.length) {
        await fs.promises.mkdir(imageDirectory, { recursive: true });
        for (const [itemIndex, item] of pageItems.entries()) {
          const imageData = Buffer.from(pageImages[itemIndex].data);
          const extension = imageExtension(imageData);
          const imageName = `page-${pageNumber}-item-${itemIndex + 1}.${extension}`;
          await fs.promises.writeFile(path.join(imageDirectory, imageName), imageData);
          item.picture = `${publicImageDirectory}/${imageName}`;
        }
      } else if (pageItems.length > 0 && pageImages.length > 0) {
        warnings.push(`Pictures on PDF page ${pageNumber} could not be matched reliably to its product rows.`);
      }

      items.push(...pageItems);
    }

    return { items: uniqueItems(items), warnings: [...new Set(warnings)] };
  } finally {
    await parser.destroy();
  }
};

module.exports = { parseShopPriceImportPdf, parseShopPriceImportText };
