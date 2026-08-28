import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Document, Page } from 'react-pdf';
import { getPdfUrl } from '../config/api';

/**
 * Full-size popup for a single product photo, rendered from a specific page
 * of a catalog's PDF. Shared by the Products page and the Order Calculator's
 * price-filtered photo grid so clicking a thumbnail opens the same viewer.
 *
 * Rendered via a portal into document.body so `position: fixed` always
 * covers the real viewport, even when a caller sits inside a framer-motion
 * element (those apply a CSS transform, which would otherwise turn this
 * into a containing block and break fixed positioning).
 */
const PhotoLightbox = ({ pdfFile, pageNumber, title, subtitle, priceLabel, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
            <p className="font-bold text-gray-900 text-sm truncate">{title}</p>
            {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
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

        <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-50 p-4">
          {pdfFile ? (
            <Document
              file={getPdfUrl(pdfFile)}
              loading={<p className="text-sm text-gray-400 py-16">Loading photo…</p>}
              error={<p className="text-sm text-gray-400 py-16">Couldn't load photo</p>}
            >
              <Page
                pageNumber={pageNumber}
                width={440}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            </Document>
          ) : (
            <p className="text-sm text-gray-400 py-16">No photo available</p>
          )}
        </div>

        {priceLabel && (
          <div className="px-4 py-3 border-t border-gray-100 shrink-0">
            <span className="text-sm font-bold text-brand-dark">{priceLabel}</span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default PhotoLightbox;
