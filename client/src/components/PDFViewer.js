import React, { useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, ExternalLink } from 'lucide-react';
import { getPdfUrl } from '../config/api';

const PDFViewer = ({ pdfUrl, driveUrl, catalog, initialPage = 1, onClose }) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef(null);

  // Determine the PDF URL to use
  const getFinalPdfUrl = () => {
    if (pdfUrl) return pdfUrl;
    if (catalog?.pdfFile) {
      return getPdfUrl(catalog.pdfFile);
    }
    if (driveUrl) return driveUrl;
    return null;
  };

  const finalPdfUrl = getFinalPdfUrl();

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleZoomIn = () => {
    setScale(Math.min(scale + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(Math.max(scale - 0.25, 0.5));
  };

  const handleDownload = () => {
    if (finalPdfUrl) {
      window.open(finalPdfUrl, '_blank');
    }
  };

  const handleLoad = () => {
    setLoading(false);
    // Try to get total pages from catalog if available
    if (catalog?.products && catalog.products.length > 0) {
      const maxPage = Math.max(...catalog.products.map(p => p.page || 1));
      setTotalPages(maxPage);
    } else {
      setTotalPages(50); // Default fallback
    }
  };

  const jumpToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // If no PDF URL is available, show a message
  if (!finalPdfUrl) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-4">No PDF Available</h3>
          <p className="text-gray-600 mb-6">
            {driveUrl ? (
              <span>
                This catalog is available via Google Drive. 
                <a 
                  href={driveUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 ml-2"
                >
                  Open in Google Drive <ExternalLink size={16} className="inline ml-1" />
                </a>
              </span>
            ) : (
              'No PDF file is available for this catalog.'
            )}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-0">
      <div className="bg-white w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-gray-900">
              {catalog?.name || 'PDF Viewer'}
            </h3>
            {catalog?.description && (
              <p className="text-sm text-gray-600 hidden md:block">{catalog.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download PDF"
            >
              <Download size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              title="Previous Page"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => jumpToPage(parseInt(e.target.value))}
                min="1"
                max={totalPages}
                className="w-16 text-center font-medium"
              />
              <span className="text-gray-500">/ {totalPages}</span>
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              title="Next Page"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              title="Zoom Out"
            >
              <ZoomOut size={20} />
            </button>
            <span className="text-sm font-medium w-16 text-center">{Math.round(scale * 100)}%</span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= 3}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              title="Zoom In"
            >
              <ZoomIn size={20} />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-900">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Loading PDF...</p>
              </div>
            </div>
          )}
          
          <iframe
            ref={iframeRef}
            src={`${finalPdfUrl}#page=${currentPage}&zoom=${scale}`}
            className="w-full h-full"
            style={{ minHeight: '100%' }}
            onLoad={handleLoad}
            title="PDF Viewer"
          />
        </div>

        {/* Footer with page info */}
        <div className="p-4 border-t bg-gray-50 text-center text-sm text-gray-600">
          Use arrow keys to navigate pages, +/- to zoom • Full screen PDF viewer
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
