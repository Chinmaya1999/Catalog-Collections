import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, PackageSearch, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_ENDPOINTS, getImageUrl } from '../config/api';
import SEO from '../components/SEO';
import OrderCalculator from '../components/OrderCalculator';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' }
];

const formatPrice = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : 'Price on request');

const ProductCard = ({ product }) => {
  const primary = product.images?.find((i) => i.isPrimary) || product.images?.[0];
  return (
    <Link
      to={`/shop/${product._id}`}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
    >
      <div className="aspect-square bg-gray-50 overflow-hidden flex items-center justify-center">
        {primary ? (
          <img
            src={getImageUrl(primary.path)}
            alt={product.name || 'Product'}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <PackageSearch className="w-10 h-10 text-gray-300" />
        )}
      </div>
      <div className="p-4">
        {product.brand && <p className="text-[11px] font-semibold text-brand-gold uppercase tracking-wide mb-0.5">{product.brand}</p>}
        <p className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1">{product.name || 'Unnamed product'}</p>
        {product.colors?.length > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            {product.colors.slice(0, 5).map((c, i) => (
              <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{c.name}</span>
            ))}
          </div>
        )}
        <p className="text-brand-dark font-bold text-base">{formatPrice(product.priceFrom)}</p>
      </div>
    </Link>
  );
};

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filterOptions, setFilterOptions] = useState({ categories: [], brands: [], colors: [], priceRange: { min: 0, max: 0 } });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // For the bulk order calculator, which works off catalog PDFs rather than the
  // individual shop products fetched below.
  const [orderCatalogs, setOrderCatalogs] = useState([]);
  const [orderCategories, setOrderCategories] = useState([]);

  useEffect(() => {
    const fetchOrderCalculatorData = async () => {
      try {
        const [catalogsRes, categoriesRes] = await Promise.all([
          fetch(API_ENDPOINTS.catalog),
          fetch(API_ENDPOINTS.category)
        ]);
        if (catalogsRes.ok) setOrderCatalogs(await catalogsRes.json());
        if (categoriesRes.ok) setOrderCategories(await categoriesRes.json());
      } catch (error) {
        console.error('Error fetching order calculator data:', error);
      }
    };
    fetchOrderCalculatorData();
  }, []);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

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
        </div>
      </section>

      {/* Bulk Pricing Calculator */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <OrderCalculator catalogs={orderCatalogs} categories={orderCategories} />
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category + price range are the primary way to narrow things down, so they stay
            visible up front rather than hidden behind a toggle. */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-brand-yellow outline-none">
                <option value="">All categories</option>
                {filterOptions.categories.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.count})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Price range {filterOptions.priceRange.max > 0 && `(₹${filterOptions.priceRange.min} – ₹${filterOptions.priceRange.max})`}
              </label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-brand-yellow outline-none" />
                <span className="text-gray-400">–</span>
                <input type="number" min="0" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-brand-yellow outline-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              showFilters || brand || color ? 'bg-brand-yellow border-brand-yellow text-brand-dark' : 'bg-white border-gray-200 text-gray-700 hover:border-brand-yellow'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            More filters
            {(brand ? 1 : 0) + (color ? 1 : 0) > 0 && (
              <span className="bg-brand-dark text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{(brand ? 1 : 0) + (color ? 1 : 0)}</span>
            )}
          </button>

          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-800 underline">Clear filters</button>
            )}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-brand-yellow outline-none"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Brand</label>
                  <select value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-brand-yellow outline-none">
                    <option value="">All brands</option>
                    {filterOptions.brands.map((b) => <option key={b.name} value={b.name}>{b.name} ({b.count})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Colour</label>
                  <select value={color} onChange={(e) => setColor(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-brand-yellow outline-none">
                    <option value="">All colours</option>
                    {filterOptions.colors.map((c) => <option key={c.name} value={c.name}>{c.name} ({c.count})</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl aspect-square animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            <PackageSearch className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No products match your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:border-brand-yellow disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 font-medium">Page {pagination.page} of {pagination.totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:border-brand-yellow disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Shop;
