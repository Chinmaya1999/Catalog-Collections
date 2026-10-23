const OUR_PRICE_HIKE_PERCENT = 70;

const ourPriceFor = (pdfPrice) => (
  Math.round((pdfPrice * (1 + OUR_PRICE_HIKE_PERCENT / 100) + Number.EPSILON) * 100) / 100
);

module.exports = { OUR_PRICE_HIKE_PERCENT, ourPriceFor };
