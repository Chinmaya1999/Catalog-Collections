import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Grid, List, Star, Leaf } from 'lucide-react';
import axios from 'axios';

const CategoryPage = () => {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get('http://localhost:5002/api/products'),
          axios.get('http://localhost:5002/api/categories')
        ]);

        const currentCategory = categoriesRes.data.find(cat => cat.slug === slug);
        setCategory(currentCategory);

        if (currentCategory) {
          const categoryProducts = productsRes.data.filter(
            product => product.category._id === currentCategory._id
          );
          setProducts(categoryProducts);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

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
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Category not found</p>
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
          >
            <Link to="/catalog" className="inline-flex items-center text-gray-600 hover:text-brand-yellow transition-colors mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Catalog
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl">{category.icon}</span>
              <h1 className="text-4xl font-display font-bold text-brand-dark">
                {category.name}
              </h1>
            </div>
            {category.description && (
              <p className="text-gray-600 text-lg">{category.description}</p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Toggle & Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-brand-dark">{products.length}</span> products
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

        {products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <p className="text-xl text-gray-600">No products found in this category</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            {products.map((product) => (
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
                      <span className="text-6xl">📦</span>
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
  );
};

export default CategoryPage;
