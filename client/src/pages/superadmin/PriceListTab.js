import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  Search,
  Loader2,
  Trash2,
  Edit,
  Check,
  X,
  FileText,
  FileSpreadsheet,
  Tag,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { API_ENDPOINTS, getPdfUrl } from '../../config/api';
import StatCard from './StatCard';

const PAGE_SIZE = 50;
const EMPTY_FILTERS = { search: '', category: '', file: '', priced: '', min: '', max: '', sort: 'sku' };

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

const PriceText = ({ item, large = false }) => {
  if (!item.price) return <span className="text-gray-400">—</span>;
  if (item.priceValue === null) return <span className="text-gray-500 font-medium">{item.price}</span>;

  // Plain amounts ("375", "375+gst") get the rupee treatment; anything richer
  // ("450 ml - 255, 500 ml-295") is shown exactly as the vendor wrote it.
  const simple = /^\s*[\d,.]+\s*(\+\s*g[sd]t)?\s*$/i.test(item.price);
  if (!simple) return <span className="font-semibold text-gray-900">{item.price}</span>;

  return (
    <span className={`font-bold text-gray-900 ${large ? 'text-3xl' : ''}`}>
      ₹{item.priceValue.toLocaleString('en-IN')}
      {item.plusGst && (
        <span className={`ml-1.5 font-semibold text-amber-700 bg-amber-100 rounded px-1.5 py-0.5 ${large ? 'text-sm' : 'text-[11px]'}`}>
          + GST
        </span>
      )}
    </span>
  );
};

