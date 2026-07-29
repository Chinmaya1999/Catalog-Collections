import React, { useState, useEffect, memo } from 'react';
import { X, Download, ExternalLink, Loader2, ChevronDown } from 'lucide-react';

const PDFViewer = memo(({ driveUrl, catalog, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Convert Google Drive view URL to embed URL
    const convertToEmbedUrl = (url) => {
      // Extract file ID from Google Drive URL
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        const fileId = match[1];
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
      return null;
    };

    const embed = convertToEmbedUrl(driveUrl);
    if (embed) {
      setEmbedUrl(embed);
    } else {
      setError(true);
      setLoading(false);
    }
  }, [driveUrl]);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setShowDropdown(false);
    // Note: Google Drive embed doesn't support direct page navigation
    // This is a limitation of the Google Drive viewer
    // In a real implementation, you might need to use a different PDF viewer
  };

  const hasProducts = catalog && catalog.products && catalog.products.length > 0;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-brand-dark">
              {catalog ? catalog.name : 'Catalog Preview'}
            </h2>
            
            {/* Product Dropdown */}
            {hasProducts && (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-gray-700">
                    {selectedProduct ? `${selectedProduct.code} - ${selectedProduct.name}` : 'Select Product'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                
                {showDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                    {catalog.products.map((product, index) => (
                      <button
                        key={index}
                        onClick={() => handleProductSelect(product)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-brand-dark">{product.code}</span>
                            <span className="text-gray-600 ml-2">{product.name}</span>
                          </div>
                          <span className="text-xs text-gray-400">Page {product.page}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-brand-yellow text-brand-dark rounded-lg hover:bg-brand-gold transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-brand-dark rounded-lg hover:bg-gray-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open in Drive
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Selected Product Info */}
        {selectedProduct && (
          <div className="px-4 py-2 bg-brand-yellow/10 border-b">
            <p className="text-sm text-brand-dark">
              <span className="font-semibold">Selected:</span> {selectedProduct.code} - {selectedProduct.name} 
              <span className="ml-2 text-gray-600">(Page {selectedProduct.page})</span>
            </p>
          </div>
        )}

        {/* PDF Viewer */}
        <div className="flex-grow relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-brand-yellow animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading catalog...</p>
              </div>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center p-8">
                <p className="text-gray-600 mb-4">Unable to load PDF inline</p>
                <a
                  href={driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-yellow text-brand-dark rounded-lg hover:bg-brand-gold transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                  Open in Google Drive
                </a>
              </div>
            </div>
          ) : (
            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              onLoad={handleLoad}
              onError={handleError}
              allow="autoplay"
              title="Catalog PDF"
            />
          )}
        </div>
      </div>
    </div>
  );
});

export default PDFViewer;
