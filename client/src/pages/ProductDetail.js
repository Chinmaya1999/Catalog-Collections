import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Truck, Shield, RefreshCw, PackageSearch, Ruler, Weight, Box } from 'lucide-react';
import { API_ENDPOINTS, getImageUrl } from '../config/api';
import SEO from '../components/SEO';

const formatPrice = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : 'Price on request');

const RelatedCard = ({ product }) => {
  const primary = product.images?.find((i) => i.isPrimary) || product.images?.[0];
  return (
    <Link to={`/shop/${product._id}`} className="group bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
        {primary ? (
          <img src={getImageUrl(primary.path)} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" loading="lazy" />
        ) : <PackageSearch className="w-8 h-8 text-gray-300" />}
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-900 text-xs line-clamp-1">{product.name}</p>
        <p className="text-brand-dark font-bold text-sm">{formatPrice(product.priceFrom)}</p>
      </div>
    </Link>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_ENDPOINTS.products}/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
          setRelated(data.related || []);
          setSelectedImage(0);
          setSelectedVariantIdx(0);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center bg-brand-light">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-20 min-h-screen flex flex-col items-center justify-center bg-brand-light gap-4">
        <p className="text-xl text-gray-600">Product not found</p>
        <Link to="/shop" className="btn-primary inline-flex items-center">Back to Shop</Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];
  const activeImage = images[selectedImage] || images[0];
  const variant = product.variants?.[selectedVariantIdx] || {};
  const price = typeof variant.sellingPrice === 'number' ? variant.sellingPrice : variant.mrp;
  const showStrikethrough = typeof variant.sellingPrice === 'number' && typeof variant.mrp === 'number' && variant.sellingPrice < variant.mrp;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-brand-light">
      <SEO
        title={`${product.name || 'Product'} | Adihuman`}
        description={product.description || `${product.name} - ${product.brand || ''}`.trim()}
        path={`/shop/${product._id}`}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/shop" className="inline-flex items-center text-gray-600 hover:text-brand-gold transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
              <div className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
                {activeImage ? (
                  <img src={getImageUrl(activeImage.path)} alt={product.name} className="w-full h-full object-contain" />
                ) : (
                  <PackageSearch className="w-16 h-16 text-gray-300" />
                )}
              </div>
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {images.map((image, index) => (
                  <button
                    key={image._id || index}
                    onClick={() => setSelectedImage(index)}
                    className={`bg-white rounded-xl p-1.5 shadow-sm transition-all ${selectedImage === index ? 'ring-2 ring-brand-yellow' : 'hover:ring-2 ring-gray-200'}`}
                  >
                    <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden">
                      <img src={getImageUrl(image.path)} alt="" className="w-full h-full object-contain" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              {product.brand && (
                <p className="text-xs font-semibold text-brand-gold uppercase tracking-wide mb-2">{product.brand}</p>
              )}
              <h1 className="text-3xl font-display font-bold text-brand-dark mb-3">{product.name || 'Unnamed product'}</h1>
              {product.material && (
                <p className="text-sm text-gray-500 mb-4">Material: <span className="text-gray-700 font-medium">{product.material}</span></p>
              )}

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-brand-dark">{formatPrice(price)}</span>
                {showStrikethrough && (
                  <span className="text-xl text-gray-400 line-through">{formatPrice(variant.mrp)}</span>
                )}
              </div>

              {product.description && (
                <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
              )}

              {product.colors?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-brand-dark text-sm mb-2">Available Colours</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((c, i) => (
                      <span key={i} className="flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
                        {c.thumbnailImage && (
                          <img src={getImageUrl(c.thumbnailImage)} alt="" className="w-4 h-4 rounded-full object-cover" />
                        )}
                        {c.name}{c.code ? ` (${c.code})` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {product.variants?.length > 1 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-brand-dark text-sm mb-2">Options</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v, i) => (
                      <button
                        key={v._id || i}
                        onClick={() => setSelectedVariantIdx(i)}
                        className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
                          selectedVariantIdx === i ? 'bg-brand-yellow border-brand-yellow text-brand-dark' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-yellow'
                        }`}
                      >
                        {v.description || v.sku || `Option ${i + 1}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(variant.sku || variant.dimensionsCm || variant.weightKg || variant.volumeLtr) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 text-sm">
                  {variant.sku && (
                    <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                      <p className="text-[11px] text-gray-400">SKU</p>
                      <p className="font-semibold text-gray-800">{variant.sku}</p>
                    </div>
                  )}
                  {variant.dimensionsCm && (
                    <div className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-start gap-2">
                      <Ruler className="w-4 h-4 text-brand-gold mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] text-gray-400">Dimensions</p>
                        <p className="font-semibold text-gray-800">{variant.dimensionsCm} cm</p>
                      </div>
                    </div>
                  )}
                  {typeof variant.weightKg === 'number' && (
                    <div className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-start gap-2">
                      <Weight className="w-4 h-4 text-brand-gold mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] text-gray-400">Weight</p>
                        <p className="font-semibold text-gray-800">{variant.weightKg} kg</p>
                      </div>
                    </div>
                  )}
                  {typeof variant.volumeLtr === 'number' && (
                    <div className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-start gap-2">
                      <Box className="w-4 h-4 text-brand-gold mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] text-gray-400">Volume</p>
                        <p className="font-semibold text-gray-800">{variant.volumeLtr} L</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Link to="/catalog-request" className="btn-primary flex-1 text-center">
                  Request This Product
                </Link>
                <button onClick={handleShare} className="border border-gray-300 rounded-lg px-4 py-3 font-semibold text-brand-dark hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t">
                <div className="text-center">
                  <Truck className="w-7 h-7 text-brand-yellow mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Pan-India Delivery</p>
                </div>
                <div className="text-center">
                  <Shield className="w-7 h-7 text-brand-yellow mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Quality Assured</p>
                </div>
                <div className="text-center">
                  <RefreshCw className="w-7 h-7 text-brand-yellow mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Easy Support</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">You may also like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {related.map((p) => <RelatedCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
