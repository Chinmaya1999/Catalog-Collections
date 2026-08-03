import React, { useState, memo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Gift, ExternalLink } from 'lucide-react';
import PDFViewer from '../components/PDFViewer';

const Home = memo(() => {
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [catalogs, setCatalogs] = useState([]);
  const [products, setProducts] = useState([]);
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

      // Fetch products (using catalogs with type 'product')
      const productsRes = await fetch('http://localhost:5002/api/catalog');
      if (productsRes.ok) {
        const allData = await productsRes.json();
        setProducts(allData.filter(item => item.type === 'product'));
      }
    } catch (error) {
      console.error('Error fetching dynamic data:', error);
    } finally {
      setLoading(false);
    }
  };

  const featuredProducts = React.useMemo(() => products.filter(p => p.featured), [products]);

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
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-yellow via-brand-gold to-yellow-400 overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32"
        >
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-7xl font-display font-bold text-brand-dark mb-6"
            >
              Premium Personalized
              <br />
              <span className="text-white">Products</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-brand-dark/80 mb-8 max-w-2xl mx-auto"
            >
              Browse our complete product catalog with detailed information and downloadable catalogs
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/catalog" className="btn-primary">
                Explore Catalog
                <ArrowRight className="inline ml-2 w-5 h-5" />
              </Link>
              <Link to="/catalog" className="btn-secondary">
                <Gift className="inline ml-2 w-5 h-5" />
                View All Catalogs
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Featured Catalogs */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-display font-bold text-brand-dark mb-4">
              Our <span className="text-gradient">Catalog Collections</span>
            </h2>
            <p className="text-gray-600 text-lg">Click on any catalog to view the complete product details</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {catalogs.filter(c => c.featured).map((catalog) => (
              <motion.div
                key={catalog._id}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
              >
                <div onClick={() => setSelectedCatalog(catalog)} className="cursor-pointer">
                  <div className="card group">
                    <div className="relative h-64 bg-gradient-to-br from-brand-yellow/20 to-brand-gold/20 flex items-center justify-center overflow-hidden">
                      {catalog.new && (
                        <span className="absolute top-4 left-4 bg-brand-yellow text-brand-dark px-3 py-1 rounded-full text-sm font-semibold z-10">
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
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-brand-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-display font-bold text-brand-dark mb-4">
              Product <span className="text-gradient">Categories</span>
            </h2>
            <p className="text-gray-600 text-lg">Browse our complete product range</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {featuredProducts.slice(0, 8).map((product) => (
              <motion.div
                key={product._id}
                variants={itemVariants}
                whileHover={{ y: -10 }}
              >
                <div onClick={() => setSelectedCatalog(product)} className="cursor-pointer">
                  <div className="card group">
                    <div className="relative h-56 bg-gray-100 flex items-center justify-center overflow-hidden">
                      {product.ecoFriendly && (
                        <span className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
                          🌱 Eco
                        </span>
                      )}
                      <img 
                        src={product.image?.startsWith('/uploads') ? `http://localhost:5002${product.image}` : product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-brand-dark mb-2 line-clamp-2">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{product.categoryName || product.category}</span>
                        <ExternalLink className="w-5 h-5 text-brand-yellow group-hover:translate-x-2 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-12">
            <Link to="/catalog" className="btn-primary">
              View Complete Catalog
              <ArrowRight className="inline ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold mb-6">
              Ready to Explore Our Products?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Browse our complete catalog with downloadable product information and detailed specifications
            </p>
            <Link to="/catalog" className="btn-primary">
              Start Exploring
              <ArrowRight className="inline ml-2 w-5 h-5" />
            </Link>
          </motion.div>
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
