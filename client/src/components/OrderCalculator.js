import React, { useState, useEffect } from 'react';
import { Calculator, Percent, Minus, Plus, PackageSearch, Tag, MessageCircle } from 'lucide-react';

// WhatsApp number quotations are sent to (country code + number, no symbols)
const WHATSAPP_NUMBER = '918296810381';

// Quantity discount tiers
// 1-4: 0%, 5-9: 2%, 10-19: 5%, 20-39: 7%, 40-59: 10%, 60-99: 15%, 100-149: 20%, 150+: 30%
const discountTiers = [
  { min: 1, max: 4, percent: 0, label: '1-4' },
  { min: 5, max: 9, percent: 2, label: '5-9' },
  { min: 10, max: 19, percent: 5, label: '10-19' },
  { min: 20, max: 39, percent: 7, label: '20-39' },
  { min: 40, max: 59, percent: 10, label: '40-59' },
  { min: 60, max: 99, percent: 15, label: '60-99' },
  { min: 100, max: 149, percent: 20, label: '100-149' },
  { min: 150, max: Infinity, percent: 30, label: '150+' },
];

const getDiscountTier = (qty) => {
  return discountTiers.find((tier) => qty >= tier.min && qty <= tier.max) || discountTiers[0];
};

// Quantity threshold to reach the next discount tier, for the "order N more" hint
const getNextTier = (qty) => {
  return discountTiers.find((tier) => tier.min > qty) || null;
};

