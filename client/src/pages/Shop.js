import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  PackageSearch,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Heart,
  ArrowUpDown,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Check,
} from 'lucide-react';
import { API_ENDPOINTS, getImageUrl } from '../config/api';
import SEO from '../components/SEO';
import ProductOrderCalculator from '../components/ProductOrderCalculator';
import PriceNoticeBanner from '../components/PriceNoticeBanner';
import { useSavedProducts } from '../hooks/useSavedProducts';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' }
];

// Best-effort swatch colour for facet colour names (which arrive upper-cased and without a
// hex code) - falls back to a neutral dot for anything unrecognised, with the name always
// shown alongside so meaning is never carried by colour alone.
const COLOR_SWATCH_MAP = {
  black: '#111827', white: '#ffffff', grey: '#9ca3af', gray: '#9ca3af', red: '#ef4444',
  blue: '#3b82f6', navy: '#1e3a5f', green: '#22c55e', yellow: '#eab308', gold: '#d4af37',
  orange: '#f97316', purple: '#a855f7', pink: '#ec4899', brown: '#92400e', beige: '#e8dcc8',
  silver: '#c0c0c0', maroon: '#7f1d1d', teal: '#14b8a6', cyan: '#06b6d4', khaki: '#bdb76b',
  olive: '#808000', wine: '#722f37', tan: '#d2b48c'
};
const swatchColor = (name) => COLOR_SWATCH_MAP[(name || '').toLowerCase()] || '#d1d5db';

const formatPrice = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : 'Price on request');

const isNewProduct = (publishedAt) => {
  if (!publishedAt) return false;
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  return ageMs >= 0 && ageMs < 14 * 24 * 60 * 60 * 1000;
};

// Windowed page list with ellipses, e.g. 1 ... 4 5 [6] 7 8 ... 24, so pagination stays
// usable (and doesn't wrap ugly) even with a couple hundred products behind it.
const getPageNumbers = (current, total) => {
  const delta = 1;
  const pages = [];
  const range = [];
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i);
  }
  if (current - delta > 2) pages.push(1, '…');
  else pages.push(1);
  pages.push(...range);
  if (current + delta < total - 1) pages.push('…', total);
  else if (total > 1) pages.push(total);
  return pages;
};

