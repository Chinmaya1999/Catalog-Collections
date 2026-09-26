import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Truck, Shield, RefreshCw, PackageSearch, Ruler, Weight, Box, MessageCircle, Check, BookOpen, Loader2, ChevronRight } from 'lucide-react';
import { API_ENDPOINTS, getImageUrl, getPdfUrl } from '../config/api';
import SEO from '../components/SEO';
import { swatchColor } from '../utils/colorSwatch';

// Same WhatsApp number the order calculator sends quotation requests to
const WHATSAPP_NUMBER = '918296810381';

const formatPrice = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : 'Price on request');

const RelatedCard = ({ product }) => {
  const primary = product.images?.find((i) => i.isPrimary) || product.images?.[0];
  return (
    <Link to={`/shop/${product._id}`} className="group bg-white rounded-3xl p-2 ring-1 ring-black/[0.06] shadow-soft hover:shadow-lift hover:-translate-y-1 transition-all duration-500">
      <div className="aspect-square rounded-2xl bg-gradient-to-b from-ink-50 to-ink-100 flex items-center justify-center overflow-hidden">
        {primary ? (
          <img src={getImageUrl(primary.path)} alt={product.name} className="w-full h-full object-contain p-3 mix-blend-multiply group-hover:scale-105 transition-transform duration-700" loading="lazy" />
        ) : <PackageSearch className="w-8 h-8 text-ink-300" />}
      </div>
      <div className="px-2 pt-3 pb-2">
        <p className="font-semibold text-brand-dark text-sm line-clamp-1">{product.name}</p>
        <p className="mt-0.5 text-brand-dark font-display font-extrabold">{formatPrice(product.priceFrom)}</p>
      </div>
    </Link>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // A hardcoded `to="/shop"` link would always land on an unfiltered shop page, discarding
  // whatever search/category/price filters were active. Going back in real browser history
  // instead returns to that exact filtered URL. Falls back to a plain /shop navigation when
  // there's no history to go back to (e.g. this product page was opened directly/shared).
  const backToShop = (e) => {
    e.preventDefault();
    if (window.history.state && window.history.state.idx > 0) navigate(-1);
    else navigate('/shop');
  };
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  // "You may also like" is fetched separately (not embedded in the product response) so it can
  // page independently via infinite scroll instead of being capped at a fixed handful of items.
  const [related, setRelated] = useState([]);
  const [relatedPage, setRelatedPage] = useState(1);
  const [relatedPagination, setRelatedPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [relatedLoadingMore, setRelatedLoadingMore] = useState(false);
  const relatedSentinelRef = useRef(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_ENDPOINTS.products}/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
          setSelectedImage(0);
          setSelectedVariantIdx(0);
          setSelectedColorIdx(0);
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
    // Reset the related-products grid for the new product before its first page loads.
    setRelated([]);
    setRelatedPage(1);
    setRelatedPagination({ page: 1, totalPages: 1, total: 0 });
  }, [id]);

  const fetchRelated = useCallback(async (pageNum, replace) => {
    setRelatedLoadingMore(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.products}/${id}/related?page=${pageNum}&limit=12`);
      if (res.ok) {
        const data = await res.json();
        setRelated((prev) => (replace ? data.products : [...prev, ...data.products]));
        setRelatedPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
    } finally {
      setRelatedLoadingMore(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRelated(1, true);
  }, [fetchRelated]);

  useEffect(() => {
    const el = relatedSentinelRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !relatedLoadingMore && relatedPage < relatedPagination.totalPages) {
          const next = relatedPage + 1;
          setRelatedPage(next);
          fetchRelated(next, false);
        }
      },
      { rootMargin: '400px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [relatedLoadingMore, relatedPage, relatedPagination.totalPages, fetchRelated]);

  if (loading) {
    return (
      <div className="pt-20 min-h-screen bg-brand-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-square rounded-[2rem] skeleton" />
          <div className="space-y-4 pt-4">
            <div className="h-3 w-24 rounded-full skeleton" />
            <div className="h-10 w-4/5 rounded-full skeleton" />
            <div className="h-8 w-1/3 rounded-full skeleton" />
            <div className="h-24 w-full rounded-3xl skeleton" />
            <div className="h-14 w-full rounded-full skeleton" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-20 min-h-screen flex flex-col items-center justify-center bg-brand-light gap-5 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-soft ring-1 ring-black/5">
          <PackageSearch className="w-9 h-9 text-ink-400" />
        </div>
        <p className="text-3xl font-display font-extrabold text-brand-dark">Product not found</p>
        <p className="text-ink-500 -mt-2">It may have been moved or is no longer available.</p>
        <Link to="/shop" onClick={backToShop} className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Back to Shop</Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];
  const activeImage = images[selectedImage] || images[0];
  const variant = product.variants?.[selectedVariantIdx] || {};
  const selectedColor = product.colors?.[selectedColorIdx] || null;
  const price = typeof variant.sellingPrice === 'number' ? variant.sellingPrice : variant.mrp;
  const showStrikethrough = typeof variant.sellingPrice === 'number' && typeof variant.mrp === 'number' && variant.sellingPrice < variant.mrp;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  const requestOnWhatsApp = () => {
    const lines = [
      'Hi, I would like to request this product:',
      `Product: ${product.name || 'Unnamed product'}`,
      product.brand ? `Brand: ${product.brand}` : null,
      product.material ? `Material: ${product.material}` : null,
      variant.sku ? `SKU: ${variant.sku}` : null,
      variant.description ? `Option: ${variant.description}` : null,
      variant.dimensionsCm ? `Dimensions: ${variant.dimensionsCm} cm` : null,
      typeof variant.weightKg === 'number' ? `Weight: ${variant.weightKg} kg` : null,
      typeof variant.volumeLtr === 'number' ? `Volume: ${variant.volumeLtr} L` : null,
      selectedColor?.name ? `Colour: ${selectedColor.name}${selectedColor.code ? ` (${selectedColor.code})` : ''}` : null,
      `Price: ${formatPrice(price)}`,
      `Link: ${window.location.href}`
    ].filter(Boolean);

    const message = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="pt-20 min-h-screen bg-brand-light pb-28 lg:pb-0">
      <SEO
        title={`${product.name || 'Product'} | Adihuman`}
        description={product.description || `${product.name} - ${product.brand || ''}`.trim()}
        path={`/shop/${product._id}`}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {/* Breadcrumb */}
        <motion.nav initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-2 text-sm">
          <Link to="/shop" onClick={backToShop} className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 font-semibold text-ink-600 shadow-soft ring-1 ring-black/5 transition-all hover:text-brand-dark hover:-translate-x-0.5">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="hidden sm:flex items-center gap-2 min-w-0 text-ink-400">
            <Link to="/" className="hover:text-brand-dark transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/shop" onClick={backToShop} className="hover:text-brand-dark transition-colors">Shop</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="truncate font-medium text-brand-dark">{product.name || 'Product'}</span>
          </div>
        </motion.nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 lg:sticky lg:top-24 lg:self-start"
          >
            <div className="flex flex-col-reverse gap-3 md:flex-row">
              {images.length > 1 && (
                <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto md:max-h-[600px] no-scrollbar md:w-20 shrink-0">
                  {images.map((image, index) => (
                    <button
                      key={image._id || index}
                      onClick={() => setSelectedImage(index)}
                      aria-label={`Show image ${index + 1}`}
                      className={`w-16 md:w-20 shrink-0 rounded-2xl bg-white p-1 transition-all duration-300 ${
                        selectedImage === index ? 'ring-2 ring-brand-dark shadow-soft' : 'ring-1 ring-black/5 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="aspect-square rounded-xl bg-ink-50 overflow-hidden">
                        <img src={getImageUrl(image.path)} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="relative flex-1 rounded-[2rem] bg-white p-3 shadow-card ring-1 ring-black/5">
                <div className="relative aspect-square rounded-[1.5rem] bg-gradient-to-b from-ink-50 to-ink-100 flex items-center justify-center overflow-hidden">
                  {activeImage ? (
                    <motion.img
                      key={activeImage.path}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35 }}
                      src={getImageUrl(activeImage.path)}
                      alt={product.name}
                      className="w-full h-full object-contain p-6 mix-blend-multiply"
                    />
                  ) : (
                    <PackageSearch className="w-16 h-16 text-ink-300" />
                  )}
                  {images.length > 1 && (
                    <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full glass px-3 py-1 text-xs font-semibold text-ink-600">
                      {selectedImage + 1} / {images.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleShare}
                  aria-label="Share product"
                  className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-dark shadow-soft ring-1 ring-black/5 transition-all hover:scale-110"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <div className="lg:pt-2">
              {product.brand && (
                <p className="inline-flex items-center rounded-full bg-brand-yellow/25 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-dark ring-1 ring-brand-yellow/50 mb-4">{product.brand}</p>
              )}
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-display font-extrabold tracking-tight leading-[1.05] text-brand-dark mb-4">{product.name || 'Unnamed product'}</h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6 text-sm">
                {product.material && (
                  <p className="text-ink-500">Material: <span className="text-brand-dark font-semibold">{product.material}</span></p>
                )}
                {product.vendorCatalogId?.pdfFile && (
                  <a
                    href={getPdfUrl(product.vendorCatalogId.pdfFile)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    View full catalog: {product.vendorCatalogId.name}
                  </a>
                )}
              </div>

              <div className="flex items-end gap-3 pb-6 mb-6 border-b border-ink-200/70">
                <span className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight text-brand-dark">{formatPrice(price)}</span>
                {showStrikethrough && (
                  <>
                    <span className="text-xl text-ink-400 line-through pb-1">{formatPrice(variant.mrp)}</span>
                    <span className="mb-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                      Save {Math.round(((variant.mrp - variant.sellingPrice) / variant.mrp) * 100)}%
                    </span>
                  </>
                )}
              </div>

              {product.description && (
                <p className="text-ink-600 mb-7 leading-7">{product.description}</p>
              )}

              {product.colors?.length > 0 && (
                <div className="mb-7">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400 mb-3">
                    Colour{selectedColor?.name ? <span className="normal-case tracking-normal font-semibold text-brand-dark text-sm"> — {selectedColor.name}</span> : ''}
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {product.colors.map((c, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setSelectedColorIdx(i)}
                        aria-pressed={selectedColorIdx === i}
                        aria-label={c.name || `Colour ${i + 1}`}
                        title={c.name}
                        style={c.thumbnailImage ? undefined : { backgroundColor: c.code || swatchColor(c.name) }}
                        className={`w-10 h-10 rounded-full border-2 border-white overflow-hidden flex items-center justify-center transition-all duration-300 ${
                          selectedColorIdx === i ? 'ring-2 ring-brand-dark ring-offset-2 scale-105' : 'ring-1 ring-ink-200 hover:ring-ink-400'
                        }`}
                      >
                        {c.thumbnailImage ? (
                          <img src={getImageUrl(c.thumbnailImage)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          selectedColorIdx === i && (
                            <Check className={`w-4 h-4 ${['white', 'silver', 'beige', 'ivory', 'cream'].includes((c.name || '').toLowerCase()) ? 'text-gray-700' : 'text-white'}`} />
                          )
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.variants?.length > 1 && (
                <div className="mb-7">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400 mb-3">Options</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v, i) => (
                      <button
                        key={v._id || i}
                        onClick={() => setSelectedVariantIdx(i)}
                        className={`text-sm font-semibold px-4 py-2.5 rounded-2xl border transition-all duration-200 ${
                          selectedVariantIdx === i ? 'bg-brand-dark border-brand-dark text-white shadow-soft' : 'bg-white border-ink-200 text-ink-600 hover:border-brand-dark hover:text-brand-dark'
                        }`}
                      >
                        {v.description || v.sku || `Option ${i + 1}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(variant.sku || variant.dimensionsCm || variant.weightKg || variant.volumeLtr) && (
                <div className="grid grid-cols-2 gap-2.5 mb-7 text-sm">
                  {variant.sku && (
                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-black/5">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-ink-400">SKU</p>
                      <p className="mt-0.5 font-semibold text-brand-dark">{variant.sku}</p>
                    </div>
                  )}
                  {variant.dimensionsCm && (
                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-black/5 flex items-start gap-2.5">
                      <Ruler className="w-4 h-4 text-brand-gold mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-ink-400">Dimensions</p>
                        <p className="mt-0.5 font-semibold text-brand-dark">{variant.dimensionsCm} cm</p>
                      </div>
                    </div>
                  )}
                  {typeof variant.weightKg === 'number' && (
                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-black/5 flex items-start gap-2.5">
                      <Weight className="w-4 h-4 text-brand-gold mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-ink-400">Weight</p>
                        <p className="mt-0.5 font-semibold text-brand-dark">{variant.weightKg} kg</p>
                      </div>
                    </div>
                  )}
                  {typeof variant.volumeLtr === 'number' && (
                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-black/5 flex items-start gap-2.5">
                      <Box className="w-4 h-4 text-brand-gold mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-ink-400">Volume</p>
                        <p className="mt-0.5 font-semibold text-brand-dark">{variant.volumeLtr} L</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="hidden lg:flex gap-3">
                <button
                  type="button"
                  onClick={requestOnWhatsApp}
                  className="btn-whatsapp flex-1 !py-4 !text-base"
                >
                  <MessageCircle className="w-5 h-5" />
                  Request This Product
                </button>
                <button onClick={handleShare} aria-label="Share product" className="btn-outline !px-4 !py-4">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5 mt-6">
                {[[Truck, 'Pan-India Delivery'], [Shield, 'Quality Assured'], [RefreshCw, 'Easy Support']].map(([Icon, label]) => (
                  <div key={label} className="flex flex-col items-center gap-2 rounded-2xl bg-white px-2 py-4 text-center ring-1 ring-black/5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-yellow/25">
                      <Icon className="w-4 h-4 text-brand-dark" />
                    </span>
                    <p className="text-[11px] font-semibold text-ink-600 leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {related.length > 0 && (
          <div className="mt-20 lg:mt-28">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <p className="eyebrow">Keep exploring</p>
                <h2 className="mt-3 text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-brand-dark">You may also like</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {related.map((p) => <RelatedCard key={p._id} product={p} />)}
            </div>

            {/* Infinite scroll sentinel - loads more related products as the user scrolls,
                instead of stopping at a fixed handful. */}
            <div ref={relatedSentinelRef} className="h-px w-full" aria-hidden="true" />

            {relatedLoadingMore && (
              <div className="flex items-center justify-center py-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-ink-500 shadow-soft ring-1 ring-black/5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Loading more...</span>
                </span>
              </div>
            )}

            {!relatedLoadingMore && relatedPage >= relatedPagination.totalPages && related.length > 4 && (
              <p className="text-center text-xs text-ink-400 py-8">
                That's all {relatedPagination.total} related products.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 p-3 lg:hidden">
        <div className="glass flex items-center gap-3 rounded-full p-2 pl-5 shadow-lift">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">Price</p>
            <p className="truncate font-display text-lg font-extrabold leading-tight text-brand-dark">{formatPrice(price)}</p>
          </div>
          <button type="button" onClick={requestOnWhatsApp} className="btn-whatsapp !px-5 !py-3">
            <MessageCircle className="w-4 h-4" /> Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
