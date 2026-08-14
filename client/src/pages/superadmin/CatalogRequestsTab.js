import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Phone, Search, Inbox, Trash2 } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  contacted: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'deleted', label: 'Deleted' }
];

const CatalogRequestsTab = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${API_ENDPOINTS.catalogRequest}/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setRequests(await res.json());
        }
      } catch (error) {
        console.error('Error fetching catalog requests:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    let list = requests;
    if (filter === 'active') list = list.filter(r => !r.isDeleted);
    if (filter === 'deleted') list = list.filter(r => r.isDeleted);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(r =>
        r.catalogCode?.toLowerCase().includes(q) ||
        r.catalogNumber?.toLowerCase().includes(q) ||
        r.phoneNumber?.toLowerCase().includes(q) ||
        r.message?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [requests, filter, search]);

  const activeCount = requests.filter(r => !r.isDeleted).length;
  const deletedCount = requests.filter(r => r.isDeleted).length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
          <p className="text-sm text-gray-500 font-medium">Total Requests</p>
          <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
          <p className="text-sm text-gray-500 font-medium">Active</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
          <p className="text-sm text-gray-500 font-medium">Deleted by Admin</p>
          <p className="text-2xl font-bold text-red-600">{deletedCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Catalog Requests</h2>
          <p className="text-gray-600 mt-1">
            Every catalog request ever submitted, including ones admins have deleted from their own list — full requester data is preserved here.
          </p>
        </div>

        <div className="p-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100">
          <div className="flex gap-2">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  filter === f.id ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, number, or phone…"
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No catalog requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Catalog Code</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Catalog Number</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Phone</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Customer Message</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Admin Notes</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Requested</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Deleted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredRequests.map((request) => (
                  <tr key={request._id} className={request.isDeleted ? 'bg-red-50/40' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">{request.catalogCode}</td>
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{request.catalogNumber}</td>
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                      <a href={`tel:${request.phoneNumber}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                        <Phone size={14} />
                        {request.phoneNumber}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${STATUS_STYLES[request.status] || 'bg-gray-100 text-gray-700'}`}>
                        {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={request.message}>
                      {request.message || '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={request.notes}>
                      {request.notes || '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {request.isDeleted ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-red-700">
                          <Trash2 size={14} />
                          {request.deletedAt ? new Date(request.deletedAt).toLocaleDateString() : 'Deleted'}
                          {request.deletedBy?.username ? ` by ${request.deletedBy.username}` : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CatalogRequestsTab;
