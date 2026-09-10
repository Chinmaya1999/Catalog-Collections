import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, Percent, Minus, Plus, PackageSearch, MessageCircle, Check } from 'lucide-react';
import { API_ENDPOINTS, getImageUrl } from '../config/api';
import ProductPhotoLightbox from './ProductPhotoLightbox';

// Same WhatsApp number the rest of the site sends quotation/product requests to
const WHATSAPP_NUMBER = '918296810381';

const discountTiers = [
  { min: 1, max: 19, percent: 5, label: '1-19' },
  { min: 20, max: 59, percent: 10, label: '20-59' },
  { min: 60, max: 149, percent: 20, label: '60-149' },
  { min: 150, max: Infinity, percent: 30, label: '150+' },
];

const getDiscountTier = (qty) => discountTiers.find((tier) => qty >= tier.min && qty <= tier.max) || discountTiers[0];
const getNextTier = (qty) => discountTiers.find((tier) => tier.min > qty) || null;

const formatPrice = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : 'Price on request');

// Fetches every published shop product once (a handful of pages at most, for this catalog's
// scale) so category/price/brand narrowing and the matching-products list can all run
// client-side without re-hitting the server on every filter change.
const fetchAllPublishedProducts = async () => {
  const limit = 60;
  let page = 1;
  const seenIds = new Set();
  let all = [];
  let categories = [];
  // Hard cap of 10 pages (600 products) so a runaway catalog can't spin this forever.
  for (let i = 0; i < 10; i++) {
    const res = await fetch(`${API_ENDPOINTS.products}?limit=${limit}&page=${page}&sort=name_asc`);
    if (!res.ok) break;
    const data = await res.json();
    // Defends against a duplicate product landing on two pages (e.g. tied sort keys) -
    // without this, React sees repeated _id keys in the product grid below.
    (data.products || []).forEach((p) => {
      if (!seenIds.has(p._id)) {
        seenIds.add(p._id);
        all.push(p);
      }
    });
    if (page === 1) categories = data.filters?.categories || [];
    if (!data.pagination || page >= data.pagination.totalPages) break;
    page += 1;
  }
  return { products: all, categories };
};

