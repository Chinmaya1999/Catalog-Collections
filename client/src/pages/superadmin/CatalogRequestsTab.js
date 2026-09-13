import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Phone, Search, Inbox, Trash2, Save, X } from 'lucide-react';
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
  const [editingRequest, setEditingRequest] = useState(null);
  const [editStatus, setEditStatus] = useState('pending');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

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
        r.name?.toLowerCase().includes(q) ||
        r.phoneNumber?.toLowerCase().includes(q) ||
        r.message?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [requests, filter, search]);

  const updateRequest = async (requestId, payload) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_ENDPOINTS.catalogRequest}/${requestId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Request update failed');
      setRequests(current => current.map(request => request._id === requestId ? data.catalogRequest : request));
      setEditingRequest(null);
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteRequest = async (request) => {
    if (!window.confirm(`Delete the request from ${request.name || 'this customer'}?`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_ENDPOINTS.catalogRequest}/${request._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Request could not be deleted');
      setRequests(current => current.map(item => item._id === request._id ? { ...item, isDeleted: true, deletedAt: new Date().toISOString() } : item));
    } catch (error) {
      alert(error.message);
    }
  };

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
              placeholder="Search name, phone, or request…"
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
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Phone</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Customer Message</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Admin Notes</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Requested</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Deleted</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredRequests.map((request) => (
                  <tr key={request._id} className={request.isDeleted ? 'bg-red-50/40' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">{request.name || '—'}</td>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingRequest(request); setEditStatus(request.status || 'pending'); setEditNotes(request.notes || ''); }}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-200"
                        >
                          <Save size={14} /> Update
                        </button>
                        {!request.isDeleted && <button onClick={() => deleteRequest(request)} className="rounded-lg bg-red-100 px-3 py-2 text-red-700 hover:bg-red-200" aria-label="Delete request"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between"><h3 className="text-xl font-bold text-gray-900">Update Catalog Request</h3><button onClick={() => setEditingRequest(null)} aria-label="Close"><X className="h-5 w-5" /></button></div>
            <p className="mb-4 text-sm text-gray-600"><strong>{editingRequest.name || 'Customer'}</strong>: {editingRequest.message}</p>
            <label className="block text-sm font-semibold text-gray-700">Status<select value={editStatus} onChange={event => setEditStatus(event.target.value)} className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3"><option value="pending">Pending</option><option value="contacted">Contacted</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
            <label className="mt-4 block text-sm font-semibold text-gray-700">Admin Notes<textarea value={editNotes} onChange={event => setEditNotes(event.target.value)} rows="4" className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3" placeholder="Add follow-up notes..." /></label>
            <div className="mt-5 flex gap-3"><button onClick={() => setEditingRequest(null)} className="flex-1 rounded-xl bg-gray-100 px-4 py-3 font-bold">Cancel</button><button disabled={saving} onClick={() => updateRequest(editingRequest._id, { status: editStatus, notes: editNotes })} className="flex-1 rounded-xl bg-yellow-400 px-4 py-3 font-bold disabled:opacity-60">{saving ? 'Saving...' : 'Save Update'}</button></div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CatalogRequestsTab;
