import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  PackageSearch,
  Heart,
  ArrowUpDown,
  ArrowRight,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Check,
  Plus,
  Calculator,
  Loader2,
  LayoutGrid,
  Table2,
  MessageCircle,
  ClipboardList,
} from 'lucide-react';
import { API_ENDPOINTS, getImageUrl } from '../config/api';
import SEO from '../components/SEO';
import PriceNoticeBanner from '../components/PriceNoticeBanner';
import ProposalDrawer, { buildProposalText } from '../components/ProposalDrawer';
import { useSavedProducts } from '../hooks/useSavedProducts';
import { useProposal, displayCode } from '../hooks/useProposal';
import { swatchColor } from '../utils/colorSwatch';

const WHATSAPP_NUMBER = '918296810381';
const VIEW_KEY = 'catlog_shop_view';
const MODE_KEY = 'catlog_shop_mode';
const ADD_ALL_LIMIT = 120;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Featured' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'code', label: 'Code' },
  { value: 'name_asc', label: 'Name: A to Z' }
];

// Customer budget per unit - same quick ranges as the gift catalogue.
const BUDGET_PRESETS = [
  { label: 'Any', min: '', max: '' },
  { label: 'Under ₹250', min: '', max: '250' },
  { label: '₹250–500', min: '250', max: '500' },
  { label: '₹500–1,000', min: '500', max: '1000' },
  { label: '₹1,000–2,000', min: '1000', max: '2000' },
  { label: '₹2,000+', min: '2000', max: '' }
];

const inr = (n) => (typeof n === 'number' ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—');
const formatPrice = (n) => (typeof n === 'number' ? inr(n) : 'Price on request');

const isNewProduct = (publishedAt) => {
  if (!publishedAt) return false;
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  return ageMs >= 0 && ageMs < 14 * 24 * 60 * 60 * 1000;
};

const readStored = (key, fallback) => {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
};
const writeStored = (key, value) => {
  try { localStorage.setItem(key, value); } catch { /* private browsing */ }
};

// Only the superadmin (same token the dashboards use) can see supplier cost/profit - the costs
// endpoint is role-checked server-side, this just decides whether to ask for them at all.
const getAdminToken = () => {
  try {
    const info = JSON.parse(localStorage.getItem('adminInfo') || 'null');
    return info?.role === 'superadmin' ? localStorage.getItem('adminToken') : null;
  } catch {
    return null;
  }
};

const profitOf = (price, cost) => {
  if (typeof price !== 'number' || typeof cost !== 'number') return null;
  const profit = price - cost;
  return { profit, margin: price ? (profit / price) * 100 : 0 };
};

const ProductCard = ({ product, saved, onToggleSave, selected, onToggleSelect, cost }) => {
  const primary = product.images?.find((i) => i.isPrimary) || product.images?.[0];
  const secondary = product.images?.find((i) => i !== primary);
  const extraColors = (product.colors?.length || 0) - 5;
  const badge = product.badges?.[0];
  const showFrom = (product.variants?.length || 0) > 1;
  const code = displayCode(product);
  const money = cost !== undefined ? profitOf(product.priceFrom, cost) : null;

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
        className={`group relative flex flex-col h-full bg-white rounded-3xl p-2 shadow-soft hover:shadow-lift hover:-translate-y-1 transition-all duration-500 ${
          selected ? 'ring-2 ring-brand-dark' : 'ring-1 ring-black/[0.06]'
        }`}
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
            <div className="w-full h-full flex items-center justify-center text-center">
              <div>
                <PackageSearch className="w-9 h-9 text-ink-300 mx-auto" />
                <p className="mt-1.5 font-mono text-[11px] text-ink-400">{code || 'No photo'}</p>
              </div>
            </div>
          )}

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

          <div className="absolute top-2.5 right-2.5 flex flex-col gap-2">
            {onToggleSelect && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSelect(product); }}
                aria-label={selected ? 'Remove from proposal' : 'Add to proposal'}
                title={selected ? 'Remove from proposal' : 'Add to proposal'}
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-soft transition-all duration-300 hover:scale-110 active:scale-90 ${
                  selected ? 'bg-brand-dark text-brand-yellow' : 'bg-white/90 backdrop-blur text-ink-600 hover:text-brand-dark'
                }`}
              >
                {selected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(product._id); }}
              aria-label={saved ? 'Remove from saved' : 'Save product'}
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-soft transition-all duration-300 hover:scale-110 active:scale-90 ${
                saved ? 'bg-rose-500 text-white' : 'bg-white/90 backdrop-blur text-ink-500 hover:text-rose-500'
              }`}
            >
              <Heart className={`w-4 h-4 transition-colors ${saved ? 'fill-white' : ''}`} />
            </button>
          </div>
        </div>

        <div className="px-2.5 pt-3.5 pb-2.5 flex flex-col flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            {product.brand && <p className="text-[10px] font-bold text-ink-400 uppercase tracking-[0.14em] truncate">{product.brand}</p>}
            {code && <p className="font-mono text-[11px] text-ink-400 shrink-0 ml-auto">{code}</p>}
          </div>
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

          {cost !== undefined && (
            <div className="mt-2.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 border-t border-dashed border-ink-200 pt-2 text-[11px] text-ink-500">
              <span>Supplier</span><span className="text-right tabular-nums">{inr(cost)}</span>
              <span className="font-semibold text-amber-600">Profit</span>
              <span className="text-right font-semibold text-amber-600 tabular-nums">
                {money ? `${inr(money.profit)} · ${money.margin.toFixed(0)}%` : '—'}
              </span>
            </div>
          )}
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