const OrderCalculator = ({ catalogs = [], categories = [], compact = false }) => {
  const [calcCategory, setCalcCategory] = useState('');
  const [calcMinPrice, setCalcMinPrice] = useState('');
  const [calcMaxPrice, setCalcMaxPrice] = useState('');
  const [calcCatalogId, setCalcCatalogId] = useState('');
  const [calcQuantity, setCalcQuantity] = useState(5);

  const calcFilteredCatalogs = React.useMemo(() => {
    return catalogs.filter((catalog) => {
      const matchesCategory = !calcCategory || catalog.categoryName === calcCategory;
      const min = catalog.priceRange?.minPrice || 0;
      const max = catalog.priceRange?.maxPrice || 0;
      const matchesMin = !calcMinPrice || max === 0 || max >= Number(calcMinPrice);
      const matchesMax = !calcMaxPrice || min === 0 || min <= Number(calcMaxPrice);
      return matchesCategory && matchesMin && matchesMax;
    });
  }, [catalogs, calcCategory, calcMinPrice, calcMaxPrice]);

  useEffect(() => {
    if (calcCatalogId && !calcFilteredCatalogs.some((c) => c._id === calcCatalogId)) {
      setCalcCatalogId('');
    }
  }, [calcFilteredCatalogs, calcCatalogId]);

  const calcSelectedCatalog = calcFilteredCatalogs.find((c) => c._id === calcCatalogId) || null;
  const calcUnitPrice = calcSelectedCatalog?.priceRange?.minPrice || 0;
  const calcCurrency = calcSelectedCatalog?.priceRange?.currency || '₹';
  const calcActiveTier = getDiscountTier(calcQuantity);
  const calcNextTier = getNextTier(calcQuantity);
  const calcSubtotal = calcUnitPrice * calcQuantity;
  const calcDiscountAmount = calcSubtotal * (calcActiveTier.percent / 100);
  const calcTotal = calcSubtotal - calcDiscountAmount;

  const adjustCalcQuantity = (delta) => {
    setCalcQuantity((prev) => Math.max(1, prev + delta));
  };

  const sendQuotationOnWhatsApp = () => {
    if (!calcSelectedCatalog) return;

    const lines = [
      'Hi, I would like a quotation for:',
      `Catalog: ${calcSelectedCatalog.name}`,
      calcSelectedCatalog.categoryName ? `Category: ${calcSelectedCatalog.categoryName}` : null,
      `Quantity: ${calcQuantity}`,
      `Unit price: ${calcCurrency}${calcUnitPrice}`,
      `Subtotal: ${calcCurrency}${calcSubtotal.toFixed(2)}`,
      `Discount: ${calcActiveTier.percent}% (${calcActiveTier.label} units)${calcDiscountAmount > 0 ? ` - ${calcCurrency}${calcDiscountAmount.toFixed(2)}` : ''}`,
      `Total: ${calcCurrency}${calcTotal.toFixed(2)}`,
    ].filter(Boolean);

    const message = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`bg-white overflow-hidden ${compact ? '' : 'rounded-3xl shadow-lg border border-gray-100'}`}>
      {!compact && (
        <div className="bg-gradient-to-r from-brand-yellow to-brand-gold px-6 sm:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/40 flex items-center justify-center shrink-0">
              <Calculator className="w-6 h-6 text-brand-dark" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-extrabold text-brand-dark">
                What do you want to order?
              </h2>
              <p className="text-brand-dark/80 text-sm mt-0.5">
                Filter by category and price, pick a catalog, choose your quantity — we'll work out your bulk discount instantly.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`${compact ? 'p-4 space-y-5' : 'p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8'}`}>
        {/* Filters + selection */}
        <div className="space-y-5">
          {/* Category filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Category</label>
            <select
              value={calcCategory}
              onChange={(e) => setCalcCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all text-sm"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category.name}>
                  {category.icon ? `${category.icon} ` : ''}{category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Price range</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={calcMinPrice}
                onChange={(e) => setCalcMinPrice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all text-sm"
              />
              <span className="text-gray-400">–</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={calcMaxPrice}
                onChange={(e) => setCalcMaxPrice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all text-sm"
              />
            </div>
          </div>

          {/* Catalog selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Select a catalog ({calcFilteredCatalogs.length} match{calcFilteredCatalogs.length === 1 ? '' : 'es'})
            </label>
            {calcFilteredCatalogs.length === 0 ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm bg-gray-50 rounded-xl px-4 py-3 border border-dashed border-gray-200">
                <PackageSearch className="w-4 h-4 shrink-0" />
                No catalogs match these filters
              </div>
            ) : (
              <select
                value={calcCatalogId}
                onChange={(e) => setCalcCatalogId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all text-sm"
              >
                <option value="">Choose a catalog...</option>
                {calcFilteredCatalogs.map((catalog) => (
                  <option key={catalog._id} value={catalog._id}>
                    {catalog.name}
                    {catalog.priceRange && catalog.priceRange.minPrice > 0
                      ? ` (${catalog.priceRange.currency}${catalog.priceRange.minPrice}+)`
                      : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quantity stepper */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Quantity needed</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustCalcQuantity(-1)}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="1"
                value={calcQuantity}
                onChange={(e) => setCalcQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 text-center px-2 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all text-sm font-semibold"
              />
              <button
                type="button"
                onClick={() => adjustCalcQuantity(1)}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Discount tier chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {discountTiers.map((tier) => (
              <span
                key={tier.label}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  calcActiveTier.label === tier.label
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                <Percent className="w-3 h-3" />
                {tier.label}: {tier.percent}%
              </span>
            ))}
          </div>
        </div>

        {/* Live calculation */}
        <div className="bg-brand-light rounded-2xl p-6 flex flex-col justify-center">
          {!calcSelectedCatalog ? (
            <div className="text-center text-gray-400 py-8">
              <Tag className="w-8 h-8 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Pick a catalog to see your price breakdown</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-500 line-clamp-1">{calcSelectedCatalog.name}</p>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Unit price</span>
                <span className="font-semibold text-gray-900">{calcCurrency}{calcUnitPrice}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Quantity</span>
                <span className="font-semibold text-gray-900">× {calcQuantity}</span>
              </div>
              <div className="flex items-center justify-between text-sm pb-3 border-b border-gray-200">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-900">{calcCurrency}{calcSubtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Discount ({calcActiveTier.percent}% · {calcActiveTier.label} units)
                </span>
                <span className="font-semibold text-green-600">
                  {calcDiscountAmount > 0 ? `- ${calcCurrency}${calcDiscountAmount.toFixed(2)}` : `${calcCurrency}0`}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="text-base font-bold text-gray-900">You pay</span>
                <span className="text-2xl font-extrabold text-brand-dark">{calcCurrency}{calcTotal.toFixed(2)}</span>
              </div>

              {calcNextTier && (
                <p className="text-xs text-gray-400 pt-1">
                  Order {calcNextTier.min - calcQuantity} more to unlock {calcNextTier.percent}% off.
                </p>
              )}

              <button
                type="button"
                onClick={sendQuotationOnWhatsApp}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1fbb59] text-white font-bold px-4 py-3 rounded-xl transition-colors shadow-sm"
              >
                <MessageCircle className="w-5 h-5" />
                Send Quotation on WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCalculator;
