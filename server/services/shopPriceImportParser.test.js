const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { assignPageImages, parseShopPriceImportText } = require('./shopPriceImportParser');
const { OUR_PRICE_HIKE_PERCENT, ourPriceFor } = require('./shopPriceImportPricing');

test('adds a 70% hike to the PDF price', () => {
  assert.equal(OUR_PRICE_HIKE_PERCENT, 70);
  assert.equal(ourPriceFor(100), 170);
  assert.equal(ourPriceFor(155), 263.5);
});

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

test('matches each row to the picture positioned beside it, even with extra images', async (t) => {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'shop-price-image-test-'));
  t.after(() => fs.promises.rm(root, { recursive: true, force: true }));
  const sourceImages = [];
  for (let index = 0; index < 3; index += 1) {
    const imagePath = path.join(root, `source-${index}.jpg`);
    await fs.promises.writeFile(imagePath, `image-${index}`);
    sourceImages.push(imagePath);
  }

  const items = [{ modelName: 'Alpha' }, { modelName: 'Beta' }];
  const assigned = await assignPageImages(
    items,
    {
      texts: [
        { text: 'Alpha', centerY: 100 },
        { text: 'Beta', centerY: 200 }
      ],
      images: [
        { centerY: 100, width: 50, height: 50, filePath: sourceImages[0] },
        { centerY: 101, width: 80, height: 80, filePath: sourceImages[1] },
        { centerY: 200, width: 50, height: 50, filePath: sourceImages[2] }
      ]
    },
    1,
    path.join(root, 'saved'),
    '/uploads/import/images'
  );

  assert.equal(assigned, 2);
  assert.equal(items[0].picture, '/uploads/import/images/page-1-item-1.jpg');
  assert.equal(items[1].picture, '/uploads/import/images/page-1-item-2.jpg');
  assert.equal(
    await fs.promises.readFile(path.join(root, 'saved/page-1-item-1.jpg'), 'utf8'),
    'image-1'
  );
  assert.equal(
    await fs.promises.readFile(path.join(root, 'saved/page-1-item-2.jpg'), 'utf8'),
    'image-2'
  );
});
