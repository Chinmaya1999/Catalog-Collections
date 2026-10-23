import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Search, Trash2, Upload, Zap } from 'lucide-react';
import { API_ENDPOINTS, getImageUrl } from '../../config/api';

const PAGE_SIZE = 50;
const money = (value) => (
  typeof value === 'number' ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—'
);
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

const readResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  if (response.status === 404) {
    throw new Error('The Shop Price List API is not deployed on the server yet. Deploy the latest backend, then try again.');
  }
  const message = await response.text();
  throw new Error(message || `Server request failed (${response.status})`);
};

const ShopPriceImportSection = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [files, setFiles] = useState([]);
  const [publishingFileId, setPublishingFileId] = useState('');
  const [revertingFileId, setRevertingFileId] = useState('');
  const fileInputRef = useRef(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search.trim()) params.set('search', search.trim());
      const response = await fetch(`${API_ENDPOINTS.shopPriceImport}/items?${params}`, {
        headers: authHeaders()
      });
      const data = await readResponse(response);
      if (!response.ok) throw new Error(data.message || 'Could not load imported price list');
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (fetchError) {
      console.error('Error fetching imported Shop Price List items:', fetchError);
      setError(fetchError.message || 'Could not load imported price list');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchFiles = useCallback(async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.shopPriceImport}/files`, {
        headers: authHeaders()
      });
      const data = await readResponse(response);
      if (!response.ok) throw new Error(data.message || 'Could not load uploaded PDFs');
      setFiles(data.files || []);
    } catch (fetchError) {
      console.error('Error fetching imported Shop Price List files:', fetchError);
      setError(fetchError.message || 'Could not load uploaded PDFs');
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchFiles();
  }, [fetchItems, fetchFiles, refresh]);

  const uploadPdf = async (event) => {
    event.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Choose a PDF file to upload.');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files can be uploaded.');
      return;
    }

    setUploading(true);
    setError('');
    setNotice('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_ENDPOINTS.shopPriceImport}/upload`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData
      });
      const data = await readResponse(response);
      if (!response.ok) throw new Error(data.message || 'PDF import failed');
      const warnings = data.warnings?.length ? ` ${data.warnings.join(' ')}` : '';
      setNotice(`${data.imported} items imported from ${data.fileName}. Our price is the PDF price plus 70%.${warnings}`);
      fileInputRef.current.value = '';
      setPage(1);
      setRefresh((value) => value + 1);
    } catch (uploadError) {
      console.error('Error uploading Shop Price List PDF:', uploadError);
      setError(uploadError.message || 'PDF import failed');
    } finally {
      setUploading(false);
    }
  };

  const revertImport = async (file) => {
    if (!window.confirm(
      `Revert "${file.originalName}"? This removes its ${file.itemCount} imported rows, extracted pictures, and products published from this PDF.`
    )) return;

    setRevertingFileId(file._id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`${API_ENDPOINTS.shopPriceImport}/files/${file._id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await readResponse(response);
      if (!response.ok) throw new Error(data.message || 'Could not revert this PDF import');
      setNotice(
        `${data.fileName} reverted. ${data.deletedItems} imported rows and ${data.unpublishedProducts || 0} published products removed.`
      );
      setRefresh((value) => value + 1);
    } catch (revertError) {
      console.error('Error reverting Shop Price List PDF import:', revertError);
      setError(revertError.message || 'Could not revert this PDF import');
    } finally {
      setRevertingFileId('');
    }
  };

  const publishImport = async (file) => {
    if (!window.confirm(
      `Make ${file.itemCount} products from "${file.originalName}" visible on the public Shop page?`
    )) return;

    setPublishingFileId(file._id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`${API_ENDPOINTS.shopPriceImport}/files/${file._id}/publish`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await readResponse(response);
      if (!response.ok) throw new Error(data.message || 'Could not publish these products');
      setNotice(`${data.published} products from ${data.fileName} are now live in the Shop.`);
      setRefresh((value) => value + 1);
    } catch (publishError) {
      console.error('Error publishing Shop Price List products:', publishError);
      setError(publishError.message || 'Could not publish these products');
    } finally {
      setPublishingFileId('');
    }
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Import PDF price list</h2>
          <p className="mt-1 text-sm text-gray-500">
            Imported rows are kept separate from shop products. Our price is the PDF price plus a 70% increase.
          </p>
        </div>
        <form onSubmit={uploadPdf} className="flex flex-col gap-2 sm:flex-row">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="max-w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-semibold"
            aria-label="Choose a price list PDF"
          />
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? 'Importing…' : 'Upload PDF'}
          </button>
        </form>
      </div>

      {notice && <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {files.length > 0 && (
        <div className="space-y-2 rounded-xl border border-gray-200 p-3">
          <h3 className="text-sm font-semibold text-gray-800">Uploaded PDFs — publish or revert</h3>
          {files.map((file) => (
            <div key={file._id} className="flex flex-col gap-2 rounded-lg bg-gray-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">{file.originalName}</p>
                <p className="text-xs text-gray-500">
                  {file.itemCount} items · {new Date(file.createdAt).toLocaleString()}
                  {file.isLive ? ` · ${file.publishedProductIds?.length || file.itemCount} live` : ' · Draft'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  disabled={file.isLive || Boolean(publishingFileId) || Boolean(revertingFileId)}
                  onClick={() => publishImport(file)}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {publishingFileId === file._id
                    ? <Loader2 size={15} className="animate-spin" />
                    : <Zap size={15} />}
                  {file.isLive ? 'Products live' : 'Make products live'}
                </button>
                <button
                  type="button"
                  disabled={Boolean(publishingFileId) || Boolean(revertingFileId)}
                  onClick={() => revertImport(file)}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {revertingFileId === file._id
                    ? <Loader2 size={15} className="animate-spin" />
                    : <Trash2 size={15} />}
                  Revert import
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Search type, model or HSN"
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
        <span className="text-sm text-gray-500">{total.toLocaleString('en-IN')} imported items</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Type of item</th>
              <th className="px-4 py-3 font-semibold">Picture</th>
              <th className="px-4 py-3 font-semibold">Model Name/No.</th>
              <th className="px-4 py-3 font-semibold">Unique SKU</th>
              <th className="px-4 py-3 text-right font-semibold">PDF price</th>
              <th className="px-4 py-3 text-right font-semibold">Our price (+70%)</th>
              <th className="px-4 py-3 font-semibold">HSN Code</th>
              <th className="px-4 py-3 text-right font-semibold">GST%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></td></tr>
            ) : items.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{item.itemType || '—'}</td>
                <td className="px-4 py-2">
                  {item.picture ? (
                    <img src={getImageUrl(item.picture)} alt={item.modelName} className="h-12 w-12 rounded-lg border border-gray-100 object-contain" />
                  ) : <span className="text-xs text-gray-400">No matched picture</span>}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{item.modelName}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{item.skuCode || 'Assigned when published'}</td>
                <td className="px-4 py-3 text-right text-gray-600">{money(item.pdfPrice)}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">{money(item.ourPrice)}</td>
                <td className="px-4 py-3 text-gray-600">{item.hsnCode || '—'}</td>
                <td className="px-4 py-3 text-right text-gray-600">{item.gstPercent == null ? '—' : `${item.gstPercent}%`}</td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No imported items found. Upload a text-based PDF price list to get started.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-lg border border-gray-200 p-2 disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600">Page {page} of {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-gray-200 p-2 disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
};

export default ShopPriceImportSection;
