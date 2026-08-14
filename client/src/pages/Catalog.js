import React, { useState, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, FileText, Phone, Tag, SearchX, X, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';
import PDFViewer from '../components/PDFViewer';
import { API_ENDPOINTS, getImageUrl } from '../config/api';

const Catalog = memo(() => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [catalogs, setCatalogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Memoize filtered data for performance
  const filteredCatalogs = React.useMemo(() => {
    return catalogs.filter(catalog => {
      const matchesSearch = catalog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           catalog.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || catalog.categoryName === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, catalogs]);

  const hasActiveFilters = !!selectedCategory || !!searchQuery;

  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
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
      <div className="pt-20 min-h-screen bg-brand-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading catalog...</p>
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
            <div className="inline-flex items-center gap-2 bg-white border border-brand-yellow/40 text-brand-dark px-4 py-1.5 rounded-full text-sm font-semibold mb-5 shadow-sm">
              <LayoutGrid className="w-4 h-4 text-brand-gold" />
              {catalogs.length}+ Catalogs Available
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
              </button>
            ))}
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

        {/* Catalogs Grid */}
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
          ) : (
            <motion.div
              key="grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredCatalogs.map((catalog) => (
                <motion.div key={catalog._id} variants={itemVariants} whileHover={{ y: -6 }}>
                  <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl overflow-hidden border border-gray-100 transition-shadow duration-300 h-full flex flex-col">
                    {/* Image */}
                    <button
                      onClick={() => setSelectedCatalog(catalog)}
                      className="relative h-48 w-full bg-gradient-to-br from-brand-yellow/20 to-brand-gold/20 overflow-hidden text-left"
                    >
                      <div className="absolute top-3 left-3 z-10 flex gap-2">
                        {catalog.categoryName && (
                          <span className="bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-900 px-2.5 py-1 rounded-full shadow-sm">
                            {catalog.categoryName}
                          </span>
                        )}
                      </div>
                      {catalog.new && (
                        <span className="absolute top-3 right-3 z-10 bg-brand-yellow text-brand-dark px-2.5 py-1 rounded-full text-xs font-bold shadow-sm">
                          NEW
                        </span>
                      )}
                      <img
                        src={getImageUrl(catalog.image)}
                        alt={catalog.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <span className="text-white text-sm font-semibold inline-flex items-center gap-1">
                          Preview catalog
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </button>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1.5 line-clamp-1">{catalog.name}</h3>
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2 flex-1">{catalog.description}</p>

                      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                        {catalog.priceRange && (catalog.priceRange.minPrice > 0 || catalog.priceRange.maxPrice > 0) ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 rounded-full">
                            <Tag className="w-3 h-3 text-brand-gold" />
                            <p className="text-xs font-semibold text-gray-900">
                              {catalog.priceRange.currency}{catalog.priceRange.minPrice} - {catalog.priceRange.currency}{catalog.priceRange.maxPrice}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-gray-400">
                            {catalog.comboCount > 0 ? `${catalog.comboCount} items` : 'View catalog'}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => setSelectedCatalog(catalog)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-brand-yellow to-brand-gold text-brand-dark px-3 py-2.5 rounded-xl font-bold text-sm hover:shadow-md transition-all"
                        >
                          View Catalog
                        </button>
                        <Link
                          to="/contact"
                          className="flex items-center justify-center gap-1 bg-gray-900 text-white px-3 py-2.5 rounded-xl hover:bg-black transition-all text-sm"
                          title="Contact us"
                        >
                          <Phone className="w-4 h-4" />
                        </Link>
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
