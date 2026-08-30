import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, X, PackageSearch, Layers, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { API_ENDPOINTS, getPdfUrl } from '../config/api';
import PhotoLightbox from '../components/PhotoLightbox';
import SEO from '../components/SEO';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const CATALOGS_PER_PAGE = 6;
const PRODUCTS_PER_CATALOG = 12;
const THUMB_WIDTH = 150; // fixed px so the PDF page render always fits its card, at any screen size

const formatPrice = (product, catalog) => {
  const currency = catalog.priceRange?.currency || '₹';
  if (product.price > 0) return `${currency}${product.price}`;
  const { minPrice, maxPrice } = catalog.priceRange || {};
  if (minPrice > 0) {
    return maxPrice && maxPrice !== minPrice ? `${currency}${minPrice} - ${currency}${maxPrice}` : `${currency}${minPrice}`;
  }
  return 'Price on request';
};

const ProductCard = ({ product, catalog, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-40 bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow text-left cursor-pointer"
  >
    <div className="bg-gray-50 aspect-[3/4] flex items-center justify-center overflow-hidden">
      {catalog.pdfFile ? (
        <Page
          pageNumber={product.page}
          width={THUMB_WIDTH}
          renderAnnotationLayer={false}
          renderTextLayer={false}
          loading={<div className="w-full h-full animate-pulse bg-gray-100" />}
          error={<PackageSearch className="w-6 h-6 text-gray-300" />}
        />
      ) : (
        <PackageSearch className="w-6 h-6 text-gray-300" />
      )}
    </div>
    <div className="p-2.5">
      <p className="font-semibold text-gray-900 text-xs line-clamp-1">{product.name || product.code}</p>
      <p className="text-[11px] text-gray-400 mb-1">{product.code}</p>
      <p className="text-brand-dark font-bold text-xs">{formatPrice(product, catalog)}</p>
    </div>
  </button>
);

const CatalogProductSection = ({ catalog, showAllProducts, expanded, onExpand, onProductClick }) => {
  const products = catalog.products;
  const visibleProducts = expanded || showAllProducts ? products : products.slice(0, PRODUCTS_PER_CATALOG);
  const hasMore = !showAllProducts && !expanded && products.length > PRODUCTS_PER_CATALOG;

  const grid = (
    <div className="flex flex-wrap gap-4">
      {visibleProducts.map((product) => (
        <ProductCard
          key={product.code}
          product={product}
          catalog={catalog}
          onClick={() => onProductClick(product, catalog)}
        />
      ))}
    </div>
  );

  return (
    <div className="mb-12">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">{catalog.name}</h2>
        <span className="text-sm text-gray-400">
          {products.length} product{products.length === 1 ? '' : 's'}
        </span>
      </div>

      {catalog.pdfFile ? (
        <Document
          file={getPdfUrl(catalog.pdfFile)}
          loading={<div className="text-sm text-gray-400 py-8">Loading photos…</div>}
          error={<div className="text-sm text-gray-400 py-8">Couldn't load photos for this catalog</div>}
        >
          {grid}
        </Document>
      ) : (
        grid
      )}

      {hasMore && (
        <button
          type="button"
          onClick={onExpand}
          className="mt-4 text-sm font-semibold text-brand-dark hover:text-brand-gold inline-flex items-center gap-1"
        >
          Show all {products.length} products
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

const Products = () => {
  const [catalogs, setCatalogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCatalogCount, setVisibleCatalogCount] = useState(CATALOGS_PER_PAGE);
  const [expandedCatalogIds, setExpandedCatalogIds] = useState(() => new Set());
  const [lightbox, setLightbox] = useState(null);

  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catalogsRes, categoriesRes] = await Promise.all([
          fetch(API_ENDPOINTS.catalog),
          fetch(API_ENDPOINTS.category),
        ]);
        if (catalogsRes.ok) setCatalogs(await catalogsRes.json());
        if (categoriesRes.ok) setCategories(await categoriesRes.json());
      } catch (error) {
        console.error('Error fetching products data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const catalogsWithProducts = useMemo(
    () => catalogs.filter((c) => c.products && c.products.length > 0),
    [catalogs]
  );

  const searchActive = searchQuery.trim().length > 0;
  const priceFilterActive = minPrice !== '' || maxPrice !== '';
  const anyFilterActive = searchActive || !!selectedCategory || priceFilterActive;

  // Category + catalog-level price range narrow down which catalogs show at all.
  const categoryAndPriceFilteredCatalogs = useMemo(() => {
    return catalogsWithProducts.filter((catalog) => {
      const matchesCategory =
        !selectedCategory || (catalog.categoryNames || [catalog.categoryName]).includes(selectedCategory);
      const catalogMin = catalog.priceRange?.minPrice || 0;
      const catalogMax = catalog.priceRange?.maxPrice || 0;
      const matchesMin = minPrice === '' || catalogMax === 0 || catalogMax >= Number(minPrice);
      const matchesMax = maxPrice === '' || catalogMin === 0 || catalogMin <= Number(maxPrice);
      return matchesCategory && matchesMin && matchesMax;
    });
  }, [catalogsWithProducts, selectedCategory, minPrice, maxPrice]);

  // Within each surviving catalog, narrow down to the individual products
  // that actually match — search, and price when the product itself has one
  // set (most products don't, so those are kept rather than hidden).
  const filteredCatalogs = useMemo(() => {
    const q = searchActive ? searchQuery.trim().toLowerCase() : '';
    const min = minPrice !== '' ? Number(minPrice) : null;
    const max = maxPrice !== '' ? Number(maxPrice) : null;

    return categoryAndPriceFilteredCatalogs
      .map((catalog) => {
        let products = catalog.products;

        if (priceFilterActive) {
          products = products.filter((p) => {
            if (!(p.price > 0)) return true;
            if (min !== null && p.price < min) return false;
            if (max !== null && p.price > max) return false;
            return true;
          });
        }

        if (q) {
          products = catalog.name.toLowerCase().includes(q)
            ? products
            : products.filter(
                (p) => (p.name || '').toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q)
              );
        }

        return { ...catalog, products };
      })
      .filter((catalog) => catalog.products.length > 0);
  }, [categoryAndPriceFilteredCatalogs, searchActive, searchQuery, priceFilterActive, minPrice, maxPrice]);

  const displayedCatalogs = anyFilterActive ? filteredCatalogs : filteredCatalogs.slice(0, visibleCatalogCount);
  const hasMoreCatalogs = !anyFilterActive && filteredCatalogs.length > visibleCatalogCount;

  const totalProductCount = useMemo(
    () => catalogsWithProducts.reduce((sum, c) => sum + c.products.length, 0),
    [catalogsWithProducts]
  );

  const activeFilterCount = (selectedCategory ? 1 : 0) + (priceFilterActive ? 1 : 0);

  const clearFilters = () => {
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
  };

  const toggleExpand = (catalogId) => {
    setExpandedCatalogIds((prev) => new Set(prev).add(catalogId));
  };

  if (loading) {
    return (
      <div className="pt-20 min-h-screen bg-brand-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="h-8 bg-gray-200 rounded-full w-56 mx-auto mb-6 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded-2xl w-2/3 mx-auto mb-10 animate-pulse" />
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-40 bg-gray-100 rounded-xl aspect-[3/4] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-brand-light">
      <SEO
        title="All Products | Corporate Gift Items with Photos & Pricing – Adihuman"
        description="Explore every product across our corporate gifting catalogs — real photos, names and prices for combo sets, drinkware, accessories, stationery, electronics and eco-friendly gifts."
        path="/products"
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-light to-white">
        <div className="pointer-events-none absolute -top-32 -right-24 w-96 h-96 bg-brand-yellow/25 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 bg-brand-gold/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-5">
              <span className="inline-flex items-center gap-2 bg-white border border-brand-yellow/40 text-brand-dark px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                <Layers className="w-4 h-4 text-brand-gold" />
                {totalProductCount}+ Products
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-gray-900 mb-4 leading-tight">
              Browse Every <span className="text-gradient">Product</span>
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
              Every product photo, name and price — pulled straight from our catalog PDFs.
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by product name, code or catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filters toggle */}
            <div className="max-w-xl mx-auto mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-brand-yellow border-brand-yellow text-brand-dark'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-brand-yellow'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-brand-dark text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-800 underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            {showFilters && (
              <div className="max-w-xl mx-auto mt-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-left grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all"
                  >
                    <option value="">All categories</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.name}>
                        {category.icon ? `${category.icon} ` : ''}{category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Price range</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all"
                    />
                    <span className="text-gray-400">–</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Product sections, grouped by catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {displayedCatalogs.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <PackageSearch className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>No products match your {anyFilterActive ? 'filters' : 'search'}.</p>
          </div>
        ) : (
          displayedCatalogs.map((catalog) => (
            <CatalogProductSection
              key={catalog._id}
              catalog={catalog}
              showAllProducts={anyFilterActive}
              expanded={expandedCatalogIds.has(catalog._id)}
              onExpand={() => toggleExpand(catalog._id)}
              onProductClick={(product, clickedCatalog) => setLightbox({ product, catalog: clickedCatalog })}
            />
          ))
        )}

        {hasMoreCatalogs && (
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setVisibleCatalogCount((prev) => prev + CATALOGS_PER_PAGE)}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-brand-yellow text-gray-700 font-semibold px-6 py-3 rounded-xl shadow-sm transition-colors"
            >
              Load More Catalogs
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>

      {lightbox && (
        <PhotoLightbox
          pdfFile={lightbox.catalog.pdfFile}
          pageNumber={lightbox.product.page}
          title={lightbox.product.name || lightbox.product.code}
          subtitle={lightbox.product.code}
          priceLabel={formatPrice(lightbox.product, lightbox.catalog)}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
};

export default Products;
