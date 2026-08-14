import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileText,
  Trash2,
  Eye,
  Download,
  Search,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Inbox,
  Sparkles
} from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';

const TYPE_STYLES = {
  'price-list': { label: 'Price List', className: 'bg-green-100 text-green-800' },
  'vendor-list': { label: 'Vendor List', className: 'bg-purple-100 text-purple-800' },
  catalog: { label: 'Catalog', className: 'bg-blue-100 text-blue-800' },
  invoice: { label: 'Invoice', className: 'bg-orange-100 text-orange-800' },
  unknown: { label: 'Unknown', className: 'bg-gray-100 text-gray-700' }
};

const formatSize = (bytes) => {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
};

const TypeBadge = ({ type }) => {
  const style = TYPE_STYLES[type] || TYPE_STYLES.unknown;
  return (
    <span className={`px-3 py-1 text-xs font-bold rounded-full ${style.className}`}>
      {style.label}
    </span>
  );
};

const PdfAnalysisTab = () => {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [activeDoc, setActiveDoc] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [tableFilter, setTableFilter] = useState('');
  const fileInputRef = useRef(null);

  const token = localStorage.getItem('adminToken');
  const authHeaders = { Authorization: `Bearer ${token}` };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(API_ENDPOINTS.pdfAnalysis, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Error fetching PDF history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setUploadError('Please select a PDF file');
      return;
    }
    setUploadError('');
    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      const res = await fetch(`${API_ENDPOINTS.pdfAnalysis}/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setActiveDoc(data);
        setSelectedFile(null);
        setTableFilter('');
        fetchHistory();
      } else {
        setUploadError(data.message || 'Failed to analyze PDF');
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      setUploadError('Error uploading PDF. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (id) => {
    setLoadingDoc(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.pdfAnalysis}/${id}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setActiveDoc(data);
        setTableFilter('');
      }
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setLoadingDoc(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this analyzed PDF? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_ENDPOINTS.pdfAnalysis}/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        setHistory(prev => prev.filter(doc => doc._id !== id));
        if (activeDoc && activeDoc._id === id) setActiveDoc(null);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRows = useMemo(() => {
    if (!activeDoc || !activeDoc.extractedRows) return [];
    if (!tableFilter.trim()) return activeDoc.extractedRows;
    const q = tableFilter.trim().toLowerCase();
    return activeDoc.extractedRows.filter(row =>
      Object.values(row).some(val => String(val).toLowerCase().includes(q))
    );
  }, [activeDoc, tableFilter]);

  const handleExportCSV = () => {
    if (!activeDoc || !activeDoc.columns?.length) return;
    const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const header = activeDoc.columns.map(escape).join(',');
    const rows = filteredRows.map(row => activeDoc.columns.map(col => escape(row[col])).join(','));
    const csv = [header, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activeDoc.originalName || 'pdf-data').replace(/\.pdf$/i, '')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            PDF Analysis
          </h2>
          <p className="text-gray-600 mt-1">
            Upload any PDF — price lists, vendor lists, catalogs, or invoices. The system detects the document type and extracts its data into a table automatically.
          </p>
        </div>

        <div className="p-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              dragActive ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 hover:border-yellow-400 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
            <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            {selectedFile ? (
              <div>
                <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{formatSize(selectedFile.size)}</p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-gray-700">Drag & drop a PDF here, or click to browse</p>
                <p className="text-sm text-gray-400 mt-1">PDF files only, up to 100MB</p>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="mt-4 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle size={18} />
              <span className="text-sm font-medium">{uploadError}</span>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-6 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Analyzing PDF — extracting data…
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Analyze PDF
                </>
              )}
            </button>
            {selectedFile && !uploading && (
              <button
                onClick={() => setSelectedFile(null)}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Result Panel */}
      <AnimatePresence mode="wait">
        {(activeDoc || loadingDoc) && (
          <motion.div
            key={activeDoc?._id || 'loading'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            {loadingDoc ? (
              <div className="p-12 text-center text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                Loading document…
              </div>
            ) : (
              <>
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-gray-400" />
                    <div>
                      <h3 className="font-bold text-gray-900">{activeDoc.originalName}</h3>
                      <p className="text-sm text-gray-500">
                        {activeDoc.totalPages} page{activeDoc.totalPages === 1 ? '' : 's'} · {activeDoc.rowCount} rows extracted · {formatSize(activeDoc.fileSize)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <TypeBadge type={activeDoc.detectedType} />
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <CheckCircle2 size={16} className="text-green-500" />
                      {activeDoc.confidence}% confidence
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={tableFilter}
                        onChange={(e) => setTableFilter(e.target.value)}
                        placeholder="Filter extracted rows…"
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      />
                    </div>
                    <button
                      onClick={handleExportCSV}
                      disabled={!activeDoc.columns?.length}
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-blue-600 transition-all disabled:opacity-50"
                    >
                      <Download size={18} />
                      Export CSV
                    </button>
                  </div>

                  {activeDoc.columns?.length > 0 ? (
                    <div className="overflow-x-auto border border-gray-200 rounded-xl">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            {activeDoc.columns.map((col, i) => (
                              <th key={i} className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {filteredRows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-gray-50">
                              {activeDoc.columns.map((col, cIdx) => (
                                <td key={cIdx} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                  {row[col] || '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredRows.length === 0 && (
                        <div className="p-8 text-center text-gray-400">No rows match your filter</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No tabular data could be extracted from this PDF</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <h3 className="text-lg font-bold text-gray-900">Upload History</h3>
          <p className="text-sm text-gray-500 mt-1">Previously analyzed PDFs</p>
        </div>

        <div className="p-6">
          {loadingHistory ? (
            <div className="text-center py-8 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No PDFs analyzed yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((doc) => (
                <div
                  key={doc._id}
                  className={`border-2 rounded-xl p-4 transition-all ${
                    activeDoc?._id === doc._id ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate" title={doc.originalName}>
                        {doc.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(doc.createdAt).toLocaleDateString()} · {doc.rowCount} rows
                      </p>
                    </div>
                    <TypeBadge type={doc.detectedType} />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleView(doc._id)}
                      className="flex-1 flex items-center justify-center gap-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-all"
                    >
                      <Eye size={14} />
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(doc._id)}
                      disabled={deletingId === doc._id}
                      className="flex items-center justify-center gap-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-all disabled:opacity-50"
                    >
                      {deletingId === doc._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfAnalysisTab;
