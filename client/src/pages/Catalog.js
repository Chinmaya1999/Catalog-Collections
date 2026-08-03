import React, { useState, memo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ExternalLink } from 'lucide-react';
import PDFViewer from '../components/PDFViewer';

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
      const catalogsRes = await fetch('http://localhost:5002/api/catalog');
      if (catalogsRes.ok) {
        const catalogsData = await catalogsRes.json();
        setCatalogs(catalogsData);
      }

      // Fetch categories
      const categoriesRes = await fetch('http://localhost:5002/api/category');
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
                placeholder="Search catalogs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-12"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
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
                    key={category._id}
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

          {/* Content Grid */}
          <div className="flex-grow">
            {/* Results Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing <span className="font-semibold text-brand-dark">
                  {filteredCatalogs.length}
                </span> catalogs
              </p>
            </div>

            {/* Catalogs Grid */}
            {filteredCatalogs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <p className="text-xl text-gray-600">No catalogs found</p>
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredCatalogs.map((catalog) => (
                  <motion.div
                    key={catalog._id}
                    variants={itemVariants}
                    whileHover={{ y: -10 }}
                  >
                    <div onClick={() => setSelectedCatalog(catalog)} className="cursor-pointer">
                      <div className="card group">
                        <div className="relative h-48 bg-gradient-to-br from-brand-yellow/20 to-brand-gold/20 flex items-center justify-center overflow-hidden">
                          {catalog.new && (
                            <span className="absolute top-3 left-3 bg-brand-yellow text-brand-dark px-2 py-1 rounded-full text-xs font-semibold z-10">
                              NEW
                            </span>
                          )}
                          <img 
                            src={catalog.image?.startsWith('/uploads') ? `http://localhost:5002${catalog.image}` : catalog.image} 
                            alt={catalog.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
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