const CompareTable = ({ products, proposal, costs, showCosts, sort, setSort }) => {
  const sortIndicator = sort === 'price_asc' ? ' ↑' : sort === 'price_desc' ? ' ↓' : '';
  const th = 'sticky top-0 bg-ink-100 px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-ink-500 whitespace-nowrap';
  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-black/[0.06] shadow-soft">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={th} aria-label="Select" />
            <th className={th} aria-label="Photo" />
            <th className={`${th} cursor-pointer select-none`} onClick={() => setSort('code')}>Code{sort === 'code' ? ' ↑' : ''}</th>
            <th className={th}>Category</th>
            <th className={th}>Item</th>
            {showCosts && <th className={`${th} text-right`}>Supplier ₹</th>}
            {showCosts && <th className={`${th} text-right`}>Profit ₹</th>}
            {showCosts && <th className={`${th} text-right`}>Profit %</th>}
            <th className={`${th} text-right cursor-pointer select-none`} onClick={() => setSort(sort === 'price_asc' ? 'price_desc' : 'price_asc')}>
              Price ₹{sortIndicator}
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const primary = p.images?.find((i) => i.isPrimary) || p.images?.[0];
            const selected = !!proposal.items[p._id];
            const cost = costs[p._id]?.cost;
            const money = showCosts ? profitOf(p.priceFrom, cost) : null;
            const td = 'px-3 py-2 border-t border-ink-200/70 align-middle';
            return (
              <tr key={p._id} className={selected ? 'bg-brand-yellow/20' : 'hover:bg-ink-50'}>
                <td className={td}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => proposal.toggle(p)}
                    aria-label={`Select ${p.name || 'product'}`}
                    className="h-4 w-4 accent-brand-dark"
                  />
                </td>
                <td className={td}>
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-black/10">
                    {primary ? (
                      <img src={getImageUrl(primary.path)} alt="" className="h-full w-full object-contain" loading="lazy" />
                    ) : (
                      <PackageSearch className="h-4 w-4 text-ink-300" />
                    )}
                  </div>
                </td>
                <td className={`${td} whitespace-nowrap font-mono text-xs text-ink-600`}>{displayCode(p) || '—'}</td>
                <td className={`${td} whitespace-nowrap text-ink-500`}>{p.categoryName || '—'}</td>
                <td className={`${td} min-w-[220px] max-w-[340px]`}>
                  <Link to={`/shop/${p._id}`} className="font-medium text-brand-dark hover:underline">{p.name || 'Unnamed product'}</Link>
                </td>
                {showCosts && <td className={`${td} text-right tabular-nums`}>{inr(cost)}</td>}
                {showCosts && <td className={`${td} text-right tabular-nums font-semibold text-amber-600`}>{money ? inr(money.profit) : '—'}</td>}
                {showCosts && <td className={`${td} text-right tabular-nums`}>{money ? `${money.margin.toFixed(0)}%` : '—'}</td>}
                <td className={`${td} text-right tabular-nums font-bold text-brand-dark whitespace-nowrap`}>{formatPrice(p.priceFrom)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const Segmented = ({ options, value, onChange, label }) => (
  <div role="group" aria-label={label} className="inline-flex gap-0.5 rounded-full bg-ink-100 p-1">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        aria-pressed={value === o.value}
        onClick={() => onChange(o.value)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all ${
          value === o.value ? 'bg-white text-brand-dark shadow-soft' : 'text-ink-500 hover:text-brand-dark'
        }`}
      >
        {o.icon}{o.label}
      </button>
    ))}
  </div>
);

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filterOptions, setFilterOptions] = useState({ categories: [], brands: [], colors: [], priceRange: { min: 0, max: 0 } });
  const [loading, setLoading] = useState(true);
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [toast, setToast] = useState('');

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
  const [photosOnly, setPhotosOnly] = useState(() => searchParams.get('photos') === '1');
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [view, setViewState] = useState(() => (readStored(VIEW_KEY, 'grid') === 'table' ? 'table' : 'grid'));

  const { savedIds, toggleSaved } = useSavedProducts();
  const proposal = useProposal();
  const topRef = useRef(null);
  const sentinelRef = useRef(null);

  // ---- Admin-only costing view (supplier cost / profit) ----
  const [adminToken] = useState(getAdminToken);
  const [costs, setCosts] = useState({});
  const [costMode, setCostModeState] = useState(() => readStored(MODE_KEY, 'pricing') !== 'customer');
  const showCosts = !!adminToken && costMode;

  const setView = (v) => { setViewState(v); writeStored(VIEW_KEY, v); };
  const setCostMode = (m) => { const on = m === 'pricing'; setCostModeState(on); writeStored(MODE_KEY, on ? 'pricing' : 'customer'); };

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

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 2400);
    return () => clearTimeout(t);
  }, [toast]);

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
      if (photosOnly) params.set('hasPhoto', '1');
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
  }, [debouncedSearch, category, brand, debouncedMinPrice, debouncedMaxPrice, photosOnly, sort]);

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
  }, [debouncedSearch, category, brand, debouncedMinPrice, debouncedMaxPrice, photosOnly, sort]);

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
    if (photosOnly) next.set('photos', '1');
    if (sort !== 'newest') next.set('sort', sort);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, category, brand, debouncedMinPrice, debouncedMaxPrice, photosOnly, sort]);

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

  // Pull supplier costs (admin only) for whatever products are on screen and don't have one yet.
  useEffect(() => {
    if (!adminToken) return;
    const need = products.filter((p) => !(p._id in costs)).slice(0, 200).map((p) => p._id);
    if (need.length === 0) return;
    fetch(`${API_ENDPOINTS.products}/costs?ids=${need.join(',')}`, { headers: { Authorization: `Bearer ${adminToken}` } })
      .then((res) => (res.ok ? res.json() : { costs: {} }))
      .then((data) => {
        setCosts((prev) => {
          const next = { ...prev };
          need.forEach((id) => { next[id] = data.costs?.[id] || { cost: null }; });
          return next;
        });
      })
      .catch(() => setCosts((prev) => {
        const next = { ...prev };
        need.forEach((id) => { next[id] = { cost: null }; });
        return next;
      }));
  }, [products, costs, adminToken]);

  const activeFilterCount = (category ? 1 : 0) + (brand ? 1 : 0) + (minPrice || maxPrice ? 1 : 0) + (photosOnly ? 1 : 0);
  const clearFilters = () => { setCategory(''); setBrand(''); setMinPrice(''); setMaxPrice(''); setPhotosOnly(false); };

  const addAllShown = () => {
    const priced = products.filter((p) => typeof p.priceFrom === 'number');
    if (priced.length === 0) { setToast('No priced products to add'); return; }
    if (priced.length > ADD_ALL_LIMIT) { setToast(`That's ${priced.length} products. Narrow the budget or category first (${ADD_ALL_LIMIT} max at once).`); return; }
    proposal.addMany(priced);
    setToast(`Added ${priced.length} product${priced.length === 1 ? '' : 's'} to the proposal`);
  };

  const proposalSummary = useMemo(() => {
    const prices = proposal.list.filter((i) => i.price != null).map((i) => i.price);
    if (prices.length === 0) return '';
    const lo = Math.min(...prices);
    const hi = Math.max(...prices);
    return ` · ${inr(lo)}${hi !== lo ? ` – ${inr(hi)}` : ''}`;
  }, [proposal.list]);

  const sendProposalOnWhatsApp = () => {
    const text = buildProposalText(proposal.list, proposal.customer);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const budgetLabel = minPrice || maxPrice ? ` in ${inr(Number(minPrice) || 0)} – ${maxPrice ? inr(Number(maxPrice)) : 'any'}` : '';
  const hasTray = proposal.list.length > 0;

  return (
    <div className={`pt-20 min-h-screen bg-brand-light ${hasTray ? 'pb-24' : ''}`}>
      <SEO
        title="Shop Products | Adihuman"
        description="Browse our full product catalog with real photos, prices, sizes and colours."
        path="/shop"
      />

      {/* Search row (the site Navbar above is the only nav) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="search"
              placeholder="Search code or item, e.g. AH-K301, bamboo, bottle"
              aria-label="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-ink-200 bg-white py-3 pl-11 pr-4 text-sm text-brand-dark outline-none transition-all placeholder:text-ink-400 focus:border-brand-dark focus:ring-4 focus:ring-brand-yellow/30"
            />
          </div>
          {adminToken && (
            <Segmented
              label="View mode"
              value={costMode ? 'pricing' : 'customer'}
              onChange={setCostMode}
              options={[{ value: 'pricing', label: 'My pricing' }, { value: 'customer', label: 'Customer view' }]}
            />
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        {/* Customer budget per unit */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
          <label htmlFor="shop-min" className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-500">Customer budget per unit</label>
          <div className="flex items-center gap-1.5">
            <input id="shop-min" type="number" min="0" inputMode="numeric" placeholder="Min ₹" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-24 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-dark" />
            <span className="text-ink-400">–</span>
            <input type="number" min="0" inputMode="numeric" placeholder="Max ₹" aria-label="Maximum budget" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-24 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-dark" />
          </div>
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-1.5 overflow-x-auto no-scrollbar max-w-full">
            {BUDGET_PRESETS.map((p) => {
              const active = minPrice === p.min && maxPrice === p.max;
              return (
                <button
                  key={p.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => { setMinPrice(p.min); setMaxPrice(p.max); }}
                  className={`chip shrink-0 !px-3 !py-1.5 !text-xs ${active ? 'chip-active' : ''}`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories */}
        {filterOptions.categories.length > 0 && (
          <div className="mt-4 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button type="button" aria-pressed={!category} onClick={() => setCategory('')} className={`chip shrink-0 ${!category ? 'chip-active' : ''}`}>
              All
            </button>
            {filterOptions.categories.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={category === c.id}
                onClick={() => setCategory(category === c.id ? '' : c.id)}
                className={`chip shrink-0 ${category === c.id ? 'chip-active' : ''}`}
              >
                {c.name} <span className="ml-1 opacity-60 text-[11px]">{c.count}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section ref={topRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-10 scroll-mt-28">
        {/* Count + controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 min-w-0">
            <p className="font-display text-lg font-semibold text-brand-dark">
              {pagination.total.toLocaleString('en-IN')} product{pagination.total === 1 ? '' : 's'}
              {budgetLabel && <em className="not-italic font-sans text-sm font-normal text-ink-400">{budgetLabel}</em>}
            </p>
            <button type="button" onClick={addAllShown} className="text-sm font-semibold text-brand-dark underline-offset-4 hover:underline">
              Add all shown to proposal
            </button>
            {activeFilterCount > 0 && (
              <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-brand-dark">
                <RotateCcw className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {savedIds.size > 0 && (
              <button
                onClick={() => setSavedModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold bg-rose-50 text-rose-600 ring-1 ring-rose-100 hover:bg-rose-100 transition-colors"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-500" />
                Saved <span className="rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{savedIds.size}</span>
              </button>
            )}
            <label className="inline-flex items-center gap-1.5 text-sm text-ink-500 cursor-pointer">
              <input type="checkbox" checked={photosOnly} onChange={(e) => setPhotosOnly(e.target.checked)} className="h-4 w-4 accent-brand-dark" />
              Only with photos
            </label>
            {filterOptions.brands.length > 0 && (
              <div className="relative">
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  aria-label="Brand"
                  className="pl-3.5 pr-8 py-2 rounded-full border border-ink-200 bg-white text-sm font-semibold text-ink-700 hover:border-brand-dark outline-none appearance-none cursor-pointer transition-colors"
                >
                  <option value="">All brands</option>
                  {filterOptions.brands.map((b) => <option key={b.name} value={b.name}>{b.name} ({b.count})</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400 pointer-events-none" />
              </div>
            )}
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400 pointer-events-none" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort"
                className="pl-8 pr-8 py-2 rounded-full border border-ink-200 bg-white text-sm font-semibold text-ink-700 hover:border-brand-dark focus:ring-4 focus:ring-brand-yellow/30 focus:border-brand-dark outline-none appearance-none cursor-pointer transition-colors"
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400 pointer-events-none" />
            </div>
            <Segmented
              label="Layout"
              value={view}
              onChange={setView}
              options={[
                { value: 'grid', label: 'Cards', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
                { value: 'table', label: 'Compare table', icon: <Table2 className="w-3.5 h-3.5" /> }
              ]}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="surface py-20 px-6 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-100">
              <PackageSearch className="w-8 h-8 text-ink-400" />
            </div>
            <p className="text-2xl font-display font-bold text-brand-dark">No products found</p>
            <p className="text-ink-500 mt-2 mb-7">Nothing matches. Try widening the budget or clearing the search.</p>
            {(activeFilterCount > 0 || search) && (
              <button onClick={() => { clearFilters(); setSearch(''); }} className="btn-secondary">
                <RotateCcw className="w-4 h-4" /> Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {view === 'table' ? (
              <CompareTable products={products} proposal={proposal} costs={costs} showCosts={showCosts} sort={sort} setSort={setSort} />
            ) : (
              <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                <AnimatePresence>
                  {products.map((p) => (
                    <ProductCard
                      key={p._id}
                      product={p}
                      saved={savedIds.has(p._id)}
                      onToggleSave={toggleSaved}
                      selected={!!proposal.items[p._id]}
                      onToggleSelect={proposal.toggle}
                      cost={showCosts ? (costs[p._id]?.cost ?? null) : undefined}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Infinite scroll sentinel - the IntersectionObserver above fires the next
                page fetch once this enters the viewport, so the list just keeps growing. */}
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
      </section>

      {/* Price notice + calculator promo */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PriceNoticeBanner />
        </div>
        <div className="lg:col-span-2">
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
                <h2 className="text-lg font-display font-bold leading-tight">What do you want to order?</h2>
                <p className="text-white/55 text-xs sm:text-sm mt-1">
                  Pick a brand and quantity — see your bulk discount instantly and quote on WhatsApp.
                </p>
              </div>
            </div>
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-dark transition-transform duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* Proposal tray */}
      <AnimatePresence>
        {hasTray && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-40 bg-brand-dark text-white"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3">
              <p className="mr-auto min-w-0 text-sm">
                <b className="font-display text-base">{proposal.list.length} item{proposal.list.length === 1 ? '' : 's'}</b> in proposal{proposalSummary}
                {proposal.customer && <> · for {proposal.customer}</>}
              </p>
              <button onClick={sendProposalOnWhatsApp} className="inline-flex items-center gap-1.5 rounded-full border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition-colors">
                <MessageCircle className="w-4 h-4" /> Send on WhatsApp
              </button>
              <button onClick={() => setProposalOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-brand-yellow px-4 py-2 text-sm font-bold text-brand-dark hover:brightness-95 transition">
                <ClipboardList className="w-4 h-4" /> Review proposal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {proposalOpen && <ProposalDrawer proposal={proposal} onClose={() => setProposalOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed left-1/2 z-[70] max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-xl bg-brand-dark px-4 py-2.5 text-sm text-white shadow-lift ${hasTray ? 'bottom-24' : 'bottom-6'}`}
            role="status"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved products modal */}
      <AnimatePresence>
        {savedModalOpen && (
          <SavedProductsModal
            savedIds={savedIds}
            toggleSaved={toggleSaved}
            proposal={proposal}
            onClose={() => setSavedModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const SavedProductsModal = ({ savedIds, toggleSaved, proposal, onClose }) => {
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
                <ProductCard
                  key={p._id}
                  product={p}
                  saved={savedIds.has(p._id)}
                  onToggleSave={toggleSaved}
                  selected={!!proposal.items[p._id]}
                  onToggleSelect={proposal.toggle}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Shop;
