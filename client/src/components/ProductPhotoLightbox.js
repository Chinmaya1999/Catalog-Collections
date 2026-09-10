import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, PackageSearch, ZoomIn, ZoomOut } from 'lucide-react';
import { getImageUrl } from '../config/api';

const formatPrice = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : 'Price on request');

/**
 * Full-size, swipeable, zoomable popup for a shop product's photo. `products` is the
 * list to swipe through (e.g. every product matching the current brand/category/price
 * filters), `startIndex` is which one to open on. `onSelect` fires with the product
 * whenever the visible one changes, so a caller can keep an outside "selected product"
 * in sync with whatever's currently shown here.
 */
const ProductPhotoLightbox = ({ products, startIndex = 0, onSelect, onClose }) => {
  const [index, setIndex] = useState(startIndex);
  const [direction, setDirection] = useState(1);
  const [zoomed, setZoomed] = useState(false);

  const product = products[index];

  const goTo = (delta) => {
    setDirection(delta);
    setZoomed(false);
    setIndex((i) => Math.max(0, Math.min(products.length - 1, i + delta)));
  };

  useEffect(() => {
    if (product) onSelect?.(product);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goTo(-1);
      if (e.key === 'ArrowRight') goTo(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, products.length]);

  if (!product) return null;

  const primaryImage = product.images?.find((i) => i.isPrimary) || product.images?.[0];

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{product.name || 'Product'}</p>
            {product.brand && <p className="text-xs text-gray-400 truncate">{product.brand}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0 ml-3"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className={`relative flex-1 min-h-[280px] bg-gray-50 p-4 flex items-center justify-center ${zoomed ? 'overflow-auto' : 'overflow-hidden'}`}>
          {primaryImage ? (
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.button
                type="button"
                key={index}
                custom={direction}
                initial={{ opacity: 0, x: direction * 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 30 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                onClick={() => setZoomed((z) => !z)}
                className={zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}
              >
                <img
                  src={getImageUrl(primaryImage.path)}
                  alt={product.name || 'Product'}
                  className={`transition-transform duration-200 ${zoomed ? 'max-w-none w-[720px]' : 'max-w-full max-h-[50vh] object-contain'}`}
                />
              </motion.button>
            </AnimatePresence>
          ) : (
            <div className="text-center text-gray-400 py-16">
              <PackageSearch className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No photo available</p>
            </div>
          )}

          {products.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(-1)}
                disabled={index <= 0}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white hover:scale-105 disabled:opacity-0 disabled:pointer-events-none transition-all"
                aria-label="Previous product"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => goTo(1)}
                disabled={index >= products.length - 1}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white hover:scale-105 disabled:opacity-0 disabled:pointer-events-none transition-all"
                aria-label="Next product"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-bold text-brand-dark truncate">{formatPrice(product.priceFrom)}</span>
            {primaryImage && (
              <button
                type="button"
                onClick={() => setZoomed((z) => !z)}
                className="shrink-0 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
              >
                {zoomed ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
          {products.length > 1 && (
            <span className="text-xs text-gray-400 shrink-0">
              Product {index + 1} of {products.length}
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProductPhotoLightbox;
