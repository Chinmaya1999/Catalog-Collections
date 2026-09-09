import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  Trash2,
  Loader2,
  AlertTriangle,
  Inbox,
  PackageSearch,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Download,
  ChevronLeft,
  Image as ImageIcon,
  Plus,
  Copy
} from 'lucide-react';
import { API_ENDPOINTS, getImageUrl } from '../../config/api';

const STATUS_STYLES = {
  uploaded: { label: 'Queued', className: 'bg-gray-100 text-gray-700' },
  processing: { label: 'Processing', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-700' }
};

const PRODUCT_STATUS_STYLES = {
  pending: { label: 'Pending Review', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' }
};

const formatSize = (bytes) => {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
};

const StatusBadge = ({ status, map }) => {
  const style = map[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ${style.className}`}>
      {style.label}
    </span>
  );
};

const JobProgressBar = ({ job }) => {
  const pct = job.totalPages > 0 ? Math.round((job.processedPages / job.totalPages) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>Page {job.processedPages} / {job.totalPages || '?'}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const VariantRow = ({ variant, onChange, onRemove }) => (
  <tr className="hover:bg-gray-50">
    {['sku', 'description', 'dimensionsCm'].map((field) => (
      <td key={field} className="px-2 py-1">
        <input
          value={variant[field] ?? ''}
          onChange={(e) => onChange({ ...variant, [field]: e.target.value })}
          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
        />
      </td>
    ))}
    {['weightKg', 'volumeLtr', 'mrp', 'sellingPrice'].map((field) => (
      <td key={field} className="px-2 py-1">
        <input
          type="number"
          value={variant[field] ?? ''}
          onChange={(e) => onChange({ ...variant, [field]: e.target.value === '' ? null : Number(e.target.value) })}
          className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
        />
      </td>
    ))}
    <td className="px-2 py-1">
      <button onClick={onRemove} className="text-red-500 hover:text-red-700 p-1">
        <Trash2 size={14} />
      </button>
    </td>
  </tr>
);

const ProductCard = ({ product, authHeaders, onUpdated, onRemoved }) => {
  const [draft, setDraft] = useState(product);
  const [saving, setSaving] = useState(false);
  const [actioning, setActioning] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(product);

  useEffect(() => { setDraft(product); }, [product]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.productExtraction}/products/${product._id}`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name,
          brand: draft.brand,
          material: draft.material,
          description: draft.description,
          badges: draft.badges,
          variants: draft.variants,
          colors: draft.colors
        })
      });
      if (res.ok) {
        const data = await res.json();
        onUpdated(data);
      }
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action) => {
    setActioning(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.productExtraction}/products/${product._id}/${action}`, {
        method: 'POST',
        headers: authHeaders
      });
      if (res.ok) {
        const data = await res.json();
        onUpdated(data);
      }
    } catch (error) {
      console.error(`Error running ${action}:`, error);
    } finally {
      setActioning(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this extracted product? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API_ENDPOINTS.productExtraction}/products/${product._id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) onRemoved(product._id);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const setPrimary = async (imageId) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.productExtraction}/products/${product._id}/images/${imageId}/primary`, {
        method: 'POST',
        headers: authHeaders
      });
      if (res.ok) {
        const data = await res.json();
        onUpdated(data);
      }
    } catch (error) {
      console.error('Error setting primary image:', error);
    }
  };

  const primaryImage = draft.images.find(i => i.isPrimary) || draft.images[0];
  const confidence = draft.source?.confidence;
  const lowConfidence = typeof confidence === 'number' && confidence < 0.7;

  return (
    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white">
      <div className="flex flex-wrap gap-4 p-4">
        {/* Images */}
        <div className="w-full sm:w-48 shrink-0">
          <div className="aspect-square bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden mb-2">
            {primaryImage ? (
              <img src={getImageUrl(primaryImage.path)} alt={draft.name || 'product'} className="w-full h-full object-contain" />
            ) : (
              <ImageIcon className="text-gray-300" size={32} />
            )}
          </div>
          {draft.images.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {draft.images.map((img) => (
                <button
                  key={img._id}
                  onClick={() => setPrimary(img._id)}
                  className={`w-10 h-10 rounded-lg overflow-hidden border-2 ${img.isPrimary ? 'border-yellow-400' : 'border-gray-200'}`}
                  title="Set as primary image"
                >
                  <img src={getImageUrl(img.path)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <a
            href={getImageUrl(draft.source?.pageImage)}
            target="_blank"
            rel="noreferrer"
            className="block text-center text-xs text-blue-600 hover:underline mt-2"
          >
            View source page {draft.source?.pageNumber}
          </a>
        </div>

        {/* Fields */}
        <div className="flex-1 min-w-[240px] space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={draft.status} map={PRODUCT_STATUS_STYLES} />
              {lowConfidence && (
                <span className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                  <AlertTriangle size={12} /> Low confidence ({Math.round(confidence * 100)}%)
                </span>
              )}
              {draft.possibleDuplicateOf && (
                <span className="flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded-full">
                  <Copy size={12} /> Possible duplicate
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              value={draft.name ?? ''}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Product name"
              className="px-3 py-2 border border-gray-200 rounded-lg font-bold text-gray-900 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
            <input
              value={draft.brand ?? ''}
              onChange={(e) => setDraft({ ...draft, brand: e.target.value })}
              placeholder="Brand"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
            <input
              value={draft.material ?? ''}
              onChange={(e) => setDraft({ ...draft, material: e.target.value })}
              placeholder="Material"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>

          {draft.colors.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {draft.colors.map((c, i) => (
                <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {c.name || '—'}{c.code ? `: ${c.code}` : ''}
                </span>
              ))}
            </div>
          )}

          {/* Variants table */}
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['SKU', 'Description', 'Dimensions', 'Wt (kg)', 'Vol (L)', 'MRP', 'Selling', ''].map((h) => (
                    <th key={h} className="px-2 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {draft.variants.map((v, idx) => (
                  <VariantRow
                    key={idx}
                    variant={v}
                    onChange={(nv) => {
                      const variants = [...draft.variants];
                      variants[idx] = nv;
                      setDraft({ ...draft, variants });
                    }}
                    onRemove={() => {
                      setDraft({ ...draft, variants: draft.variants.filter((_, i) => i !== idx) });
                    }}
                  />
                ))}
              </tbody>
            </table>
            <button
              onClick={() => setDraft({
                ...draft,
                variants: [...draft.variants, { sku: '', description: '', dimensionsCm: '', weightKg: null, volumeLtr: null, mrp: null, sellingPrice: null }]
              })}
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 px-3 py-2"
            >
              <Plus size={14} /> Add variant row
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={save}
              disabled={!dirty || saving}
              className="flex items-center gap-1.5 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-900 disabled:opacity-40 transition-all"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              Save
            </button>
            <button
              onClick={() => runAction('approve')}
              disabled={actioning || draft.status === 'approved'}
              className="flex items-center gap-1.5 bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-200 disabled:opacity-40 transition-all"
            >
              <CheckCircle2 size={14} /> Approve
            </button>
            <button
              onClick={() => runAction('reject')}
              disabled={actioning || draft.status === 'rejected'}
              className="flex items-center gap-1.5 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-200 disabled:opacity-40 transition-all"
            >
              <XCircle size={14} /> Reject
            </button>
            <button
              onClick={remove}
              className="flex items-center gap-1.5 text-gray-400 hover:text-red-600 px-2 py-2 text-sm ml-auto"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReviewPanel = ({ job, authHeaders, onBack, onJobChanged }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [exporting, setExporting] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.productExtraction}/products?jobId=${job._id}`, { headers: authHeaders });
      if (res.ok) setProducts(await res.json());
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job._id]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = statusFilter === 'all' ? products : products.filter(p => p.status === statusFilter);

  const runExport = async (type) => {
    setExporting(type);
    try {
      const res = await fetch(`${API_ENDPOINTS.productExtraction}/export/${type}`, { headers: authHeaders });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'zip' ? 'catalog-export.zip' : type === 'csv' ? 'products.csv' : 'products.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting('');
    }
  };

  const retryFailed = async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.productExtraction}/jobs/${job._id}/retry`, {
        method: 'POST',
        headers: authHeaders
      });
      if (res.ok) onJobChanged();
    } catch (error) {
      console.error('Error retrying job:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900">
          <ChevronLeft size={16} /> Back to jobs
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {job.failedPages?.length > 0 && (
            <button
              onClick={retryFailed}
              className="flex items-center gap-1.5 bg-orange-100 text-orange-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-orange-200"
            >
              <RefreshCw size={14} /> Retry {job.failedPages.length} failed page{job.failedPages.length === 1 ? '' : 's'}
            </button>
          )}
          {['json', 'csv', 'zip'].map((type) => (
            <button
              key={type}
              onClick={() => runExport(type)}
              disabled={exporting === type}
              className="flex items-center gap-1.5 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
            >
              {exporting === type ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900">{job.originalName}</h2>
        <p className="text-sm text-gray-500">
          {job.totalPages} pages · {job.productsFound} products found · {job.imagesFound} images
          {job.skippedPages?.length > 0 && ` · ${job.skippedPages.length} non-product pages skipped`}
        </p>
      </div>

      {job.failedPages?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-800 mb-2">
            <AlertTriangle size={16} /> {job.failedPages.length} page{job.failedPages.length === 1 ? '' : 's'} failed to process
          </p>
          <ul className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
            {job.failedPages.slice(0, 10).map((f, i) => (
              <li key={i}>Page {f.page}: {f.error}</li>
            ))}
            {job.failedPages.length > 10 && (
              <li className="text-red-500">…and {job.failedPages.length - 10} more</li>
            )}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        {['all', 'pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold capitalize transition-all ${
              statusFilter === s ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No products in this filter yet{job.status === 'processing' ? ' — still processing…' : ''}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <ProductCard
              key={p._id}
              product={p}
              authHeaders={authHeaders}
              onUpdated={(updated) => setProducts(prev => prev.map(x => x._id === updated._id ? updated : x))}
              onRemoved={(id) => setProducts(prev => prev.filter(x => x._id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ProductExtractionTab = () => {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [reviewJob, setReviewJob] = useState(null);
  const fileInputRef = useRef(null);

  const token = localStorage.getItem('adminToken');
  const authHeaders = { Authorization: `Bearer ${token}` };

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.productExtraction}/jobs`, { headers: authHeaders });
      if (res.ok) setJobs(await res.json());
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const jobsRef = useRef([]);
  useEffect(() => { jobsRef.current = jobs; }, [jobs]);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(() => {
      const hasActive = jobsRef.current.some(j => j.status === 'uploaded' || j.status === 'processing');
      if (hasActive) fetchJobs();
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!reviewJob) return;
    const updated = jobs.find(j => j._id === reviewJob._id);
    if (updated) setReviewJob(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

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
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      const res = await fetch(`${API_ENDPOINTS.productExtraction}/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedFile(null);
        fetchJobs();
      } else {
        setUploadError(data.message || 'Failed to start extraction');
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      setUploadError('Error uploading PDF. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job and all its extracted products? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_ENDPOINTS.productExtraction}/jobs/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        setJobs(prev => prev.filter(j => j._id !== id));
        if (reviewJob?._id === id) setReviewJob(null);
      }
    } catch (error) {
      console.error('Error deleting job:', error);
    } finally {
      setDeletingId(null);
    }
  };

  if (reviewJob) {
    return (
      <ReviewPanel
        job={reviewJob}
        authHeaders={authHeaders}
        onBack={() => { setReviewJob(null); fetchJobs(); }}
        onJobChanged={fetchJobs}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PackageSearch className="w-6 h-6 text-yellow-500" />
            Product Extraction
          </h2>
          <p className="text-gray-600 mt-1">
            Upload a product catalog PDF. Each page is read by AI to pull out products, SKUs, prices, specs and photos for your review.
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
                <p className="font-semibold text-gray-700">Drag & drop a catalog PDF here, or click to browse</p>
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
                  Uploading…
                </>
              ) : (
                <>
                  <PackageSearch size={20} />
                  Start Extraction
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

      {/* Jobs list */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <h3 className="text-lg font-bold text-gray-900">Extraction Jobs</h3>
          <p className="text-sm text-gray-500 mt-1">Track progress and review extracted products</p>
        </div>

        <div className="p-6">
          {loadingJobs ? (
            <div className="text-center py-8 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No catalogs uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {jobs.map((job) => (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-2 border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 truncate" title={job.originalName}>{job.originalName}</p>
                          <StatusBadge status={job.status} map={STATUS_STYLES} />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(job.createdAt).toLocaleString()} · {formatSize(job.fileSize)}
                          {job.status === 'completed' && ` · ${job.productsFound} products · ${job.imagesFound} images`}
                        </p>
                        {job.errorMessage && (
                          <p className="text-xs text-red-600 mt-1">
                            {job.errorMessage}
                            {job.failedPages?.[0]?.error && ` — ${job.failedPages[0].error}`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setReviewJob(job)}
                          disabled={job.status === 'uploaded'}
                          className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-200 disabled:opacity-40 transition-all"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleDelete(job._id)}
                          disabled={deletingId === job._id}
                          className="flex items-center justify-center bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-all"
                        >
                          {deletingId === job._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </div>
                    {(job.status === 'processing' || job.status === 'uploaded') && (
                      <div className="mt-3">
                        <JobProgressBar job={job} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductExtractionTab;
