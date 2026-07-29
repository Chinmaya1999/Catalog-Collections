import React, { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Grid, List, Search, ExternalLink } from 'lucide-react';
import { catalogs, products, categories } from '../data/catalogs';
import PDFViewer from '../components/PDFViewer';

const Catalog = memo(() => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('catalogs');
  const [selectedCatalog, setSelectedCatalog] = useState(null);

  // Memoize filtered data for performance
  const filteredProducts = React.useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const filteredCatalogs = React.useMemo(() => {
    return catalogs.filter(catalog => {
      const matchesSearch = catalog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           catalog.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [searchQuery]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-brand-light">
      {/* Header */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-display font-bold text-brand-dark mb-4">
              Product <span className="text-gradient">Catalog</span>
            </h1>
            <p className="text-gray-600 text-lg">
              Browse our complete collection with downloadable catalogs
            </p>
          </motion.div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search catalogs and products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-12"
              />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setActiveTab('catalogs')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'catalogs' ? 'bg-brand-yellow text-brand-dark' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Catalog Collections
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'products' ? 'bg-brand-yellow text-brand-dark' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Individual Products
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          {activeTab === 'products' && (
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-24">
                <h3 className="font-bold text-lg text-brand-dark mb-6">Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`block w-full text-left px-3 py-2 rounded-lg transition-all ${
                      !selectedCategory ? 'bg-brand-yellow/20 text-brand-dark font-semibold' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`block w-full text-left px-3 py-2 rounded-lg transition-all ${
                        selectedCategory === category.name ? 'bg-brand-yellow/20 text-brand-dark font-semibold' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-2">{category.icon}</span>
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Content Grid */}
          <div className="flex-grow">
            {/* View Toggle & Results Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing <span className="font-semibold text-brand-dark">
                  {activeTab === 'catalogs' ? filteredCatalogs.length : filteredProducts.length}
                </span> {activeTab === 'catalogs' ? 'catalogs' : 'products'}
              </p>
              {activeTab === 'products' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'grid' ? 'bg-brand-yellow text-brand-dark' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'list' ? 'bg-brand-yellow text-brand-dark' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Catalogs Grid */}
            {activeTab === 'catalogs' && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredCatalogs.map((catalog) => (
                  <motion.div
                    key={catalog.id}
                    variants={itemVariants}
                    whileHover={{ y: -10 }}
                  >
                    <div onClick={() => setSelectedCatalog(catalog)} className="cursor-pointer">
                      <div className="card group">
                        <div className="relative h-48 bg-gradient-to-br from-brand-yellow/20 to-brand-gold/20 flex items-center justify-center">
                          {catalog.new && (
                            <span className="absolute top-3 left-3 bg-brand-yellow text-brand-dark px-2 py-1 rounded-full text-xs font-semibold">
                              NEW
                            </span>
                          )}
                          <span className="text-6xl">{catalog.image}</span>
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-brand-dark mb-2">{catalog.name}</h3>
                          <p className="text-gray-600 text-sm mb-4">{catalog.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-brand-yellow font-semibold">
                              {catalog.comboCount > 0 ? `${catalog.comboCount} Items` : 'View Catalog'}
                            </span>
                            <ExternalLink className="w-5 h-5 text-brand-dark group-hover:translate-x-2 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Products Grid */}
            {activeTab === 'products' && (
              <>
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl">
                    <p className="text-xl text-gray-600">No products found</p>
                  </div>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                        : 'space-y-4'
                    }
                  >
                    {filteredProducts.map((product) => (
                      <motion.div
                        key={product.id}
                        variants={itemVariants}
                        whileHover={{ y: viewMode === 'grid' ? -10 : 0 }}
                      >
                        <div onClick={() => setSelectedCatalog(product)} className="cursor-pointer">
                          <div className={`card group ${viewMode === 'list' ? 'flex' : ''}`}>
                            <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'h-56'} bg-gray-100 flex items-center justify-center overflow-hidden`}>
                              {product.ecoFriendly && (
                                <span className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                  🌱 Eco
                                </span>
                              )}
                              <span className="text-6xl">{product.icon}</span>
                            </div>
                            <div className={`p-4 ${viewMode === 'list' ? 'flex-grow' : ''}`}>
                              <h3 className="font-semibold text-brand-dark mb-2 line-clamp-2">{product.name}</h3>
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">{product.category}</span>
                                <ExternalLink className="w-5 h-5 text-brand-yellow group-hover:translate-x-2 transition-transform" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
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
