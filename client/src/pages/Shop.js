import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  PackageSearch,
  SlidersHorizontal,
  Heart,
  ArrowUpDown,
  ArrowRight,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Check,
  Calculator,
  Loader2,
} from 'lucide-react';
import { API_ENDPOINTS, getImageUrl } from '../config/api';
import SEO from '../components/SEO';
import PriceNoticeBanner from '../components/PriceNoticeBanner';
import { useSavedProducts } from '../hooks/useSavedProducts';
import { swatchColor } from '../utils/colorSwatch';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' }
];

const formatPrice = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : 'Price on request');

const isNewProduct = (publishedAt) => {
  if (!publishedAt) return false;
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  return ageMs >= 0 && ageMs < 14 * 24 * 60 * 60 * 1000;
};

const PRICE_PRESETS = [
  { label: 'Under ₹500', min: '', max: '500' },
  { label: '₹500 – ₹1,000', min: '500', max: '1000' },
  { label: '₹1,000 – ₹2,500', min: '1000', max: '2500' },
  { label: '₹2,500+', min: '2500', max: '' }
];

const ProductCard = ({ product, saved, onToggleSave }) => {
  const primary = product.images?.find((i) => i.isPrimary) || product.images?.[0];
  const secondary = product.images?.find((i) => i !== primary);
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
        className="group relative flex flex-col h-full bg-white rounded-3xl p-2 ring-1 ring-black/[0.06] shadow-soft hover:shadow-lift hover:-translate-y-1 transition-all duration-500"
      >
        <div className="relative aspect-square rounded-2xl bg-gradient-to-b from-ink-50 to-ink-100 overflow-hidden">
          {primary ? (
            <>
              <img
                src={getImageUrl(primary.path)}
                alt={product.name || 'Product'}
                className={`absolute inset-0 w-full h-full object-contain p-3 mix-blend-multiply transition-all duration-700 ease-out group-hover:scale-105 ${secondary ? 'group-hover:opacity-0' : ''}`}
                loading="lazy"
              />
              {secondary && (
                <img
                  src={getImageUrl(secondary.path)}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-contain p-3 mix-blend-multiply opacity-0 scale-105 transition-all duration-700 ease-out group-hover:opacity-100 group-hover:scale-100"
                  loading="lazy"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PackageSearch className="w-10 h-10 text-ink-300" />
            </div>
          )}

          {/* Top-left badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
            {isNewProduct(product.publishedAt) && (
              <span className="inline-flex items-center gap-1 bg-brand-yellow text-brand-dark text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                <Sparkles className="w-2.5 h-2.5" /> New
              </span>
            )}
            {badge && (
              <span className="bg-brand-dark text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                {badge}
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(product._id); }}
            aria-label={saved ? 'Remove from saved' : 'Save product'}
            className={`absolute top-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center shadow-soft transition-all duration-300 hover:scale-110 active:scale-90 ${
              saved ? 'bg-rose-500 text-white' : 'bg-white/90 backdrop-blur text-ink-500 hover:text-rose-500'
            }`}
          >
            <Heart className={`w-4 h-4 transition-colors ${saved ? 'fill-white' : ''}`} />
          </button>

          {/* Quick-view pill */}
          <div className="absolute inset-x-2.5 bottom-2.5 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <span className="flex items-center justify-center gap-1.5 w-full rounded-full bg-brand-dark/90 backdrop-blur py-2.5 text-xs font-semibold text-white">
              View details <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        <div className="px-2.5 pt-3.5 pb-2.5 flex flex-col flex-1">
          {product.brand && <p className="text-[10px] font-bold text-ink-400 uppercase tracking-[0.14em] mb-1">{product.brand}</p>}
          <p className="font-semibold text-brand-dark text-sm leading-5 line-clamp-2 mb-2 flex-1">{product.name || 'Unnamed product'}</p>

          <div className="flex items-end justify-between gap-2">
            <div className="flex items-baseline gap-1">
              {showFrom && <span className="text-[11px] text-ink-400 font-medium">From</span>}
              <p className="text-brand-dark font-display font-extrabold text-base sm:text-lg">{formatPrice(product.priceFrom)}</p>
            </div>

            {product.colors?.length > 0 && (
              <div className="flex items-center -space-x-1 shrink-0 pb-1">
                {product.colors.slice(0, 5).map((c, i) => (
                  <span
                    key={i}
                    title={c.name || ''}
                    className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-sm shrink-0"
                    style={{ backgroundColor: c.code || swatchColor(c.name) }}
                  />
                ))}
                {extraColors > 0 && <span className="text-[10px] text-ink-400 font-semibold pl-1.5">+{extraColors}</span>}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const ProductCardSkeleton = () => (
  <div className="bg-white rounded-3xl p-2 ring-1 ring-black/[0.06]">
    <div className="aspect-square rounded-2xl skeleton" />
    <div className="px-2.5 pt-4 pb-2.5 space-y-2.5">
      <div className="h-2.5 w-1/3 rounded-full skeleton" />
      <div className="h-3.5 w-4/5 rounded-full skeleton" />
      <div className="h-4 w-2/5 rounded-full skeleton" />
    </div>
  </div>
);

const FilterPill = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-200 ${
      active ? 'bg-brand-dark text-white' : 'text-ink-600 hover:bg-ink-100 hover:text-brand-dark'
    }`}
  >
    <span className="flex items-center gap-2.5 min-w-0">
      <span className={`shrink-0 w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${active ? 'bg-brand-yellow border-brand-yellow' : 'border-ink-300 bg-white'}`}>
        {active && <Check className="w-3 h-3 text-brand-dark" />}
      </span>
      <span className="min-w-0 break-words [&>span]:text-current [&>span]:opacity-50">{children}</span>
    </span>
  </button>
);

const FilterSections = ({
  filterOptions, category, setCategory, brand, setBrand,
  minPrice, setMinPrice, maxPrice, setMaxPrice
}) => (
  <div className="space-y-7">
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400 mb-3">Category</h3>
      <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1 -mr-1">
        <FilterPill active={!category} onClick={() => setCategory('')}>All categories</FilterPill>
        {filterOptions.categories.map((c) => (
          <FilterPill key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
            {c.name} <span className="font-normal">({c.count})</span>
          </FilterPill>
        ))}
      </div>
    </div>

    <div className="pt-6 border-t border-ink-200/70">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400 mb-3">
        Price range {filterOptions.priceRange.max > 0 && <span className="normal-case tracking-normal font-medium text-ink-400">(₹{filterOptions.priceRange.min} – ₹{filterOptions.priceRange.max})</span>}
      </h3>
      <div className="flex items-center gap-2 mb-3">
        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">₹</span>
          <input type="number" min="0" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="input-field !rounded-xl !py-2.5 !pl-7" />
        </div>
        <span className="text-ink-300">—</span>
        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">₹</span>
          <input type="number" min="0" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="input-field !rounded-xl !py-2.5 !pl-7" />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRICE_PRESETS.map((p) => {
          const active = minPrice === p.min && maxPrice === p.max;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => { setMinPrice(active ? '' : p.min); setMaxPrice(active ? '' : p.max); }}
              className={`chip !px-3 !py-1 !text-[11px] ${active ? 'chip-active' : ''}`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>

    {filterOptions.brands.length > 0 && (
      <div className="pt-6 border-t border-ink-200/70">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400 mb-3">Brand</h3>
        <div className="space-y-0.5 max-h-56 overflow-y-auto pr-1 -mr-1">
          <FilterPill active={!brand} onClick={() => setBrand('')}>All brands</FilterPill>
          {filterOptions.brands.map((b) => (
            <FilterPill key={b.name} active={brand === b.name} onClick={() => setBrand(b.name)}>
              {b.name} <span className="font-normal">({b.count})</span>
            </FilterPill>
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

  // Every filter is seeded from the URL and kept in sync with it (see the sync effect below).
  // Without this, clicking into a product and hitting the browser's Back button remounts Shop
  // from scratch with no way to recover the filters that were active - React state alone
  // doesn't survive that round trip, only the URL does.
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialMinPrice = searchParams.get('minPrice') || '';
  const initialMaxPrice = searchParams.get('maxPrice') || '';
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [brand, setBrand] = useState(() => searchParams.get('brand') || '');
  const [category, setCategory] = useState(() => searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [debouncedMinPrice, setDebouncedMinPrice] = useState(initialMinPrice);
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState(initialMaxPrice);
  const [sort, setSort] = useState(() => searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const { savedIds, toggleSaved } = useSavedProducts();
  const topRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedMinPrice(minPrice), 400);
    return () => clearTimeout(t);
  }, [minPrice]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedMaxPrice(maxPrice), 400);
    return () => clearTimeout(t);
  }, [maxPrice]);

  // pageNum/replace are explicit args (not the `page` state) so the very next infinite-scroll
  // page can be requested immediately after bumping `page`, without waiting on a re-render.
  const fetchProducts = useCallback(async (pageNum, replace) => {
    if (replace) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (category) params.set('category', category);
      if (brand) params.set('brand', brand);
      if (debouncedMinPrice) params.set('minPrice', debouncedMinPrice);
      if (debouncedMaxPrice) params.set('maxPrice', debouncedMaxPrice);
      params.set('sort', sort);
      params.set('page', pageNum);

      const res = await fetch(`${API_ENDPOINTS.products}?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts((prev) => (replace ? data.products : [...prev, ...data.products]));
        setPagination(data.pagination);
        setFilterOptions(data.filters);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      if (replace) setLoading(false); else setLoadingMore(false);
    }
  }, [debouncedSearch, category, brand, debouncedMinPrice, debouncedMaxPrice, sort]);

  // Any filter/search/sort change starts a fresh list from page 1 - this is the only place
  // that replaces `products` outright; scrolling further only ever appends (see the
  // IntersectionObserver effect below). The mount-run is skipped so landing on /shop doesn't
  // yank the page down to the grid before the user has done anything.
  const didMountRef = useRef(false);
  useEffect(() => {
    setPage(1);
    fetchProducts(1, true);
    if (didMountRef.current) {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    didMountRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, category, brand, debouncedMinPrice, debouncedMaxPrice, sort]);

  // Mirrors the same filters into the URL (replacing, not pushing, so tweaking filters
  // doesn't spam the browser history) so that Back after opening a product restores them
  // instead of landing on a blank /shop.
  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedSearch) next.set('search', debouncedSearch);
    if (category) next.set('category', category);
    if (brand) next.set('brand', brand);
    if (debouncedMinPrice) next.set('minPrice', debouncedMinPrice);
    if (debouncedMaxPrice) next.set('maxPrice', debouncedMaxPrice);
    if (sort !== 'newest') next.set('sort', sort);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, category, brand, debouncedMinPrice, debouncedMaxPrice, sort]);

  // Infinite scroll: load the next page once the sentinel below the grid enters the viewport.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && page < pagination.totalPages) {
          const next = page + 1;
          setPage(next);
          fetchProducts(next, false);
        }
      },
      { rootMargin: '600px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, loadingMore, page, pagination.totalPages, fetchProducts]);

  const activeFilterCount = (category ? 1 : 0) + (brand ? 1 : 0) + (minPrice || maxPrice ? 1 : 0);
  const clearFilters = () => { setCategory(''); setBrand(''); setMinPrice(''); setMaxPrice(''); };

  const activeChips = useMemo(() => {
    const chips = [];
    if (category) {
      const c = filterOptions.categories.find((x) => x.id === category);
      chips.push({ key: 'category', label: c ? c.name : 'Category', clear: () => setCategory('') });
    }
    if (brand) chips.push({ key: 'brand', label: brand, clear: () => setBrand('') });
    if (minPrice || maxPrice) {
      chips.push({
        key: 'price',
        label: `₹${minPrice || 0} – ₹${maxPrice || filterOptions.priceRange.max || '∞'}`,
        clear: () => { setMinPrice(''); setMaxPrice(''); }
      });
    }
    return chips;
  }, [category, brand, minPrice, maxPrice, filterOptions]);

  const filterSectionProps = { filterOptions, category, setCategory, brand, setBrand, minPrice, setMinPrice, maxPrice, setMaxPrice };

  return (
    <div className="pt-20 min-h-screen bg-brand-light">
      <SEO
        title="Shop Products | Adihuman"
        description="Browse our full product catalog with real photos, prices, sizes and colours."
        path="/shop"
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid mask-radial" />
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[50rem] h-96 bg-brand-yellow/25 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 sm:pt-16 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-ink-600 shadow-soft ring-1 ring-black/5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {pagination.total > 0 ? `${pagination.total} products in stock` : 'Real photos, prices, sizes and colours'}
            </span>
            <h1 className="mt-6 text-5xl md:text-7xl font-display font-extrabold tracking-tightest text-brand-dark leading-[0.95]">
              Shop the <span className="text-gradient-animated">collection</span>
            </h1>
            <p className="mt-5 text-ink-500 text-base sm:text-lg max-w-xl mx-auto">
              Real photos, prices, sizes and colours — browse and find exactly what your team needs.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-2xl mx-auto mt-9"
          >
            <div className="group relative rounded-full bg-white p-1.5 shadow-card ring-1 ring-black/5 transition-all focus-within:ring-2 focus-within:ring-brand-yellow focus-within:shadow-glow">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-400 w-5 h-5 transition-colors group-focus-within:text-brand-dark" />
              <input
                type="text"
                placeholder="Search bottles, diaries, gift sets…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-14 py-3.5 rounded-full bg-transparent outline-none text-base text-brand-dark placeholder:text-ink-400"
              />
              {search ? (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-ink-100 text-ink-500 hover:bg-ink-200 hover:text-brand-dark flex items-center justify-center transition-colors" aria-label="Clear search">
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-brand-dark text-brand-yellow flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </span>
              )}
            </div>
          </motion.div>

          {/* Quick category chips */}
          {filterOptions.categories.length > 0 && (
            <div className="mt-7 -mx-4 px-4 overflow-x-auto no-scrollbar">
              <div className="flex w-max mx-auto gap-2">
                <button type="button" onClick={() => setCategory('')} className={`chip ${!category ? 'chip-active' : ''}`}>All</button>
                {filterOptions.categories.slice(0, 10).map((c) => (
                  <button key={c.id} type="button" onClick={() => setCategory(category === c.id ? '' : c.id)} className={`chip ${category === c.id ? 'chip-active' : ''}`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Price notice + calculator promo */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PriceNoticeBanner />
        </div>
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/order-calculator"
            className="group relative flex h-full items-center justify-between gap-4 overflow-hidden rounded-3xl bg-brand-dark px-5 py-5 text-white shadow-card sm:px-6"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-yellow/30 blur-2xl transition-transform duration-700 group-hover:scale-150" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-yellow flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:rotate-6">
                <Calculator className="w-6 h-6 text-brand-dark" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold leading-tight">
                  What do you want to order?
                </h2>
                <p className="text-white/55 text-xs sm:text-sm mt-1">
                  Pick a brand and quantity — see your bulk discount instantly and quote on WhatsApp.
                </p>
              </div>
            </div>
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-dark transition-transform duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </motion.div>
      </section>

      <section ref={topRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 scroll-mt-24">
        <div className="lg:flex lg:gap-8 lg:items-start">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-72 shrink-0 sticky top-24 surface p-5 max-h-[calc(100vh-7rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg text-brand-dark flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" /> Filters
              </h2>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-600 hover:bg-ink-200 hover:text-brand-dark transition-colors">
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>
            <FilterSections {...filterSectionProps} />
          </aside>

          {/* Main column */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="sticky top-[76px] z-20 -mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0 py-3 mb-5 bg-brand-light/85 backdrop-blur-xl lg:bg-transparent lg:backdrop-blur-none lg:static lg:pt-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(true)}
                    className={`lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border transition-all ${
                      activeFilterCount > 0 ? 'bg-brand-dark border-brand-dark text-white' : 'bg-white border-ink-200 text-ink-700 hover:border-brand-dark'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="bg-brand-yellow text-brand-dark text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{activeFilterCount}</span>
                    )}
                  </button>
                  <p className="hidden sm:block text-sm text-ink-500">
                    Showing <span className="font-bold text-brand-dark">{pagination.total}</span> {pagination.total === 1 ? 'product' : 'products'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {savedIds.size > 0 && (
                    <button
                      onClick={() => setSavedModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold bg-rose-50 text-rose-600 ring-1 ring-rose-100 hover:bg-rose-100 transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-500" />
                      Saved <span className="rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{savedIds.size}</span>
                    </button>
                  )}
                  <div className="relative">
                    <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400 pointer-events-none" />
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="pl-9 pr-9 py-2.5 rounded-full border border-ink-200 bg-white text-sm font-semibold text-ink-700 hover:border-brand-dark focus:ring-4 focus:ring-brand-yellow/30 focus:border-brand-dark outline-none appearance-none cursor-pointer transition-colors"
                    >
                      {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Active filter chips */}
              {activeChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {activeChips.map((chip) => (
                    <span key={chip.key} className="inline-flex items-center gap-1.5 bg-brand-yellow/25 text-brand-dark text-xs font-semibold pl-3 pr-1 py-1 rounded-full ring-1 ring-brand-yellow/60">
                      {chip.label}
                      <button onClick={chip.clear} className="w-5 h-5 rounded-full bg-white/70 hover:bg-white flex items-center justify-center transition-colors" aria-label={`Remove ${chip.label}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button onClick={clearFilters} className="text-xs font-semibold text-ink-500 hover:text-brand-dark px-2">Clear all</button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="surface py-20 px-6 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-100">
                  <PackageSearch className="w-8 h-8 text-ink-400" />
                </div>
                <p className="text-2xl font-display font-bold text-brand-dark">No products found</p>
                <p className="text-ink-500 mt-2 mb-7">Try a different search term or adjust your filters.</p>
                {(activeFilterCount > 0 || search) && (
                  <button
                    onClick={() => { clearFilters(); setSearch(''); }}
                    className="btn-secondary"
                  >
                    <RotateCcw className="w-4 h-4" /> Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                  <AnimatePresence>
                    {products.map((p) => (
                      <ProductCard key={p._id} product={p} saved={savedIds.has(p._id)} onToggleSave={toggleSaved} />
                    ))}
                  </AnimatePresence>
                </motion.div>

                {/* Infinite scroll sentinel - the IntersectionObserver above fires the next
                    page fetch once this enters the viewport, so the grid just keeps growing. */}
                <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />

                {loadingMore && (
                  <div className="flex items-center justify-center py-10">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-ink-500 shadow-soft ring-1 ring-black/5">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-medium">Loading more products…</span>
                    </span>
                  </div>
                )}

                {!loadingMore && page >= pagination.totalPages && products.length > 0 && (
                  <div className="flex items-center gap-4 py-12">
                    <div className="h-px flex-1 bg-ink-200" />
                    <p className="text-xs font-medium text-ink-400">
                      You've reached the end — {pagination.total} {pagination.total === 1 ? 'product' : 'products'} shown
                    </p>
                    <div className="h-px flex-1 bg-ink-200" />
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-x-0 bottom-0 max-h-[88vh] rounded-t-[2rem] bg-white flex flex-col shadow-lift"
            >
              <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-ink-200" />
              <div className="flex items-center justify-between px-5 py-4">
                <h2 className="font-display font-bold text-brand-dark text-xl">Filters</h2>
                <button onClick={() => setMobileFiltersOpen(false)} className="w-9 h-9 rounded-full bg-ink-100 hover:bg-ink-200 flex items-center justify-center" aria-label="Close filters">
                  <X className="w-4 h-4 text-ink-600" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-4">
                <FilterSections {...filterSectionProps} />
              </div>
              <div className="px-5 py-4 border-t border-ink-200/70 flex gap-3">
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="btn-outline flex-1">
                    Reset
                  </button>
                )}
                <button onClick={() => setMobileFiltersOpen(false)} className="btn-secondary flex-1">
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
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-brand-light rounded-t-[2rem] sm:rounded-[2rem] shadow-lift w-full sm:max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-ink-200/70">
          <h3 className="font-display font-bold text-brand-dark text-xl flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50"><Heart className="w-4 h-4 fill-rose-500 text-rose-500" /></span> Saved products
          </h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-ink-100 hover:bg-ink-200 flex items-center justify-center" aria-label="Close">
            <X className="w-4 h-4 text-ink-600" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {items === null ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-ink-400 py-10">No saved products yet — tap the heart icon on any product to save it here.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
