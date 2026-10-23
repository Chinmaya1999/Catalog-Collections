const test = require('node:test');
const assert = require('node:assert/strict');
const { parseShopPriceImportText } = require('./shopPriceImportParser');

test('maps price-list columns when the PDF contains a picture cell', () => {
  const items = parseShopPriceImportText(
    'Type of item    Pictures    Model Name/No.    Price    HSN Code    GST%\n' +
      'Bag    photo.jpg    Model-A1    1,000    4202    18%'
  );

  assert.deepEqual(items, [{
    itemType: 'Bag',
    modelName: 'Model-A1',
    pdfPrice: 1000,
    hsnCode: '4202',
    gstPercent: 18
  }]);
});

test('reads rows when the PDF text extraction omits the picture cell', () => {
  const items = parseShopPriceImportText(
    'Type of Bag \tPictures \tModel Name/No. \tPrice \tHSN Code \tGST%\n' +
      'Backpack \tLittle Wish \t155 \t42029900 \t18%'
  );

  assert.equal(items.length, 1);
  assert.equal(items[0].itemType, 'Backpack');
  assert.equal(items[0].modelName, 'Little Wish');
  assert.equal(items[0].pdfPrice, 155);
  assert.equal(items[0].hsnCode, '42029900');
  assert.equal(items[0].gstPercent, 18);
});

test('keeps the latest row when a model occurs more than once', () => {
  const items = parseShopPriceImportText(
    'Bag Model-C3 500 4202 12%\nBag Model-C3 600 4202 18%'
  );

  assert.equal(items.length, 1);
  assert.equal(items[0].pdfPrice, 600);
  assert.equal(items[0].gstPercent, 18);
});
