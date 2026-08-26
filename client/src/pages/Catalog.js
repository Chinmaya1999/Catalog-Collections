import React, { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ArrowRight,
  FileText,
  Phone,
  SearchX,
  X,
  LayoutGrid,
  LayoutList,
  Heart,
  ArrowUpDown,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import PDFViewer from '../components/PDFViewer';
import OrderCalculator from '../components/OrderCalculator';
import CatalogCard from '../components/CatalogCard';
import FeaturedCatalogsStrip from '../components/FeaturedCatalogsStrip';
import { CatalogSkeletonCard, CatalogBadges, CatalogPrice } from '../components/catalogDisplay';
import { useSavedCatalogs } from '../hooks/useSavedCatalogs';
import { API_ENDPOINTS, getImageUrl } from '../config/api';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest first' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
];

const Catalog = memo(() => {
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [catalogs, setCatalogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sortOption, setSortOption] = useState('featured');
  const [viewMode, setViewMode] = useState('grid');
  const { savedIds, toggleSaved } = useSavedCatalogs();
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  useEffect(() => {
    fetchDynamicData();
  }, []);

  const fetchDynamicData = async () => {
    try {
      // Fetch catalogs
      const catalogsRes = await fetch(API_ENDPOINTS.catalog);
      if (catalogsRes.ok) {
        const catalogsData = await catalogsRes.json();
        setCatalogs(catalogsData);
      }

      // Fetch categories
      const categoriesRes = await fetch(API_ENDPOINTS.category);
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error fetching dynamic data:', error);
    } finally {
      setLoading(false);
    }
  };

  // How many catalogs live in each category, for the filter chips
  const categoryCounts = useMemo(() => {
    return catalogs.reduce((acc, catalog) => {
      const names = catalog.categoryNames && catalog.categoryNames.length > 0 ? catalog.categoryNames : [catalog.categoryName];
      names.forEach((name) => {
        acc[name] = (acc[name] || 0) + 1;
      });
      return acc;
    }, {});
  }, [catalogs]);

  // Search + category + saved filters
  const baseFilteredCatalogs = useMemo(() => {
    return catalogs.filter((catalog) => {
      const matchesSearch =
        !searchQuery ||
        catalog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        catalog.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || (catalog.categoryNames || [catalog.categoryName]).includes(selectedCategory);
      const matchesSaved = !showSavedOnly || savedIds.has(catalog._id);
      return matchesSearch && matchesCategory && matchesSaved;
    });
  }, [catalogs, searchQuery, selectedCategory, showSavedOnly, savedIds]);

  // Sort on top of the filtered set
  const filteredCatalogs = useMemo(() => {
    const list = [...baseFilteredCatalogs];
    switch (sortOption) {
      case 'newest':
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'name-asc':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        list.sort((a, b) => (a.priceRange?.minPrice || 0) - (b.priceRange?.minPrice || 0));
        break;
      case 'price-high':
        list.sort((a, b) => (b.priceRange?.minPrice || 0) - (a.priceRange?.minPrice || 0));
        break;
      default:
        list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return list;
  }, [baseFilteredCatalogs, sortOption]);

  const hasActiveFilters = !!selectedCategory || !!searchQuery || showSavedOnly;

  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setShowSavedOnly(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4 }
    }
  };

  if (loading) {
    return (
      <div className="pt-20 min-h-screen bg-brand-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="h-8 bg-gray-200 rounded-full w-56 mx-auto mb-6 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded-2xl w-2/3 mx-auto mb-10 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <CatalogSkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-brand-light">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-light to-white">
        {/* Decorative blobs */}
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
                <LayoutGrid className="w-4 h-4 text-brand-gold" />
                {catalogs.length}+ Catalogs Available
              </span>
              <span className="inline-flex items-center gap-2 bg-white border border-brand-yellow/40 text-brand-dark px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                <Layers className="w-4 h-4 text-brand-gold" />
                {categories.length}+ Categories
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-gray-900 mb-4 leading-tight">
              Explore Our <span className="text-gradient">Product Catalog</span>
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
              Browse our complete collection of premium, customizable products — every catalog is downloadable and ready to share.
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by product name or description..."
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

            <div className="mt-6">
              <Link
                to="/catalog-request"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-brand-gold transition-colors"
              >
                <FileText className="w-4 h-4" />
                Can't find what you need? Request a custom catalog
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Catalogs strip */}
      {catalogs.some((c) => c.featured) && (
        <section className="bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <FeaturedCatalogsStrip catalogs={catalogs} onPreview={setSelectedCatalog} />
          </div>
        </section>
      )}

      {/* Bulk Pricing Calculator */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <OrderCalculator catalogs={catalogs} categories={categories} />
        </motion.div>
      </section>

      {/* Sticky category filter bar */}
      <div className="sticky top-20 z-20 bg-white/90 backdrop-blur-md border-y border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                !selectedCategory
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => setSelectedCategory(category.name)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedCategory === category.name
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{category.icon}</span>
                {category.name}
                {categoryCounts[category.name] > 0 && (
                  <span
                    className={`text-xs ${
                      selectedCategory === category.name ? 'text-white/70' : 'text-gray-400'
                    }`}
                  >
                    {categoryCounts[category.name]}
                  </span>
                )}
              </button>
            ))}
            {savedIds.size > 0 && (
              <button
                onClick={() => setShowSavedOnly((prev) => !prev)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  showSavedOnly
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${showSavedOnly ? 'fill-white' : 'fill-rose-500'}`} />
                Saved ({savedIds.size})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Results bar */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredCatalogs.length}</span>{' '}
            {filteredCatalogs.length === 1 ? 'catalog' : 'catalogs'}
            {selectedCategory && (
              <>
                {' '}in <span className="font-semibold text-gray-900">{selectedCategory}</span>
              </>
            )}
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Sort */}
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="pl-8 pr-8 py-2 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    Sort: {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition-all ${
                  viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
                aria-label="Grid view"
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-full transition-all ${
                  viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
                aria-label="List view"
                title="List view"
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Catalogs Grid / List */}
        <AnimatePresence mode="wait">
          {filteredCatalogs.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl border border-dashed border-gray-200 py-20 text-center"
            >
              <SearchX className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-700">No catalogs found</p>
              <p className="text-gray-400 mt-1 mb-6">Try a different search term or category.</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-black transition-all"
                >
                  Clear filters
                </button>
              )}
            </motion.div>
          ) : viewMode === 'grid' ? (
            <motion.div
              key="grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredCatalogs.map((catalog) => (
                <CatalogCard
                  key={catalog._id}
                  catalog={catalog}
                  onPreview={setSelectedCatalog}
                  isSaved={savedIds.has(catalog._id)}
                  onToggleSave={toggleSaved}
                  variants={itemVariants}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-4"
            >
              {filteredCatalogs.map((catalog) => (
                <motion.div key={catalog._id} variants={itemVariants}>
                  <div className="group bg-white rounded-2xl shadow-sm hover:shadow-lg overflow-hidden border border-gray-100 transition-shadow duration-300 flex flex-col sm:flex-row">
                    {/* Image */}
                    <div className="relative w-full sm:w-48 h-40 sm:h-auto shrink-0 bg-gradient-to-br from-brand-yellow/20 to-brand-gold/20 overflow-hidden">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedCatalog(catalog)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedCatalog(catalog)}
                        className="absolute inset-0 z-10 cursor-pointer"
                        aria-label={`Preview ${catalog.name}`}
                      />
                      <img
                        src={getImageUrl(catalog.image)}
                        alt={catalog.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {catalog.new && (
                        <span className="absolute top-2 right-2 z-20 bg-brand-yellow text-brand-dark px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                          NEW
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          {(catalog.categoryNames && catalog.categoryNames.length > 0 ? catalog.categoryNames : [catalog.categoryName]).filter(Boolean).map((catName, idx) => (
                            <span key={idx} className="bg-gray-100 text-xs font-semibold text-gray-700 px-2.5 py-1 rounded-full">
                              {catName}
                            </span>
                          ))}
                          <CatalogBadges catalog={catalog} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{catalog.name}</h3>
                        <p className="text-gray-500 text-sm mb-2 line-clamp-2">{catalog.description}</p>
                        <CatalogPrice catalog={catalog} />
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col items-stretch gap-2 sm:w-40 shrink-0">
                        <button
                          onClick={() => setSelectedCatalog(catalog)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-brand-yellow to-brand-gold text-brand-dark px-3 py-2.5 rounded-xl font-bold text-sm hover:shadow-md transition-all"
                        >
                          View Catalog
                        </button>
                        <div className="flex gap-2">
                          <Link
                            to="/contact"
                            className="flex-1 flex items-center justify-center gap-1 bg-gray-900 text-white px-3 py-2.5 rounded-xl hover:bg-black transition-all text-sm"
                            title="Contact us"
                          >
                            <Phone className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => toggleSaved(catalog._id)}
                            className="shrink-0 w-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            aria-label={savedIds.has(catalog._id) ? 'Remove from saved' : 'Save catalog'}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                savedIds.has(catalog._id) ? 'fill-rose-500 text-rose-500' : 'text-gray-500'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PDF Viewer Modal */}
      {selectedCatalog && (
        <PDFViewer
          driveUrl={selectedCatalog.driveLink}
          catalog={selectedCatalog}
          onClose={() => setSelectedCatalog(null)}
        />
      )}
    </div>
  );
});

export default Catalog;
