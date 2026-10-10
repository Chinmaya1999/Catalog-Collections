import React, { useEffect, useMemo, useState } from 'react';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_ENDPOINTS, getImageUrl } from '../../config/api';

const PAGE_SIZE = 50;

const money = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—');
const primaryImage = (p) => (p.images?.find((i) => i.isPrimary) || p.images?.[0])?.path || null;

// Every published Shop product with its supplier cost and current shop price.
const ShopPriceListTab = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`${API_ENDPOINTS.products}/admin/catalog`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load shop products'))))
      .then((d) => setProducts(d.products || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.categoryName).filter(Boolean))].sort(),
    [products]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category && p.categoryName !== category) return false;
      if (!q) return true;
      const skus = (p.variants || []).map((v) => v.sku).join(' ');
      return `${p.name || ''} ${p.brand || ''} ${skus}`.toLowerCase().includes(q);
    });
  }, [products, search, category]);

  useEffect(() => { setPage(1); }, [search, category]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  if (error) return <div className="bg-red-50 text-red-700 rounded-xl p-4">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product, brand or SKU"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"
        >
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <p className="text-sm text-gray-500">{filtered.length.toLocaleString('en-IN')} products</p>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">SKU</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold text-right">Cost</th>
              <th className="px-4 py-3 font-semibold text-right">Shop price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((p) => {
              const img = primaryImage(p);
              return (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        {img && <img src={getImageUrl(img)} alt="" className="w-full h-full object-contain" loading="lazy" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate max-w-xs">{p.name || '—'}</div>
                        <div className="text-xs text-gray-400">{p.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{p.variants?.[0]?.sku || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-600">{p.categoryName || '—'}</td>
                  <td className="px-4 py-2.5 text-right text-gray-500">{money(p.supplierCost)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-900">{money(p.priceFrom)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No products found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-2 rounded-lg border border-gray-200 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-gray-600">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="p-2 rounded-lg border border-gray-200 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
};

export default ShopPriceListTab;
