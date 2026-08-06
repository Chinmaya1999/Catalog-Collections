import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Search, 
  MapPin, 
  Phone, 
  DollarSign,
  Package,
  ChevronDown,
  ChevronUp,
  FileText,
  X,
  Navigation,
  Image as ImageIcon
} from 'lucide-react';
import PDFViewer from '../components/PDFViewer';

const SuperadminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('catalogs');
  const [catalogs, setCatalogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [productCodes, setProductCodes] = useState([]);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState(null);
  const [editingVendor, setEditingVendor] = useState(null);
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [expandedCatalog, setExpandedCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [extractedProducts, setExtractedProducts] = useState([]);
  
  // PDF viewer state
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [currentPDF, setCurrentPDF] = useState(null);
  const [currentProductPage, setCurrentProductPage] = useState(1);

  const [catalogFormData, setCatalogFormData] = useState({
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

  const [vendorFormData, setVendorFormData] = useState({
    name: '',
    phone: '',
    address: '',
    location: { type: 'Point', coordinates: [0, 0] },
    googleMapsLink: '',
    locationPincode: '',
    city: '',
    state: '',
    pincode: '',
    catalogId: '',
    productCode: '',
    price: '',
    transportCharges: '0'
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const info = localStorage.getItem('adminInfo');
    if (!token || !info) {
      navigate('/admin/login');
      return;
    }

    try {
      const admin = JSON.parse(info);
      if (admin.role !== 'superadmin') {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      navigate('/admin/login');
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

      // Fetch product codes
      const codesRes = await fetch('http://localhost:5002/api/vendor/product-codes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (codesRes.ok) {
        const codesData = await codesRes.json();
        setProductCodes(codesData);
      }

      // Fetch all vendors
      const vendorsRes = await fetch('http://localhost:5002/api/vendor/catalog/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (vendorsRes.ok) {
        const vendorsData = await vendorsRes.json();
        setVendors(vendorsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCatalog = () => {
    setEditingCatalog(null);
    setCatalogFormData({
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
    setExtractedProducts([]);
    setShowCatalogModal(true);
  };

  const handleEditCatalog = (catalog) => {
    setEditingCatalog(catalog);
    setCatalogFormData({
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
    setExtractedProducts(catalog.products || []);
    setShowCatalogModal(true);
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
        setCatalogFormData(prev => ({ ...prev, image: data.imagePath }));
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
        setCatalogFormData(prev => ({ ...prev, pdfFile: data.pdfPath }));
        
        // Use extracted products from server
        if (data.extractedProducts && data.extractedProducts.length > 0) {
          setExtractedProducts(data.extractedProducts);
          setCatalogFormData(prev => ({ ...prev, products: data.extractedProducts }));
        }
      } else {
        console.error('PDF upload failed:', data.message);
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
    }
  };

  const handleCatalogSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('adminToken');
      const url = editingCatalog 
        ? `http://localhost:5002/api/catalog/${editingCatalog._id}`
        : 'http://localhost:5002/api/catalog';
      
      const method = editingCatalog ? 'PUT' : 'POST';

      const formDataToSend = new FormData();
      Object.keys(catalogFormData).forEach(key => {
        if (key === 'products') {
          formDataToSend.append(key, JSON.stringify(catalogFormData[key]));
        } else if (key !== 'pdfFile' && key !== 'image') {
          formDataToSend.append(key, catalogFormData[key]);
        }
      });

      // Add image path (from upload or existing)
      if (catalogFormData.image) {
        formDataToSend.append('image', catalogFormData.image);
      }

      // Add PDF file path (from upload or existing)
      if (catalogFormData.pdfFile) {
        formDataToSend.append('pdfFile', catalogFormData.pdfFile);
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        setShowCatalogModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error saving catalog:', error);
    }
  };

  const handleAddVendor = (catalog) => {
    setSelectedCatalog(catalog);
    setEditingVendor(null);
    setVendorFormData({
      name: '',
      phone: '',
      address: '',
      location: { type: 'Point', coordinates: [0, 0] },
      googleMapsLink: '',
      locationPincode: '',
      city: '',
      state: '',
      pincode: '',
      catalogId: catalog._id,
      productCode: '',
      price: '',
      transportCharges: '0'
    });
    setShowVendorModal(true);
  };

  const handleEditVendor = (vendor) => {
    setEditingVendor(vendor);
    setVendorFormData({
      name: vendor.name,
      phone: vendor.phone,
      address: vendor.address,
      location: vendor.location,
      googleMapsLink: vendor.googleMapsLink || '',
      locationPincode: vendor.locationPincode || '',
      city: vendor.city,
      state: vendor.state,
      pincode: vendor.pincode,
      catalogId: vendor.catalogId,
      productCode: vendor.productCode,
      price: vendor.price,
      transportCharges: vendor.transportCharges
    });
    setShowVendorModal(true);
  };

  const handleDeleteVendor = async (vendorId) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5002/api/vendor/${vendorId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setVendors(vendors.filter(v => v._id !== vendorId));
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
    }
  };

  const handleVendorSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('adminToken');
      const url = editingVendor 
        ? `http://localhost:5002/api/vendor/${editingVendor._id}`
        : 'http://localhost:5002/api/vendor';
      
      const method = editingVendor ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(vendorFormData)
      });

      if (response.ok) {
        setShowVendorModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error saving vendor:', error);
    }
  };

  const handleGetVendorLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setVendorFormData({
            ...vendorFormData,
            location: {
              type: 'Point',
              coordinates: [position.coords.longitude, position.coords.latitude]
            }
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enter it manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleGoogleMapsLink = async (e) => {
    const link = e.target.value;
    setVendorFormData({ ...vendorFormData, googleMapsLink: link });

    // Parse Google Maps link to extract coordinates
    if (link && (link.includes('maps.app.goo.gl') || link.includes('google.com/maps'))) {
      try {
        // For shortened links, we need to resolve them first
        let resolvedLink = link;
        if (link.includes('maps.app.goo.gl')) {
          // In production, you'd need a backend service to resolve shortened URLs
          // For now, we'll alert the user
          alert('Please use the full Google Maps URL with coordinates for automatic location detection.');
          return;
        }

        // Extract coordinates from Google Maps URL
        const coordsMatch = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (coordsMatch) {
          const lat = parseFloat(coordsMatch[1]);
          const lng = parseFloat(coordsMatch[2]);
          setVendorFormData({
            ...vendorFormData,
            location: {
              type: 'Point',
              coordinates: [lng, lat]
            }
          });
        }
      } catch (error) {
        console.error('Error parsing Google Maps link:', error);
      }
    }
  };

  const handlePincodeLocation = async (pincode) => {
    setVendorFormData({ ...vendorFormData, locationPincode: pincode });

    if (pincode && pincode.length === 6) {
      try {
        // Use a geocoding API to get coordinates from pincode
        // This is a placeholder - in production, use Google Maps Geocoding API or similar
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();
        
        if (data[0].Status === 'Success') {
          const location = data[0].PostOffice[0];
          setVendorFormData({
            ...vendorFormData,
            city: location.District,
            state: location.State,
            location: {
              type: 'Point',
              coordinates: [parseFloat(location.Longitude || 0), parseFloat(location.Latitude || 0)]
            }
          });
        }
      } catch (error) {
        console.error('Error fetching location from pincode:', error);
      }
    }
  };

  const getVendorsForCatalog = (catalogId) => {
    return vendors.filter(v => v.catalogId === catalogId);
  };

  const handleViewProductPage = async (catalogId, productCode) => {
    try {
      const response = await fetch(`http://localhost:5002/api/catalog/product-page/${catalogId}/${productCode}`);
      const data = await response.json();
      
      if (response.ok) {
        setCurrentPDF(`http://localhost:5002${data.pdfFile}`);
        setCurrentProductPage(data.page);
        setShowPDFViewer(true);
      } else {
        console.error('Error fetching product page:', data.message);
        // Fallback: just open the PDF at page 1
        const catalog = catalogs.find(c => c._id === catalogId);
        if (catalog && catalog.pdfFile) {
          setCurrentPDF(`http://localhost:5002${catalog.pdfFile}`);
          setCurrentProductPage(1);
          setShowPDFViewer(true);
        }
      }
    } catch (error) {
      console.error('Error viewing product page:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Super Admin Dashboard</h1>
            <p className="text-gray-600">Manage catalogs and vendor information</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('adminToken');
              localStorage.removeItem('adminInfo');
              window.dispatchEvent(new Event('adminAuthChange'));
              navigate('/admin/login');
            }}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-all shadow-md"
          >
            Sign Out
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('catalogs')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-md ${
              activeTab === 'catalogs' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Package size={20} />
            Catalog Management
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-md ${
              activeTab === 'vendors' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MapPin size={20} />
            Vendor Management
          </button>
        </div>

        {/* Catalog Management Tab */}
        {activeTab === 'catalogs' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Catalog Management</h2>
                  <p className="text-gray-600 mt-1">Create and manage product catalogs</p>
                </div>
                <button
                  onClick={handleAddCatalog}
                  className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-6 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-lg"
                >
                  <Plus size={20} />
                  Add Catalog
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {catalogs.map((catalog) => (
                  <motion.div
                    key={catalog._id}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
                  >
                    <div className="relative h-48">
                      <img 
                        src={`http://localhost:5002${catalog.image}`} 
                        alt={catalog.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 flex gap-2">
                        {catalog.featured && (
                          <span className="px-3 py-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full shadow-md">
                            Featured
                          </span>
                        )}
                        {catalog.new && (
                          <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-md">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{catalog.name}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{catalog.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                          {catalog.categoryName}
                        </span>
                        <span className="text-sm text-gray-500 capitalize">{catalog.type}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCatalog(catalog)}
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all"
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCatalog(catalog._id)}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Vendor Management Tab */}
        {activeTab === 'vendors' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <h2 className="text-2xl font-bold text-gray-900">Vendor Management</h2>
                <p className="text-gray-600 mt-1">Add and manage vendors for each catalog</p>
              </div>
              
              <div className="p-6 space-y-4">
                {catalogs.map(catalog => {
                  const catalogVendors = getVendorsForCatalog(catalog._id);
                  const isExpanded = expandedCatalog === catalog._id;
                  
                  return (
                    <div key={catalog._id} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                      <div 
                        className="p-4 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center cursor-pointer hover:from-gray-100 hover:to-gray-50 transition-all"
                        onClick={() => setExpandedCatalog(isExpanded ? null : catalog._id)}
                      >
                        <div className="flex items-center gap-4">
                          {catalog.image && (
                            <img 
                              src={`http://localhost:5002${catalog.image}`} 
                              alt={catalog.name}
                              className="w-16 h-16 object-cover rounded-xl shadow-sm"
                            />
                          )}
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">{catalog.name}</h3>
                            <p className="text-sm text-gray-600">{catalog.categoryName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-bold rounded-full">
                            {catalogVendors.length} vendors
                          </span>
                          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="p-6 bg-white">
                          <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold text-gray-900 text-lg">Vendors for this catalog</h4>
                            <button
                              onClick={() => handleAddVendor(catalog)}
                              className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-6 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-lg"
                            >
                              <Plus size={20} />
                              Add Vendor
                            </button>
                          </div>
                          
                          {catalogVendors.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl">
                              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-500 text-lg">No vendors added yet</p>
                              <p className="text-gray-400 mt-2">Click "Add Vendor" to get started</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {catalogVendors.map(vendor => (
                                <div key={vendor._id} className="border-2 border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-all">
                                  <div className="flex justify-between items-start mb-4">
                                    <div>
                                      <h5 className="font-bold text-gray-900 text-lg">{vendor.name}</h5>
                                      <p className="text-sm text-gray-600">{vendor.productCode}</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleEditVendor(vendor)}
                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                                      >
                                        <Edit size={18} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteVendor(vendor._id)}
                                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <Phone size={16} className="text-green-600" />
                                      <span className="font-medium">{vendor.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <MapPin size={16} className="text-blue-600" />
                                      <span>{vendor.address}, {vendor.city}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <DollarSign size={16} className="text-green-600" />
                                      <span className="font-bold text-green-700">₹{vendor.price}</span>
                                      {vendor.transportCharges > 0 && (
                                        <span className="text-gray-500">+ ₹{vendor.transportCharges} transport</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Catalog Modal */}
        {showCatalogModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingCatalog ? 'Edit Catalog' : 'Add New Catalog'}
                </h2>
                <button
                  onClick={() => setShowCatalogModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCatalogSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Catalog Name</label>
                    <input
                      type="text"
                      value={catalogFormData.name}
                      onChange={(e) => setCatalogFormData({ ...catalogFormData, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select
                      value={catalogFormData.category}
                      onChange={(e) => {
                        const selectedCategory = categories.find(cat => cat._id === e.target.value);
                        setCatalogFormData({ 
                          ...catalogFormData, 
                          category: e.target.value,
                          categoryName: selectedCategory ? selectedCategory.name : ''
                        });
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={catalogFormData.description}
                    onChange={(e) => setCatalogFormData({ ...catalogFormData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    rows="3"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                    <select
                      value={catalogFormData.type}
                      onChange={(e) => setCatalogFormData({ ...catalogFormData, type: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    >
                      <option value="product">Product</option>
                      <option value="combo">Combo</option>
                    </select>
                  </div>
                  {catalogFormData.type === 'combo' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Combo Count</label>
                      <input
                        type="number"
                        value={catalogFormData.comboCount}
                        onChange={(e) => setCatalogFormData({ ...catalogFormData, comboCount: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Drive Link</label>
                  <input
                    type="url"
                    value={catalogFormData.driveLink}
                    onChange={(e) => setCatalogFormData({ ...catalogFormData, driveLink: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Catalog Image</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      />
                      {catalogFormData.image && (
                        <img 
                          src={`http://localhost:5002${catalogFormData.image}`} 
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded-xl"
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Catalog PDF</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handlePdfUpload}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      />
                      {catalogFormData.pdfFile && (
                        <a 
                          href={`http://localhost:5002${catalogFormData.pdfFile}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                        >
                          <FileText size={20} />
                          View PDF
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Extracted Products Section */}
                {extractedProducts.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Extracted Products from PDF</h3>
                    <div className="space-y-3">
                      {extractedProducts.map((product, index) => (
                        <div key={index} className="flex items-center gap-4 bg-white p-4 rounded-lg border">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{product.name || 'Product'}</p>
                            <p className="text-sm text-gray-600">Code: {product.code}</p>
                            {product.page && (
                              <p className="text-xs text-blue-600">Page {product.page}</p>
                            )}
                          </div>
                          <span className="font-bold text-green-700">₹{product.price || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catalogFormData.featured}
                      onChange={(e) => setCatalogFormData({ ...catalogFormData, featured: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                    />
                    <span className="text-sm font-medium text-gray-700">Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catalogFormData.new}
                      onChange={(e) => setCatalogFormData({ ...catalogFormData, new: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-400"
                    />
                    <span className="text-sm font-medium text-gray-700">New</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catalogFormData.ecoFriendly}
                      onChange={(e) => setCatalogFormData({ ...catalogFormData, ecoFriendly: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-400"
                    />
                    <span className="text-sm font-medium text-gray-700">Eco Friendly</span>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCatalogModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-lg"
                  >
                    {editingCatalog ? 'Update Catalog' : 'Create Catalog'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Vendor Modal */}
        {showVendorModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                </h2>
                <button
                  onClick={() => setShowVendorModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleVendorSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Vendor Name</label>
                    <input
                      type="text"
                      value={vendorFormData.name}
                      onChange={(e) => setVendorFormData({ ...vendorFormData, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={vendorFormData.phone}
                      onChange={(e) => setVendorFormData({ ...vendorFormData, phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={vendorFormData.address}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, address: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Option 1: Google Maps Link</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={vendorFormData.googleMapsLink}
                          onChange={handleGoogleMapsLink}
                          placeholder="Paste Google Maps link (e.g., https://maps.app.goo.gl/...)"
                          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleGetVendorLocation}
                          className="px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                          title="Get current location"
                        >
                          <Navigation className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Option 2: Pincode</label>
                      <input
                        type="text"
                        value={vendorFormData.locationPincode}
                        onChange={(e) => handlePincodeLocation(e.target.value)}
                        placeholder="Enter 6-digit pincode"
                        maxLength="6"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      />
                    </div>
                    {vendorFormData.location.coordinates[0] !== 0 && vendorFormData.location.coordinates[1] !== 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800">
                          <MapPin className="w-4 h-4 inline mr-1" />
                          Location detected: {vendorFormData.location.coordinates[1].toFixed(4)}, {vendorFormData.location.coordinates[0].toFixed(4)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={vendorFormData.city}
                      onChange={(e) => setVendorFormData({ ...vendorFormData, city: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      value={vendorFormData.state}
                      onChange={(e) => setVendorFormData({ ...vendorFormData, state: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode</label>
                    <input
                      type="text"
                      value={vendorFormData.pincode}
                      onChange={(e) => setVendorFormData({ ...vendorFormData, pincode: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Code</label>
                  <div className="space-y-2">
                    <select
                      value={vendorFormData.productCode}
                      onChange={(e) => setVendorFormData({ ...vendorFormData, productCode: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      required
                    >
                      <option value="">Select Product Code</option>
                      {selectedCatalog && selectedCatalog.products && selectedCatalog.products.length > 0 ? (
                        selectedCatalog.products.map((product, index) => (
                          <option key={index} value={product.code}>
                            {product.code} - {product.name || 'Product'} (Page {product.page}) - ₹{product.price || 0}
                          </option>
                        ))
                      ) : (
                        productCodes.map(code => (
                          <option key={code} value={code}>{code}</option>
                        ))
                      )}
                    </select>
                    {selectedCatalog && selectedCatalog.pdfFile && vendorFormData.productCode && (
                      <button
                        type="button"
                        onClick={() => handleViewProductPage(selectedCatalog._id, vendorFormData.productCode)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <FileText size={14} className="inline mr-1" />
                        View product page in PDF
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₹)</label>
                    <input
                      type="number"
                      value={vendorFormData.price}
                      onChange={(e) => setVendorFormData({ ...vendorFormData, price: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Transport Charges (₹)</label>
                    <input
                      type="number"
                      value={vendorFormData.transportCharges}
                      onChange={(e) => setVendorFormData({ ...vendorFormData, transportCharges: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowVendorModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-lg"
                  >
                    {editingVendor ? 'Update Vendor' : 'Add Vendor'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* PDF Viewer Modal */}
        {showPDFViewer && currentPDF && (
          <PDFViewer
            pdfUrl={currentPDF}
            initialPage={currentProductPage}
            onClose={() => setShowPDFViewer(false)}
          />
        )}
      </div>
    </div>
  );
};

export default SuperadminDashboard;
