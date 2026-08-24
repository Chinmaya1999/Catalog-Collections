import React, { useState, memo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Gift,
  Phone,
  Search,
  Sparkles,
  Users,
  Truck,
  ShieldCheck,
  Award,
  Palette,
  Tag,
  Zap,
  Package,
  SearchX,
} from 'lucide-react';
import PDFViewer from '../components/PDFViewer';
import OrderCalculatorWidget from '../components/OrderCalculatorWidget';
import { API_ENDPOINTS, getImageUrl } from '../config/api';

const stats = [
  { icon: Users, value: '1000+', label: 'Businesses' },
  { icon: Truck, value: 'Fast', label: 'Delivery' },
  { icon: ShieldCheck, value: 'Secure', label: 'Payments' },
  { icon: Award, value: 'Premium', label: 'Quality' },
];

const features = [
  {
    icon: Palette,
    title: 'Custom Branding',
    description: 'Personalize products with your logo and message.',
  },
  {
    icon: Tag,
    title: 'Bulk Pricing',
    description: 'Competitive rates for large orders.',
  },
  {
    icon: Zap,
    title: 'Fast Turnaround',
    description: 'Get catalogs and vendors quickly.',
  },
  {
    icon: ShieldCheck,
    title: 'Trusted Vendors',
    description: 'Our vendors are vetted for quality.',
  },
];