const ProductCard = ({ product, saved, onToggleSave }) => {
  const primary = product.images?.find((i) => i.isPrimary) || product.images?.[0];
  const extraColors = (product.colors?.length || 0) - 5;
  const badge = product.badges?.[0];
  const showFrom = (product.variants?.length || 0) > 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Link
        to={`/shop/${product._id}`}
        className="group relative flex flex-col h-full bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      >
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {primary ? (
            <img
              src={getImageUrl(primary.path)}
              alt={product.name || 'Product'}
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PackageSearch className="w-10 h-10 text-gray-300" />
            </div>
          )}

          {/* Top-left badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
            {isNewProduct(product.publishedAt) && (
              <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full shadow-sm">
                <Sparkles className="w-2.5 h-2.5" /> New
              </span>
            )}
            {badge && (
              <span className="bg-brand-dark/90 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full shadow-sm">
                {badge}
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(product._id); }}
            aria-label={saved ? 'Remove from saved' : 'Save product'}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          >
            <Heart className={`w-4 h-4 transition-colors ${saved ? 'fill-rose-500 text-rose-500' : 'text-gray-500'}`} />
          </button>

          {/* Quick-view sweep-up */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/70 to-transparent pt-8 pb-2.5">
            <p className="text-center text-white text-xs font-semibold tracking-wide">View details →</p>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          {product.brand && <p className="text-[11px] font-semibold text-brand-gold uppercase tracking-wide mb-0.5">{product.brand}</p>}
          <p className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1.5 flex-1">{product.name || 'Unnamed product'}</p>

          {product.colors?.length > 0 && (
            <div className="flex items-center gap-1 mb-2">
              {product.colors.slice(0, 5).map((c, i) => (
                <span
                  key={i}
                  title={c.name || ''}
                  className="w-3.5 h-3.5 rounded-full border border-gray-200 shrink-0"
                  style={{ backgroundColor: c.code || swatchColor(c.name) }}
                />
              ))}
              {extraColors > 0 && <span className="text-[10px] text-gray-400 font-medium ml-0.5">+{extraColors}</span>}
            </div>
          )}

          <div className="flex items-baseline gap-1">
            {showFrom && <span className="text-[11px] text-gray-400 font-medium">From</span>}
            <p className="text-brand-dark font-bold text-base">{formatPrice(product.priceFrom)}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const ProductCardSkeleton = () => (
  <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
    <div className="aspect-square bg-gray-100 animate-pulse" />
    <div className="p-4 space-y-2">
      <div className="h-2.5 w-1/3 bg-gray-100 rounded animate-pulse" />
      <div className="h-3.5 w-4/5 bg-gray-100 rounded animate-pulse" />
      <div className="h-3.5 w-2/5 bg-gray-100 rounded animate-pulse" />
    </div>
  </div>
);

const FilterPill = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-medium text-left transition-colors ${
      active ? 'bg-brand-yellow/15 text-brand-dark ring-1 ring-brand-yellow/60' : 'text-gray-600 hover:bg-gray-50'
    }`}
  >
    <span className="flex items-center gap-2 min-w-0">
      <span className={`shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${active ? 'bg-brand-yellow border-brand-yellow' : 'border-gray-300'}`}>
        {active && <Check className="w-2.5 h-2.5 text-brand-dark" />}
      </span>
      <span className="truncate">{children}</span>
    </span>
  </button>
);

const FilterSections = ({
  filterOptions, category, setCategory, brand, setBrand, color, setColor,
  minPrice, setMinPrice, maxPrice, setMaxPrice
}) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Category</h3>
      <div className="space-y-0.5 max-h-64 overflow-y-auto pr-1">
        <FilterPill active={!category} onClick={() => setCategory('')}>All categories</FilterPill>
        {filterOptions.categories.map((c) => (
          <FilterPill key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
            {c.name} <span className="text-gray-400 font-normal">({c.count})</span>
          </FilterPill>
        ))}
      </div>
    </div>

    <div>
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
        Price range {filterOptions.priceRange.max > 0 && <span className="normal-case font-normal text-gray-400">(₹{filterOptions.priceRange.min} – ₹{filterOptions.priceRange.max})</span>}
      </h3>
      <div className="flex items-center gap-2">
        <input type="number" min="0" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-brand-yellow outline-none" />
        <span className="text-gray-400">–</span>
        <input type="number" min="0" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-brand-yellow outline-none" />
      </div>
    </div>

    {filterOptions.brands.length > 0 && (
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Brand</h3>
        <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
          <FilterPill active={!brand} onClick={() => setBrand('')}>All brands</FilterPill>
          {filterOptions.brands.map((b) => (
            <FilterPill key={b.name} active={brand === b.name} onClick={() => setBrand(b.name)}>
              {b.name} <span className="text-gray-400 font-normal">({b.count})</span>
            </FilterPill>
          ))}
        </div>
      </div>
    )}

    {filterOptions.colors.length > 0 && (
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Colour</h3>
        <div className="flex flex-wrap gap-2">
          {filterOptions.colors.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setColor(color === c.name ? '' : c.name)}
              title={`${c.name} (${c.count})`}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                color === c.name ? 'border-brand-gold scale-110' : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{ backgroundColor: swatchColor(c.name) }}
            >
              {color === c.name && <Check className={`w-3.5 h-3.5 ${['white', 'silver', 'beige', 'tan'].includes(c.name.toLowerCase()) ? 'text-gray-700' : 'text-white'}`} />}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
);

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filterOptions, setFilterOptions] = useState({ categories: [], brands: [], colors: [], priceRange: { min: 0, max: 0 } });
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [savedModalOpen, setSavedModalOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const { savedIds, toggleSaved } = useSavedProducts();
  const topRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, category, brand, color, minPrice, maxPrice, sort]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (category) params.set('category', category);
      if (brand) params.set('brand', brand);
      if (color) params.set('color', color);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      params.set('sort', sort);
      params.set('page', page);

      const res = await fetch(`${API_ENDPOINTS.products}?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setPagination(data.pagination);
        setFilterOptions(data.filters);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, brand, color, minPrice, maxPrice, sort, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const activeFilterCount = (category ? 1 : 0) + (brand ? 1 : 0) + (color ? 1 : 0) + (minPrice || maxPrice ? 1 : 0);
  const clearFilters = () => { setCategory(''); setBrand(''); setColor(''); setMinPrice(''); setMaxPrice(''); };

  const activeChips = useMemo(() => {
    const chips = [];
    if (category) {
      const c = filterOptions.categories.find((x) => x.id === category);
      chips.push({ key: 'category', label: c ? c.name : 'Category', clear: () => setCategory('') });
    }
    if (brand) chips.push({ key: 'brand', label: brand, clear: () => setBrand('') });
    if (color) chips.push({ key: 'color', label: color, clear: () => setColor('') });
    if (minPrice || maxPrice) {
      chips.push({
        key: 'price',
        label: `₹${minPrice || 0} – ₹${maxPrice || filterOptions.priceRange.max || '∞'}`,
        clear: () => { setMinPrice(''); setMaxPrice(''); }
      });
    }
    return chips;
  }, [category, brand, color, minPrice, maxPrice, filterOptions]);

  const goToPage = (p) => {
    setPage(p);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filterSectionProps = { filterOptions, category, setCategory, brand, setBrand, color, setColor, minPrice, setMinPrice, maxPrice, setMaxPrice };

  return (
    <div className="pt-20 min-h-screen bg-brand-light">
      <SEO
        title="Shop Products | Adihuman"
        description="Browse our full product catalog with real photos, prices, sizes and colours."
        path="/shop"
      />

      <section className="relative overflow-hidden bg-gradient-to-b from-brand-light to-white">
        <div className="pointer-events-none absolute -top-32 -right-24 w-96 h-96 bg-brand-yellow/25 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-gray-900 mb-3">
            Shop Our <span className="text-gradient">Products</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
            {pagination.total > 0 ? `${pagination.total} products` : 'Real photos, prices, sizes and colours'} — browse and find what you need.
          </p>

          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all text-base"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" aria-label="Clear search">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {filterOptions.categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mt-6 max-w-3xl mx-auto justify-center sm:flex-wrap">
              <button
                onClick={() => setCategory('')}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${!category ? 'bg-gray-900 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                All
              </button>
              {filterOptions.categories.slice(0, 8).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(category === c.id ? '' : c.id)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${category === c.id ? 'bg-gray-900 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Price notice */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <PriceNoticeBanner />
      </div>

      {/* Bulk Pricing Calculator */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <ProductOrderCalculator />
        </motion.div>
      </section>

      <section ref={topRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 scroll-mt-24">
        <div className="lg:flex lg:gap-8 lg:items-start">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-24 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Filters</h2>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900">
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>
            <FilterSections {...filterSectionProps} />
          </aside>

          {/* Main column */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="sticky top-20 z-20 -mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0 py-3 mb-5 bg-brand-light/95 backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none lg:static">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(true)}
                    className={`lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                      activeFilterCount > 0 ? 'bg-brand-yellow border-brand-yellow text-brand-dark' : 'bg-white border-gray-200 text-gray-700 hover:border-brand-yellow'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="bg-brand-dark text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>
                    )}
                  </button>
                  <p className="hidden sm:block text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">{pagination.total}</span> {pagination.total === 1 ? 'product' : 'products'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {savedIds.size > 0 && (
                    <button
                      onClick={() => setSavedModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-500" />
                      Saved ({savedIds.size})
                    </button>
                  )}
                  <div className="relative">
                    <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="pl-8 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none appearance-none cursor-pointer"
                    >
                      {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Active filter chips */}
              {activeChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {activeChips.map((chip) => (
                    <span key={chip.key} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium pl-3 pr-1.5 py-1 rounded-full shadow-sm">
                      {chip.label}
                      <button onClick={chip.clear} className="w-4 h-4 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  <button onClick={clearFilters} className="text-xs font-semibold text-gray-500 hover:text-gray-900 underline">Clear all</button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-20 text-center">
                <PackageSearch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-700">No products found</p>
                <p className="text-gray-400 mt-1 mb-6">Try a different search term or adjust your filters.</p>
                {(activeFilterCount > 0 || search) && (
                  <button
                    onClick={() => { clearFilters(); setSearch(''); }}
                    className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-black transition-all"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
                  <AnimatePresence>
                    {products.map((p) => (
                      <ProductCard key={p._id} product={p} saved={savedIds.has(p._id)} onToggleSave={toggleSaved} />
                    ))}
                  </AnimatePresence>
                </motion.div>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
                    <button
                      onClick={() => goToPage(Math.max(1, page - 1))}
                      disabled={page <= 1}
                      className="p-2 rounded-lg border border-gray-200 bg-white hover:border-brand-yellow disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {getPageNumbers(pagination.page, pagination.totalPages).map((p, i) =>
                      p === '…' ? (
                        <span key={`dots-${i}`} className="px-2 text-sm text-gray-400">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => goToPage(p)}
                          className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-semibold transition-colors ${
                            p === pagination.page ? 'bg-gray-900 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-yellow'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => goToPage(Math.min(pagination.totalPages, page + 1))}
                      disabled={page >= pagination.totalPages}
                      className="p-2 rounded-lg border border-gray-200 bg-white hover:border-brand-yellow disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-y-0 left-0 w-[85%] max-w-sm bg-white flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 text-lg">Filters</h2>
                <button onClick={() => setMobileFiltersOpen(false)} className="p-1.5 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <FilterSections {...filterSectionProps} />
              </div>
              <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50">
                    Reset
                  </button>
                )}
                <button onClick={() => setMobileFiltersOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900 text-white font-semibold hover:bg-black">
                  Show {pagination.total} results
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved products modal */}
      <AnimatePresence>
        {savedModalOpen && (
          <SavedProductsModal
            savedIds={savedIds}
            toggleSaved={toggleSaved}
            onClose={() => setSavedModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const SavedProductsModal = ({ savedIds, toggleSaved, onClose }) => {
  const [items, setItems] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const ids = [...savedIds];
    if (ids.length === 0) {
      setItems([]);
      return;
    }
    setItems(null);
    fetch(`${API_ENDPOINTS.products}?ids=${ids.join(',')}`)
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data) => { if (!cancelled) setItems(data.products || []); })
      .catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedIds.size]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-lg max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" /> Saved products
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {items === null ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-gray-400 py-10">No saved products yet — tap the heart icon on any product to save it here.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {items.map((p) => (
                <ProductCard key={p._id} product={p} saved={savedIds.has(p._id)} onToggleSave={toggleSaved} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Shop;
