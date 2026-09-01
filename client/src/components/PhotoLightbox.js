import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { getPdfUrl } from '../config/api';
import PDFViewer from './PDFViewer';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Full-size, swipeable popup for a catalog's product photos, rendered from
 * the catalog's PDF pages. Shared by the Products page and the Order
 * Calculator's price-filtered photo grid.
 *
 * `products` is the full list to swipe through (all from the same catalog);
 * `startIndex` is which one to open on. Clicking the catalog reference opens
 * the catalog's full PDF in the existing PDFViewer popup, on top of this one.
 *
 * Rendered via a portal into document.body so `position: fixed` always
 * covers the real viewport, even when a caller sits inside a framer-motion
 * element (those apply a CSS transform, which would otherwise turn this
 * into a containing block and break fixed positioning).
 */
const PhotoLightbox = ({ catalog, products, startIndex = 0, getPriceLabel, onClose }) => {
  const [index, setIndex] = useState(startIndex);
  const [direction, setDirection] = useState(1);
  const [showCatalog, setShowCatalog] = useState(false);

  const product = products[index];

  const goTo = (delta) => {
    setDirection(delta);
    setIndex((i) => Math.max(0, Math.min(products.length - 1, i + delta)));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showCatalog) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goTo(-1);
      if (e.key === 'ArrowRight') goTo(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, showCatalog, products.length]);

  if (!product) return null;

  if (showCatalog) {
    return createPortal(
      <PDFViewer catalog={catalog} initialPage={product.page} onClose={() => setShowCatalog(false)} />,
      document.body
    );
  }

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
            <p className="font-bold text-gray-900 text-sm truncate">{product.name || product.code}</p>
            {product.code && <p className="text-xs text-gray-400 truncate">{product.code}</p>}
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

        <div className="relative flex-1 overflow-auto flex items-center justify-center bg-gray-50 p-4">
          {catalog?.pdfFile ? (
            <Document
              key={catalog._id}
              file={getPdfUrl(catalog.pdfFile)}
              loading={<p className="text-sm text-gray-400 py-16">Loading photo…</p>}
              error={<p className="text-sm text-gray-400 py-16">Couldn't load photo</p>}
            >
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={index}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -direction * 30 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                >
                  <Page
                    pageNumber={product.page}
                    width={440}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />
                </motion.div>
              </AnimatePresence>
            </Document>
          ) : (
            <p className="text-sm text-gray-400 py-16">No photo available</p>
          )}

          {products.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(-1)}
                disabled={index <= 0}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white hover:scale-105 disabled:opacity-0 disabled:pointer-events-none transition-all"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => goTo(1)}
                disabled={index >= products.length - 1}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white hover:scale-105 disabled:opacity-0 disabled:pointer-events-none transition-all"
                aria-label="Next photo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 shrink-0 flex items-center justify-between gap-3">
          <div className="min-w-0">
            {getPriceLabel && (
              <span className="text-sm font-bold text-brand-dark block truncate">{getPriceLabel(product)}</span>
            )}
            {products.length > 1 && (
              <span className="text-xs text-gray-400">
                Photo {index + 1} of {products.length}
              </span>
            )}
          </div>
          {catalog?.pdfFile && (
            <button
              type="button"
              onClick={() => setShowCatalog(true)}
              className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              {catalog.name}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PhotoLightbox;
