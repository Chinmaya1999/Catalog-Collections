import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Plus, 
  Edit, 
  Trash2, 
  Box, 
  FolderOpen,
  Upload,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [catalogs, setCatalogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    categoryName: '',
    type: 'product',
    comboCount: 0,
    driveLink: '',
    pdfFile: '',
    image: '',
    featured: false,
    new: false,
    ecoFriendly: false,
    products: []
  });

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    // If superadmin, redirect to superadmin dashboard
    const info = localStorage.getItem('adminInfo');
    if (info) {
      try {
        const admin = JSON.parse(info);
        if (admin.role === 'superadmin') {
          navigate('/superadmin/dashboard');
          return;
        }
      } catch (err) {
        // ignore parse errors
      }
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Fetch catalogs
      const catalogsRes = await fetch('http://localhost:5002/api/catalog');
      const catalogsData = await catalogsRes.json();
      setCatalogs(catalogsData);

      // Fetch categories
      const categoriesRes = await fetch('http://localhost:5002/api/category');
      const categoriesData = await categoriesRes.json();
      setCategories(categoriesData);

      // Fetch dashboard stats
      const statsRes = await fetch('http://localhost:5002/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCatalog = () => {
    setEditingCatalog(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      categoryName: '',
      type: 'product',
      comboCount: 0,
      driveLink: '',
      pdfFile: '',
      image: '',
      featured: false,
      new: false,
      ecoFriendly: false,
      products: []
    });
    setShowModal(true);
  };

  const handleEditCatalog = (catalog) => {
    setEditingCatalog(catalog);
    setFormData({
      name: catalog.name,
      description: catalog.description,
      category: catalog.category,
      categoryName: catalog.categoryName,
      type: catalog.type,
      comboCount: catalog.comboCount,
      driveLink: catalog.driveLink,
      pdfFile: catalog.pdfFile || '',
      image: catalog.image,
      featured: catalog.featured,
      new: catalog.new,
      ecoFriendly: catalog.ecoFriendly,
      products: catalog.products || []
    });
    setShowModal(true);
  };

  const handleDeleteCatalog = async (id) => {
    if (!window.confirm('Are you sure you want to delete this catalog?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5002/api/catalog/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setCatalogs(catalogs.filter(c => c._id !== id));
      }
    } catch (error) {
      console.error('Error deleting catalog:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('http://localhost:5002/api/catalog/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setFormData(prev => ({ ...prev, image: data.imagePath }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('http://localhost:5002/api/catalog/pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setFormData(prev => ({ ...prev, pdfFile: data.pdfPath }));
      } else {
        console.error('PDF upload failed:', data.message);
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('adminToken');
      const url = editingCatalog 
        ? `http://localhost:5002/api/catalog/${editingCatalog._id}`
        : 'http://localhost:5002/api/catalog';
      
      const method = editingCatalog ? 'PUT' : 'POST';

      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'products') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (key !== 'order' && key !== 'pdfFile' && key !== 'image') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add image path (from upload or existing)
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      // Add PDF file path (from upload or existing)
      if (formData.pdfFile) {
        formDataToSend.append('pdfFile', formData.pdfFile);
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        setShowModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error saving catalog:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-dark">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your catalogs and categories</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'dashboard' ? 'bg-brand-yellow text-brand-dark' : 'bg-white text-gray-600 hover:bg-gray-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('catalogs')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'catalogs' ? 'bg-brand-yellow text-brand-dark' : 'bg-white text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Box className="w-5 h-5" />
            Catalogs
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'categories' ? 'bg-brand-yellow text-brand-dark' : 'bg-white text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FolderOpen className="w-5 h-5" />
            Categories
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Catalogs</p>
                  <p className="text-3xl font-bold text-brand-dark">{stats.statistics.totalCatalogs}</p>
                </div>
                <Box className="w-12 h-12 text-brand-yellow" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Categories</p>
                  <p className="text-3xl font-bold text-brand-dark">{stats.statistics.totalCategories}</p>
                </div>
                <FolderOpen className="w-12 h-12 text-brand-yellow" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Featured</p>
                  <p className="text-3xl font-bold text-brand-dark">{stats.statistics.featuredCatalogs}</p>
                </div>
                <FileText className="w-12 h-12 text-brand-yellow" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">New Items</p>
                  <p className="text-3xl font-bold text-brand-dark">{stats.statistics.newCatalogs}</p>
                </div>
                <Upload className="w-12 h-12 text-brand-yellow" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Catalogs Tab */}
        {activeTab === 'catalogs' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-brand-dark">Manage Catalogs</h2>
              <button
                onClick={handleAddCatalog}
                className="flex items-center gap-2 bg-brand-yellow text-brand-dark px-6 py-3 rounded-lg font-semibold hover:bg-brand-gold transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Catalog
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Image</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {catalogs.map((catalog) => (
                    <tr key={catalog._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <img 
                          src={`http://localhost:5002${catalog.image}`} 
                          alt={catalog.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{catalog.name}</td>
                      <td className="px-6 py-4 text-gray-600">{catalog.categoryName}</td>
                      <td className="px-6 py-4 text-gray-600 capitalize">{catalog.type}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {catalog.featured && (
                            <span className="px-2 py-1 bg-brand-yellow text-brand-dark text-xs rounded-full">Featured</span>
                          )}
                          {catalog.new && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">New</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditCatalog(catalog)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCatalog(catalog._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-brand-dark mb-6">Manage Categories</h2>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-gray-600">Category management coming soon...</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div key={category._id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <h3 className="font-semibold text-brand-dark">{category.name}</h3>
                        <p className="text-sm text-gray-600">{category.slug}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-brand-dark mb-6">
              {editingCatalog ? 'Edit Catalog' : 'Add New Catalog'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catalog Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows="3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const selectedCategory = categories.find(c => c._id === e.target.value);
                    setFormData({ 
                      ...formData, 
                      category: e.target.value,
                      categoryName: selectedCategory ? selectedCategory.name : ''
                    });
                  }}
                  className="input-field"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input-field"
                >
                  <option value="product">Product</option>
                  <option value="combo">Combo</option>
                  <option value="eco-friendly">Eco-Friendly</option>
                </select>
              </div>

              {formData.type === 'combo' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Combo Count
                  </label>
                  <input
                    type="number"
                    value={formData.comboCount}
                    onChange={(e) => setFormData({ ...formData, comboCount: parseInt(e.target.value) })}
                    className="input-field"
                    min="1"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catalog Image
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    id="imageInput"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="input-field"
                  />
                  {formData.image && (
                    <img 
                      src={`http://localhost:5002${formData.image}`} 
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catalog PDF (Optional - Upload or Drive Link)
                </label>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Option 1: Upload PDF</label>
                    <input
                      type="file"
                      id="pdfInput"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      className="input-field"
                    />
                    {formData.pdfFile && (
                      <div className="mt-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">PDF uploaded successfully</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t pt-4">
                    <label className="block text-sm text-gray-600 mb-1">Option 2: Drive Link</label>
                    <input
                      type="url"
                      value={formData.driveLink}
                      onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                      className="input-field"
                      placeholder="https://drive.google.com/file/d/..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Featured</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.new}
                    onChange={(e) => setFormData({ ...formData, new: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">New</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.ecoFriendly}
                    onChange={(e) => setFormData({ ...formData, ecoFriendly: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Eco-Friendly</span>
                </label>
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-brand-yellow text-brand-dark rounded-lg font-semibold hover:bg-brand-gold transition-all"
                >
                  {editingCatalog ? 'Update' : 'Create'} Catalog
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
