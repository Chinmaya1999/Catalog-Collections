import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Loader2, Megaphone, CheckCircle2, Circle, X } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';
import FestiveOfferCard, { THEME_META } from '../../components/FestiveOfferCard';

const EMPTY_FORM = {
  title: '',
  message: '',
  discountPercent: 0,
  theme: 'confetti',
  ctaText: 'Shop Now',
  ctaLink: '/catalog',
  isActive: false,
  startDate: '',
  endDate: ''
};

const toDatetimeLocalValue = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const AnnouncementsTab = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(API_ENDPOINTS.announcement, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAnnouncements(await res.json());
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (announcement) => {
    setEditingId(announcement._id);
    setForm({
      title: announcement.title || '',
      message: announcement.message || '',
      discountPercent: announcement.discountPercent || 0,
      theme: announcement.theme || 'confetti',
      ctaText: announcement.ctaText || 'Shop Now',
      ctaLink: announcement.ctaLink || '/catalog',
      isActive: !!announcement.isActive,
      startDate: toDatetimeLocalValue(announcement.startDate),
      endDate: toDatetimeLocalValue(announcement.endDate)
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingId ? `${API_ENDPOINTS.announcement}/${editingId}` : API_ENDPOINTS.announcement;
      const method = editingId ? 'PUT' : 'POST';

      const payload = {
        ...form,
        discountPercent: Number(form.discountPercent) || 0,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        closeForm();
        fetchAnnouncements();
      } else {
        alert(`Error: ${data.message || 'Failed to save announcement'}`);
      }
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Error saving announcement. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_ENDPOINTS.announcement}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const handleToggleActive = async (announcement) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_ENDPOINTS.announcement}/${announcement._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !announcement.isActive })
      });
      if (res.ok) {
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error toggling announcement:', error);
    }
  };

  const previewAnnouncement = {
    ...form,
    _id: 'preview',
    discountPercent: Number(form.discountPercent) || 0
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b flex justify-between items-center flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Announcements &amp; Festival Offers</h2>
            <p className="text-gray-600 mt-1">
              Create a discount or festival offer with an animated banner — the live one shows to every visitor on the site.
            </p>
          </div>
          {!showForm && (
            <button
              onClick={openCreateForm}
              className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-6 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-lg"
            >
              <Plus size={20} />
              New Announcement
            </button>
          )}
        </div>

        {showForm && (
          <div className="p-6 border-b border-gray-100 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg">
                  {editingId ? 'Edit Announcement' : 'New Announcement'}
                </h3>
                <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Diwali Dhamaka Sale!"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Message *</label>
                <textarea
                  required
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Celebrate the festival with flat discounts on every catalog. Limited time only!"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Animation Theme</label>
                  <select
                    value={form.theme}
                    onChange={(e) => setForm({ ...form, theme: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  >
                    {Object.entries(THEME_META).map(([value, meta]) => (
                      <option key={value} value={value}>
                        {meta.emoji} {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={form.ctaText}
                    onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Button Link</label>
                  <input
                    type="text"
                    value={form.ctaLink}
                    onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                    placeholder="/catalog"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Starts <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Ends <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="mt-1 w-4 h-4"
                />
                <span className="text-sm text-gray-800">
                  <span className="font-bold">Make this the live offer.</span>{' '}
                  It will pop up for every visitor on the site (within the start/end window above, if set). Activating this
                  automatically turns off any other active announcement.
                </span>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-6 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-lg disabled:opacity-50"
              >
                {saving && <Loader2 size={18} className="animate-spin" />}
                {editingId ? 'Save Changes' : 'Create Announcement'}
              </button>
            </form>

            {/* Live preview */}
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-3">Live Preview</h3>
              <p className="text-sm text-gray-500 mb-4">Exactly what visitors will see, animation included.</p>
              <FestiveOfferCard announcement={previewAnnouncement} />
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center">
            <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No announcements yet</p>
            <p className="text-gray-400 text-sm mt-1">Create one to run a festival sale or promo banner.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {announcements.map((announcement) => {
              const meta = THEME_META[announcement.theme] || THEME_META.confetti;
              return (
                <div key={announcement._id} className="p-5 flex items-center gap-4 flex-wrap">
                  <button
                    onClick={() => handleToggleActive(announcement)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      announcement.isActive
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    title={announcement.isActive ? 'Click to deactivate' : 'Click to make this live'}
                  >
                    {announcement.isActive ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                    {announcement.isActive ? 'Live' : 'Inactive'}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {meta.emoji} {announcement.title}
                      {announcement.discountPercent > 0 && (
                        <span className="ml-2 text-sm font-semibold text-brand-gold">
                          {announcement.discountPercent}% off
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{announcement.message}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditForm(announcement)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement._id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AnnouncementsTab;