const ProductOrderCalculator = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [calcCategory, setCalcCategory] = useState('');
  const [calcMinPrice, setCalcMinPrice] = useState('');
  const [calcMaxPrice, setCalcMaxPrice] = useState('');
  const [calcBrand, setCalcBrand] = useState('');
  const [calcProductId, setCalcProductId] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [calcQuantity, setCalcQuantity] = useState(5);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { products, categories } = await fetchAllPublishedProducts();
        if (!cancelled) {
          setAllProducts(products);
          setCategoryOptions(categories);
        }
      } catch (error) {
        console.error('Error fetching products for order calculator:', error);
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Category + price narrow down the pool - this is also what the brand list is computed from,
  // so brand options only ever show brands that actually have matches so far.
  const categoryAndPriceFiltered = useMemo(() => {
    const min = calcMinPrice !== '' ? Number(calcMinPrice) : null;
    const max = calcMaxPrice !== '' ? Number(calcMaxPrice) : null;
    return allProducts.filter((p) => {
      const matchesCategory = !calcCategory || p.category === calcCategory;
      const matchesMin = min === null || !(p.priceFrom > 0) || p.priceFrom >= min;
      const matchesMax = max === null || !(p.priceFrom > 0) || p.priceFrom <= max;
      return matchesCategory && matchesMin && matchesMax;
    });
  }, [allProducts, calcCategory, calcMinPrice, calcMaxPrice]);

  const brandOptions = useMemo(() => {
    const counts = new Map();
    categoryAndPriceFiltered.forEach((p) => {
      if (!p.brand) return;
      counts.set(p.brand, (counts.get(p.brand) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categoryAndPriceFiltered]);

  // Drop a brand pick that's no longer valid once category/price narrows further
  useEffect(() => {
    if (calcBrand && !brandOptions.some((b) => b.name === calcBrand)) {
      setCalcBrand('');
    }
  }, [brandOptions, calcBrand]);

  const matchingProducts = useMemo(() => {
    if (!calcBrand) return [];
    return categoryAndPriceFiltered.filter((p) => p.brand === calcBrand);
  }, [categoryAndPriceFiltered, calcBrand]);

  // Only reacts to the matching-products list itself changing (brand/category/price
  // filters), not to calcProductId - that also changes while swiping inside the lightbox,
  // which must not force the lightbox closed.
  useEffect(() => {
    setCalcProductId((prev) => (prev && !matchingProducts.some((p) => p._id === prev) ? '' : prev));
    setLightboxIndex(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchingProducts]);

  const selectedProduct = matchingProducts.find((p) => p._id === calcProductId) || null;
  const unitPrice = selectedProduct?.priceFrom || 0;
  const activeTier = getDiscountTier(calcQuantity);
  const nextTier = getNextTier(calcQuantity);
  const subtotal = unitPrice * calcQuantity;
  const discountAmount = subtotal * (activeTier.percent / 100);
  const total = subtotal - discountAmount;

  const adjustQuantity = (delta) => setCalcQuantity((prev) => Math.max(1, prev + delta));

  const sendQuotationOnWhatsApp = () => {
    if (!selectedProduct) return;
    const lines = [
      'Hi, I would like a quotation for:',
      `Product: ${selectedProduct.name || 'Unnamed product'}`,
      `Brand: ${selectedProduct.brand || calcBrand}`,
      selectedProduct.categoryName ? `Category: ${selectedProduct.categoryName}` : null,
      `Quantity: ${calcQuantity}`,
      `Unit price: ${formatPrice(unitPrice)}`,
      `Subtotal: ${formatPrice(subtotal)}`,
      `Discount: ${activeTier.percent}% (${activeTier.label} units)${discountAmount > 0 ? ` - ${formatPrice(discountAmount)}` : ''}`,
      `Total: ${formatPrice(total)}`,
      `Link: ${window.location.origin}/shop/${selectedProduct._id}`
    ].filter(Boolean);

    const message = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white overflow-hidden rounded-3xl shadow-lg border border-gray-100">
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
              Filter by category and price, pick a brand, choose your quantity — we'll work out your bulk discount instantly.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Filters + quantity */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Category</label>
            <select
              value={calcCategory}
              onChange={(e) => setCalcCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all text-sm"
            >
              <option value="">All categories</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.count})</option>
              ))}
            </select>
          </div>

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

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Select Brand ({brandOptions.length} match{brandOptions.length === 1 ? '' : 'es'})
            </label>
            {brandOptions.length === 0 ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm bg-gray-50 rounded-xl px-4 py-3 border border-dashed border-gray-200">
                <PackageSearch className="w-4 h-4 shrink-0" />
                {loadingProducts ? 'Loading brands…' : 'No brands match these filters'}
              </div>
            ) : (
              <select
                value={calcBrand}
                onChange={(e) => setCalcBrand(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all text-sm"
              >
                <option value="">Choose a brand...</option>
                {brandOptions.map((b) => (
                  <option key={b.name} value={b.name}>{b.name} ({b.count})</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Quantity needed</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustQuantity(-1)}
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
                onClick={() => adjustQuantity(1)}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {discountTiers.map((tier) => (
              <span
                key={tier.label}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTier.label === tier.label ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-500'
                }`}
              >
                <Percent className="w-3 h-3" />
                {tier.label}: {tier.percent}%
              </span>
            ))}
          </div>
        </div>

        {/* Matching products */}
        <div className="bg-brand-light rounded-2xl p-6 flex flex-col justify-center">
          {!calcBrand ? (
            <div className="text-center text-gray-400 py-8">
              <PackageSearch className="w-8 h-8 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Pick a brand to see matching products</p>
            </div>
          ) : matchingProducts.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">No products found for this brand</div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-500">
                {matchingProducts.length} product{matchingProducts.length === 1 ? '' : 's'} from {calcBrand}
              </p>
              <div className="flex flex-wrap justify-center gap-3 max-h-72 overflow-y-auto p-1">
                {matchingProducts.map((product, idx) => {
                  const primary = product.images?.find((i) => i.isPrimary) || product.images?.[0];
                  const isSelected = product._id === calcProductId;
                  return (
                    <button
                      type="button"
                      key={product._id}
                      onClick={() => {
                        setCalcProductId(product._id);
                        setLightboxIndex(idx);
                      }}
                      className={`relative w-24 bg-white rounded-lg border overflow-hidden shadow-sm text-left cursor-pointer hover:shadow-md transition-shadow ${
                        isSelected ? 'border-brand-yellow ring-2 ring-brand-yellow' : 'border-gray-200'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-1 right-1 z-10 bg-brand-yellow text-brand-dark rounded-full w-4 h-4 flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                      <div className="bg-gray-50 aspect-square flex items-center justify-center overflow-hidden">
                        {primary ? (
                          <img src={getImageUrl(primary.path)} alt={product.name} className="w-full h-full object-contain" loading="lazy" />
                        ) : (
                          <PackageSearch className="w-6 h-6 text-gray-300" />
                        )}
                      </div>
                      <div className="p-1.5 text-center">
                        <p className="text-[10px] font-semibold text-gray-900 line-clamp-1">{product.name || 'Product'}</p>
                        <p className="text-[10px] font-bold text-brand-dark">{formatPrice(product.priceFrom)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedProduct ? (
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">{selectedProduct.name}</p>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-gray-500">Unit price</span>
                    <span className="font-semibold text-gray-900">{formatPrice(unitPrice)}</span>
                  </div>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-gray-500">Subtotal ({calcQuantity} units)</span>
                    <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-gray-500">Discount ({activeTier.percent}%)</span>
                    <span className="font-semibold text-green-600">- {formatPrice(discountAmount)}</span>
                  </div>
                  <div className="flex items-baseline justify-between text-base pt-1 border-t border-gray-100">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-brand-dark">{formatPrice(total)}</span>
                  </div>

                  {nextTier && (
                    <p className="text-xs text-gray-400 text-center pt-1">
                      Order {nextTier.min - calcQuantity} more to unlock {nextTier.percent}% off.
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
              ) : (
                <p className="text-xs text-gray-400 text-center pt-1">Tap a product above to get its price and quote.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {lightboxIndex !== null && matchingProducts[lightboxIndex] && (
        <ProductPhotoLightbox
          products={matchingProducts}
          startIndex={lightboxIndex}
          onSelect={(product) => setCalcProductId(product._id)}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
};

export default ProductOrderCalculator;
