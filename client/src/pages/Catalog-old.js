import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Grid, List, Search, SlidersHorizontal, Star, Leaf, Sparkles } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const Catalog = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [sortBy, setSortBy] = useState('default');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const catalogSlug = searchParams.get('catalog');
    const featured = searchParams.get('featured');
    const ecoFriendly = searchParams.get('ecoFriendly');

    const fetchData = async () => {
      try {
        const [productsRes, catalogsRes, categoriesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/products`, {
            params: {
              catalog: catalogSlug,
              featured,
              ecoFriendly
            }
          }),
          axios.get(`${API_BASE_URL}/api/catalogs`),
          axios.get(`${API_BASE_URL}/api/categories`)
        ]);

        setProducts(productsRes.data);
        setCatalogs(catalogsRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category._id === selectedCategory;
    const matchesCatalog = !selectedCatalog || product.catalog._id === selectedCatalog;
    return matchesSearch && matchesCategory && matchesCatalog;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'new':
        return (b.new === a.new) ? 0 : b.new ? 1 : -1;
      default:
        return 0;
    }
  });

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
              Discover our complete collection of premium personalized products
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
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-brand-dark">Filters</h3>
                <SlidersHorizontal className="w-5 h-5 text-gray-400" />
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="font-semibold text-sm text-gray-600 mb-3">Categories</h4>
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
                      onClick={() => setSelectedCategory(category._id)}
                      className={`block w-full text-left px-3 py-2 rounded-lg transition-all ${
                        selectedCategory === category._id ? 'bg-brand-yellow/20 text-brand-dark font-semibold' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-2">{category.icon}</span>
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-3">Sort By</h4>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-brand-yellow outline-none"
                >
                  <option value="default">Default</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="new">Newest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-grow">
            {/* View Toggle & Results Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing <span className="font-semibold text-brand-dark">{sortedProducts.length}</span> products
              </p>
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
            </div>

            {/* Products */}
            {sortedProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-brand-dark mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your filters or search query</p>
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
                {sortedProducts.map((product) => (
                  <motion.div
                    key={product._id}
                    variants={itemVariants}
                    whileHover={{ y: viewMode === 'grid' ? -10 : 0 }}
                  >
                    <Link to={`/product/${product._id}`}>
                      <div className={`card group cursor-pointer ${viewMode === 'list' ? 'flex' : ''}`}>
                        <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'h-56'} bg-gray-100 flex items-center justify-center overflow-hidden`}>
                          {product.new && (
                            <span className="absolute top-3 left-3 bg-brand-yellow text-brand-dark px-2 py-1 rounded-full text-xs font-semibold">
                              NEW
                            </span>
                          )}
                          {product.ecoFriendly && (
                            <span className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                              <Leaf className="w-3 h-3 inline" />
                            </span>
                          )}
                          <Sparkles className="w-16 h-16 text-brand-yellow/50 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className={`p-4 ${viewMode === 'list' ? 'flex-grow' : ''}`}>
                          <h3 className="font-semibold text-brand-dark mb-2 line-clamp-2">{product.name}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                          <div className="flex items-center mb-3">
                            <Star className="w-4 h-4 text-brand-yellow fill-current" />
                            <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                            <span className="text-sm text-gray-400 ml-1">({product.reviews})</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-lg font-bold text-brand-dark">₹{product.price}</span>
                              {product.originalPrice && (
                                <span className="text-sm text-gray-400 line-through ml-2">₹{product.originalPrice}</span>
                              )}
                            </div>
                            {product.discount > 0 && (
                              <span className="text-sm text-green-600 font-semibold">-{product.discount}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Catalog;