const PriceListTab = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ categories: [], files: [], total: 0 });

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState('');

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [category, setCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [showFiles, setShowFiles] = useState(false);

  const fetchMeta = useCallback(async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.priceList}/meta`, { headers: authHeaders() });
      if (res.ok) setMeta(await res.json());
    } catch (error) {
      console.error('Error fetching price list info:', error);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE });
      Object.entries(filters).forEach(([k, v]) => v !== '' && params.set(k, v));
      const res = await fetch(`${API_ENDPOINTS.priceList}/items?${params}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setTotal(data.total);
        setPages(data.pages);
      }
    } catch (error) {
      console.error('Error fetching price list:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Debounce typing in the SKU search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.search === searchInput.trim() ? f : { ...f, search: searchInput.trim() }));
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setSearchInput('');
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const pickFiles = (fileList) => {
    const accepted = Array.from(fileList).filter((f) => /\.(pdf|xlsx|xls)$/i.test(f.name));
    if (accepted.length < fileList.length) alert('Only PDF and Excel (.xlsx, .xls) files can be uploaded.');
    setSelectedFiles(accepted);
    setUploadResults(null);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((f) => formData.append('files', f));
      if (selectedFiles.length === 1 && category.trim()) formData.append('category', category.trim());

      const res = await fetch(`${API_ENDPOINTS.priceList}/upload`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setUploadResults(data.results);
        setSelectedFiles([]);
        setCategory('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchMeta();
        fetchItems();
      } else {
        alert(`Error: ${data.message || 'Upload failed'}`);
      }
    } catch (error) {
      console.error('Error uploading price list:', error);
      alert('Error uploading price list. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const savePrice = async (id) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.priceList}/items/${id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: editPrice })
      });
      const data = await res.json();
      if (res.ok) {
        setItems((prev) => prev.map((i) => (i._id === id ? { ...i, ...data.item } : i)));
        setEditingId(null);
      } else {
        alert(`Error: ${data.message || 'Failed to update price'}`);
      }
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete ${item.sku} from the price list?`)) return;
    try {
      const res = await fetch(`${API_ENDPOINTS.priceList}/items/${item._id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) {
        fetchItems();
        fetchMeta();
      }
    } catch (error) {
      console.error('Error deleting SKU:', error);
    }
  };

  const deleteFile = async (file) => {
    if (!window.confirm(`Delete "${file.originalName}" and its ${file.itemCount} SKU prices? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_ENDPOINTS.priceList}/files/${file._id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) {
        if (filters.file === file._id) setFilter('file', '');
        fetchItems();
        fetchMeta();
      }
    } catch (error) {
      console.error('Error deleting price list file:', error);
    }
  };

  const exactHit = filters.search && items[0]?.exactMatch ? items[0] : null;
  const hasFilters = Object.entries(filters).some(([k, v]) => v !== EMPTY_FILTERS[k]);
  const inputClass =
    'w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-sm';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={IndianRupee} label="SKU Prices" value={meta.total} color="yellow" />
        <StatCard icon={Tag} label="Categories" value={meta.categories.length} color="blue" />
        <StatCard icon={FileText} label="Uploaded Files" value={meta.files.length} color="green" onClick={() => setShowFiles((s) => !s)} />
      </div>

      {/* Upload */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <h2 className="text-xl font-bold text-gray-900">Upload Price Lists</h2>
          <p className="text-gray-600 mt-1 text-sm">
            Upload one or many PDF / Excel price lists. SKU codes and prices are read automatically; uploading a newer list
            updates the price of any SKU that already exists.
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              pickFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragOver ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 hover:border-yellow-400 hover:bg-gray-50'
            }`}
          >
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="font-semibold text-gray-700">Drop PDF or Excel files here, or click to choose</p>
            <p className="text-sm text-gray-400 mt-1">.pdf, .xlsx, .xls — you can select several at once</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.xlsx,.xls"
              className="hidden"
              onChange={(e) => pickFiles(e.target.files)}
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((f) => (
                  <span key={f.name} className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-lg">
                    {/\.pdf$/i.test(f.name) ? <FileText size={14} /> : <FileSpreadsheet size={14} />}
                    {f.name}
                  </span>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {selectedFiles.length === 1 && (
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Category (optional — taken from the file name if blank)"
                    className={`${inputClass} sm:flex-1`}
                  />
                )}
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-6 py-2.5 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-lg disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                  Upload {selectedFiles.length > 1 ? `${selectedFiles.length} files` : 'file'}
                </button>
              </div>
              {selectedFiles.length > 1 && (
                <p className="text-xs text-gray-500">Each file's category is taken from its name, e.g. "Mugs Price List.pdf" → Mugs.</p>
              )}
            </div>
          )}

          {uploadResults && (
            <div className="space-y-2">
              {uploadResults.map((r) => (
                <div
                  key={r.fileName}
                  className={`rounded-xl p-3 text-sm border ${
                    r.error ? 'bg-red-50 border-red-200' : r.warnings?.length ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {r.error ? (
                      <X size={16} className="text-red-600 mt-0.5 shrink-0" />
                    ) : r.warnings?.length ? (
                      <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                    ) : (
                      <CheckCircle2 size={16} className="text-green-600 mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">
                        {r.fileName} <span className="font-normal text-gray-500">→ {r.category}</span>
                      </p>
                      {r.error ? (
                        <p className="text-red-700">{r.error}</p>
                      ) : (
                        <p className="text-gray-700">
                          {r.imported} SKUs imported
                          {r.updated > 0 && `, ${r.updated} existing prices updated`}
                          {r.withoutPrice > 0 && `, ${r.withoutPrice} without a price`}
                        </p>
                      )}
                      {r.warnings?.map((w) => (
                        <p key={w} className="text-amber-800 mt-1">{w}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Uploaded files */}
      {showFiles && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Uploaded Files</h3>
            <button onClick={() => setShowFiles(false)} className="text-gray-400 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          {meta.files.length === 0 ? (
            <p className="p-6 text-center text-gray-500">No price lists uploaded yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {meta.files.map((f) => (
                <div key={f._id} className="px-6 py-3 flex items-center gap-3 flex-wrap">
                  {f.fileType === 'pdf' ? (
                    <FileText size={20} className="text-red-500 shrink-0" />
                  ) : (
                    <FileSpreadsheet size={20} className="text-green-600 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <a
                      href={getPdfUrl(f.filePath)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-gray-900 hover:text-yellow-600 truncate block"
                    >
                      {f.originalName}
                    </a>
                    <p className="text-xs text-gray-500">
                      {f.category} · {f.itemCount > 0 ? `${f.itemCount} SKUs` : 'all SKUs replaced by a newer upload'} ·{' '}
                      {new Date(f.createdAt).toLocaleDateString('en-IN')}
                      {f.uploadedBy && ` · by ${f.uploadedBy}`}
                    </p>
                  </div>
                  <button
                    onClick={() => setFilter('file', f._id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Show SKUs
                  </button>
                  <button
                    onClick={() => deleteFile(f)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                    title="Delete file and its prices"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search + filters + table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search SKU code (e.g. HGS - K301, K301, B127) or description"
              className="w-full pl-12 pr-10 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-base"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {exactHit && (
            <div className="flex items-center gap-4 flex-wrap bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-2xl p-5">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Exact match</p>
                <p className="text-2xl font-bold text-gray-900">{exactHit.sku}</p>
                <p className="text-sm text-gray-600">
                  {exactHit.category}
                  {exactHit.section && ` · ${exactHit.section}`}
                  {exactHit.description && ` · ${exactHit.description}`}
                </p>
              </div>
              <PriceText item={exactHit} large />
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <select value={filters.category} onChange={(e) => setFilter('category', e.target.value)} className={inputClass}>
              <option value="">All categories</option>
              {meta.categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.count})
                </option>
              ))}
            </select>
            <select value={filters.file} onChange={(e) => setFilter('file', e.target.value)} className={inputClass}>
              <option value="">All files</option>
              {meta.files.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.originalName}
                </option>
              ))}
            </select>
            <select value={filters.priced} onChange={(e) => setFilter('priced', e.target.value)} className={inputClass}>
              <option value="">Any price status</option>
              <option value="yes">Has price</option>
              <option value="no">Missing price</option>
            </select>
            <input
              type="number"
              min="0"
              value={filters.min}
              onChange={(e) => setFilter('min', e.target.value)}
              placeholder="Min ₹"
              className={inputClass}
            />
            <input
              type="number"
              min="0"
              value={filters.max}
              onChange={(e) => setFilter('max', e.target.value)}
              placeholder="Max ₹"
              className={inputClass}
            />
            <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)} className={inputClass}>
              <option value="sku">Sort: Category / SKU</option>
              <option value="price-asc">Sort: Price low → high</option>
              <option value="price-desc">Sort: Price high → low</option>
              <option value="recent">Sort: Recently updated</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              {total} SKU{total === 1 ? '' : 's'} found
            </span>
            {hasFilters && (
              <button onClick={resetFilters} className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900">
                <RotateCcw size={14} /> Clear filters
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <IndianRupee className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{meta.total === 0 ? 'No price lists uploaded yet' : 'No SKUs match these filters'}</p>
            {meta.total === 0 && <p className="text-gray-400 text-sm mt-1">Upload a PDF or Excel price list above to get started.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                <tr>
                  <th className="px-6 py-3 font-semibold">SKU Code</th>
                  <th className="px-6 py-3 font-semibold">Price</th>
                  <th className="px-6 py-3 font-semibold whitespace-nowrap">Shop price (+80%, min ₹250)</th>
                  <th className="px-6 py-3 font-semibold">Category</th>
                  <th className="px-6 py-3 font-semibold">Description</th>
                  <th className="px-6 py-3 font-semibold">Source</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item._id} className={item.exactMatch && filters.search ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-3 font-mono font-semibold text-gray-900 whitespace-nowrap">{item.sku}</td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      {editingId === item._id ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') savePrice(item._id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            placeholder="e.g. 375+gst"
                            className="w-28 px-2 py-1 border-2 border-yellow-300 rounded-lg text-sm"
                          />
                          <button onClick={() => savePrice(item._id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <PriceText item={item} />
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap font-bold text-emerald-700">
                      {item.priceValue === null ? <span className="text-gray-300 font-normal">—</span> : `₹${Math.max(250, Math.round(item.priceValue * 1.80)).toLocaleString('en-IN')}`}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className="text-gray-900">{item.category}</span>
                      {item.section && <span className="text-gray-400"> · {item.section}</span>}
                    </td>
                    <td className="px-6 py-3 text-gray-600 max-w-xs truncate" title={item.description}>
                      {item.description || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-xs max-w-[180px] truncate" title={item.sourceFileName}>
                      {item.sourceFileName}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingId(item._id);
                            setEditPrice(item.price || '');
                          }}
                          className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                          title="Edit price"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => deleteItem(item)}
                          className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                          title="Delete SKU"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Page {page} of {pages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PriceListTab;