const Home = memo(() => {
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [catalogs, setCatalogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

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

  const getCategoryName = (categoryId) =>
    categories.find((cat) => cat._id === categoryId)?.name;

  const filteredCatalogs = catalogs.filter((catalog) => {
    const matchesSearch =
      !searchTerm ||
      catalog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      catalog.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || catalog.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-light to-white">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 bg-brand-yellow/30 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 bg-brand-gold/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7"
            >
              <div className="inline-flex items-center gap-2 bg-white border border-brand-yellow/40 text-brand-dark px-4 py-1.5 rounded-full text-sm font-semibold mb-6 shadow-sm">
                <Sparkles className="w-4 h-4 text-brand-gold" />
                Trusted by 1000+ Businesses
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-gray-900 leading-tight mb-6">
                Stand Out With{' '}
                <span className="text-gradient">Premium Customized Products</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl">
                High-quality branded merchandise, customizable catalogs, and easy vendor connections — all in one place.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/catalog" className="btn-primary inline-flex items-center justify-center">
                  Explore Catalog
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link to="/catalog-request" className="btn-secondary inline-flex items-center justify-center">
                  <Gift className="mr-2 w-5 h-5" />
                  Request Products
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center border-2 border-gray-200 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:border-brand-yellow hover:bg-brand-yellow/10 transition-all duration-300"
                >
                  Contact Sales
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.map(({ icon: Icon, value, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100"
                  >
                    <div className="w-9 h-9 shrink-0 rounded-lg bg-brand-yellow/15 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-brand-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-none">{value}</p>
                      <p className="text-xs text-gray-500 mt-1">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5"
            >
              <div className="relative">
                <div className="pointer-events-none absolute -inset-4 bg-gradient-to-br from-brand-yellow/30 to-brand-gold/20 rounded-3xl blur-2xl -z-10" />
                <div className="relative rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5 bg-white">
                  <div className="grid grid-cols-2 gap-2 p-2">
                    {catalogs.slice(0, 4).map((c, idx) => (
                      <div
                        key={c._id}
                        className={`group relative h-36 rounded-xl bg-gray-100 overflow-hidden cursor-pointer ${
                          idx === 0 ? 'col-span-2 h-48' : ''
                        }`}
                        onClick={() => setSelectedCatalog(c)}
                      >
                        <img
                          src={getImageUrl(c.image)}
                          alt={c.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    ))}
                  </div>
                </div>

                {catalogs.length > 0 && (
                  <div className="absolute -top-4 -right-4 bg-brand-dark text-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-sm font-semibold">
                    <Package className="w-4 h-4 text-brand-yellow" />
                    {catalogs.length}+ Products
                  </div>
                )}

                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-md">
                  <Link
                    to="/catalog"
                    className="font-semibold text-gray-900 inline-flex items-center gap-1 text-sm"
                  >
                    Browse all catalogs
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Catalog Preview */}
      <section className="py-20 bg-brand-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-gold uppercase tracking-wider mb-2">
                <span className="w-6 h-px bg-brand-gold" />
                Our Collection
              </div>
              <h3 className="text-2xl md:text-3xl font-display font-bold text-gray-900">Our Catalogs</h3>
            </div>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 hover:text-brand-gold transition-colors"
            >
              View all catalogs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Search and Filter */}
          <div className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search catalogs by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div className="md:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {filteredCatalogs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
              <SearchX className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No catalogs found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter.</p>
            </div>
          ) : (
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCatalogs.slice(0, 6).map((catalog) => {
                const categoryName = getCategoryName(catalog.category);
                return (
                  <motion.div key={catalog._id} whileHover={{ y: -6 }}>
                    <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl overflow-hidden border border-gray-100 transition-shadow duration-300">
                      <div className="relative h-44 bg-gray-100 overflow-hidden">
                        <img
                          src={getImageUrl(catalog.image)}
                          alt={catalog.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {categoryName && (
                          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-900 px-2.5 py-1 rounded-full shadow-sm">
                            {categoryName}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-1">{catalog.name}</h4>
                        <p className="text-sm text-gray-500 line-clamp-2">{catalog.description}</p>

                        {/* Price Range Display */}
                        {catalog.priceRange &&
                        (catalog.priceRange.minPrice > 0 || catalog.priceRange.maxPrice > 0) ? (
                          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 rounded-full">
                            <Tag className="w-3 h-3 text-brand-gold" />
                            <p className="text-xs font-semibold text-gray-900">
                              {catalog.priceRange.currency}
                              {catalog.priceRange.minPrice} - {catalog.priceRange.currency}
                              {catalog.priceRange.maxPrice}
                            </p>
                          </div>
                        ) : (
                          catalog.priceRange && (
                            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 rounded-full">
                              <Tag className="w-3 h-3 text-brand-gold" />
                              <p className="text-xs font-semibold text-gray-900">Price range available</p>
                            </div>
                          )
                        )}

                        <div className="mt-4 flex items-center gap-2">
                          <button
                            onClick={() => setSelectedCatalog(catalog)}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                          >
                            Preview
                          </button>
                          <Link
                            to="/catalog"
                            className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 rounded-lg text-sm font-medium text-gray-900 transition-colors"
                          >
                            Open
                          </Link>
                          <Link
                            to="/contact"
                            className="px-3 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm flex items-center gap-1 transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            Contact
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-gold uppercase tracking-wider mb-2">
              <span className="w-6 h-px bg-brand-gold" />
              Why Adihuman
              <span className="w-6 h-px bg-brand-gold" />
            </div>
            <h2 className="text-3xl font-display font-bold text-gray-900">Why choose us?</h2>
            <p className="text-gray-600 mt-2">Designed for businesses that want quality, speed and reliability.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="card p-6 text-center hover:-translate-y-1 transform transition-transform duration-300"
              >
                <div className="w-14 h-14 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-brand-dark" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
                <p className="text-gray-500 text-sm">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-r from-brand-yellow to-brand-gold">
        <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 w-72 h-72 bg-white/10 rounded-full" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-display font-bold text-gray-900 mb-4">Ready to scale your brand?</h3>
          <p className="text-gray-800 mb-8">Contact our team for a quick quote and catalog samples.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/contact"
              className="bg-brand-dark text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg inline-flex items-center"
            >
              Get a Quote
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <a
              href="tel:+918296810381"
              className="bg-white/90 backdrop-blur-sm text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-white transition-all duration-300 transform hover:scale-105 shadow-lg inline-flex items-center"
            >
              <Phone className="mr-2 w-5 h-5" />
              Call Us Now
            </a>
          </div>
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

      {/* Floating "What do you want to order?" chat widget */}
      <OrderCalculatorWidget catalogs={catalogs} categories={categories} />
    </div>
  );
});

export default Home;
