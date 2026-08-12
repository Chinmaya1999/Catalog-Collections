import React, { useState, memo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Gift, Phone, Search } from 'lucide-react';
import PDFViewer from '../components/PDFViewer';
import { API_ENDPOINTS, getImageUrl } from '../config/api';

const Home = memo(() => {
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [catalogs, setCatalogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search and filter state
  const [featuredSearch, setFeaturedSearch] = useState('');
  const [featuredCategory, setFeaturedCategory] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('');

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

      // Fetch products (using catalogs with type 'product')
      const productsRes = await fetch(API_ENDPOINTS.catalog);
      if (productsRes.ok) {
        const allData = await productsRes.json();
        setProducts(allData.filter(item => item.type === 'product'));
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

  if (loading) {
    return (
      <div className="pt-20 min-h-screen bg-brand-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20">
      {/* Hero Section - Split Layout */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-gray-900 leading-tight mb-6">
                Stand Out With Premium Customized Products
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl">
                High-quality branded merchandise, customizable catalogs, and easy vendor connections — all in one place.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/catalog" className="btn-primary inline-flex items-center">
                  Explore Catalog
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link to="/catalog-request" className="btn-secondary inline-flex items-center">
                  <Gift className="mr-2 w-5 h-5" />
                  Request Products
                </Link>
                <Link to="/contact" className="btn-secondary inline-flex items-center">
                  Contact Sales
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-sm text-gray-500">Trusted by</div>
                <div className="text-sm text-gray-500">1000+ Businesses</div>
                <div className="text-sm text-gray-500">Fast Delivery</div>
                <div className="text-sm text-gray-500">Secure Payments</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5"
            >
              <div className="relative rounded-2xl shadow-2xl overflow-hidden">
                <div className="grid grid-cols-2 gap-2">
                  {catalogs.slice(0,4).map((c, idx) => (
                    <div key={c._id} className={`h-36 bg-gray-100 ${idx === 0 ? 'col-span-2 h-48' : ''}`} onClick={() => setSelectedCatalog(c)}>
                      <img src={getImageUrl(c.image)} alt={c.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md">
                  <Link to="/catalog" className="font-semibold text-gray-900">Browse all catalogs</Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why choose us?</h2>
            <p className="text-gray-600 mt-2">Designed for businesses that want quality, speed and reliability.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card p-6 text-center">
              <h4 className="font-semibold text-gray-900 mb-2">Custom Branding</h4>
              <p className="text-gray-500 text-sm">Personalize products with your logo and message.</p>
            </div>
            <div className="card p-6 text-center">
              <h4 className="font-semibold text-gray-900 mb-2">Bulk Pricing</h4>
              <p className="text-gray-500 text-sm">Competitive rates for large orders.</p>
            </div>
            <div className="card p-6 text-center">
              <h4 className="font-semibold text-gray-900 mb-2">Fast Turnaround</h4>
              <p className="text-gray-500 text-sm">Get catalogs and vendors quickly.</p>
            </div>
            <div className="card p-6 text-center">
              <h4 className="font-semibold text-gray-900 mb-2">Trusted Vendors</h4>
              <p className="text-gray-500 text-sm">Our vendors are vetted for quality.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Preview */}
      <section className="py-20 bg-brand-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Featured Catalogs</h3>
            <Link to="/catalog" className="text-sm text-gray-600 hover:underline">View all catalogs</Link>
          </div>

          {/* Search and Filter for Featured Catalogs */}
          <div className="mb-6 bg-white rounded-xl p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search catalogs by name or description..."
                    value={featuredSearch}
                    onChange={(e) => setFeaturedSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div className="md:w-64">
                <select
                  value={featuredCategory}
                  onChange={(e) => setFeaturedCategory(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogs
              .filter(catalog => catalog.featured)
              .filter(catalog => {
                const matchesSearch = !featuredSearch || 
                  catalog.name.toLowerCase().includes(featuredSearch.toLowerCase()) ||
                  catalog.description.toLowerCase().includes(featuredSearch.toLowerCase());
                const matchesCategory = !featuredCategory || catalog.category === featuredCategory;
                return matchesSearch && matchesCategory;
              })
              .slice(0, 6)
              .map(catalog => (
              <motion.div key={catalog._id} whileHover={{ y: -6 }}>
                <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                  <div className="h-44 bg-gray-100 overflow-hidden">
                    <img src={getImageUrl(catalog.image)} alt={catalog.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-1">{catalog.name}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2">{catalog.description}</p>
                    
                    {/* Price Range Display */}
                    {catalog.priceRange && (catalog.priceRange.minPrice > 0 || catalog.priceRange.maxPrice > 0) ? (
                      <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                        <p className="text-xs font-semibold text-gray-900">
                          {catalog.priceRange.currency}{catalog.priceRange.minPrice} - {catalog.priceRange.currency}{catalog.priceRange.maxPrice}
                        </p>
                      </div>
                    ) : catalog.priceRange && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                        <p className="text-xs font-semibold text-gray-900">
                          Price range available
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-4 flex items-center gap-2">
                      <button onClick={() => setSelectedCatalog(catalog)} className="px-3 py-2 bg-gray-100 rounded-lg text-sm">Preview</button>
                      <Link to="/catalog" className="px-3 py-2 bg-yellow-400 rounded-lg text-sm text-gray-900">Open</Link>
                      <Link to="/contact" className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Contact
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Product Catalogs Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Product Catalogs</h3>
            <Link to="/catalog" className="text-sm text-gray-600 hover:underline">View all catalogs</Link>
          </div>

          {/* Search and Filter for Product Catalogs */}
          <div className="mb-6 bg-gray-50 rounded-xl p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products by name or description..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div className="md:w-64">
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products
              .filter(catalog => {
                const matchesSearch = !productSearch || 
                  catalog.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                  catalog.description.toLowerCase().includes(productSearch.toLowerCase());
                const matchesCategory = !productCategory || catalog.category === productCategory;
                return matchesSearch && matchesCategory;
              })
              .slice(0, 6)
              .map(catalog => (
              <motion.div key={catalog._id} whileHover={{ y: -6 }}>
                <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                  <div className="h-44 bg-gray-100 overflow-hidden">
                    <img src={getImageUrl(catalog.image)} alt={catalog.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-1">{catalog.name}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2">{catalog.description}</p>
                    
                    {/* Price Range Display */}
                    {catalog.priceRange && (catalog.priceRange.minPrice > 0 || catalog.priceRange.maxPrice > 0) ? (
                      <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                        <p className="text-xs font-semibold text-gray-900">
                          {catalog.priceRange.currency}{catalog.priceRange.minPrice} - {catalog.priceRange.currency}{catalog.priceRange.maxPrice}
                        </p>
                      </div>
                    ) : catalog.priceRange && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                        <p className="text-xs font-semibold text-gray-900">
                          Price range available
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-4 flex items-center gap-2">
                      <button onClick={() => setSelectedCatalog(catalog)} className="px-3 py-2 bg-gray-100 rounded-lg text-sm">Preview</button>
                      <Link to="/catalog" className="px-3 py-2 bg-yellow-400 rounded-lg text-sm text-gray-900">Open</Link>
                      <Link to="/contact" className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Contact
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-yellow-400 to-yellow-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Ready to scale your brand?</h3>
          <p className="text-gray-800 mb-6">Contact our team for a quick quote and catalog samples.</p>
          <Link to="/contact" className="btn-primary">Get a Quote</Link>
        </div>
      </section>

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

export default Home;
