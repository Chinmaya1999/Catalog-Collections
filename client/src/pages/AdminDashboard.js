import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Search,
  MapPin,
  Navigation,
  Phone,
  DollarSign,
  Package,
  FileText,
  Gift,
  Clock,
  Menu,
  X,
  LogOut,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PDFViewer from '../components/PDFViewer';
import { API_ENDPOINTS, getImageUrl, getPdfUrl } from '../config/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('catalogs');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminInfo, setAdminInfo] = useState(null);
  const [catalogs, setCatalogs] = useState([]);
  const [catalogRequests, setCatalogRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Vendor search state
  const [vendorSearch, setVendorSearch] = useState({
    productCode: '',
    vendorName: '',
    location: '',
    phoneNumber: '',
    latitude: '',
    longitude: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [userLocation, setUserLocation] = useState({ latitude: '', longitude: '' });
  
  // Catalog request vendor search state
  const [requestVendorSearch, setRequestVendorSearch] = useState({
    productCode: '',
    searching: false,
    results: [],
    expandedRequestId: null
  });
  
  // PDF viewer state
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [currentPDF, setCurrentPDF] = useState(null);
  const [currentProductPage, setCurrentProductPage] = useState(1);

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
        setAdminInfo(admin);
      } catch (err) {
        // ignore parse errors
      }
    }
    fetchData();
  }, [navigate]);

  const handleSignOut = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    window.dispatchEvent(new Event('adminAuthChange'));
    navigate('/admin/login');
  };

  const fetchData = async () => {
    try {
      // Fetch catalogs
      const catalogsRes = await fetch(API_ENDPOINTS.catalog);
      const catalogsData = await catalogsRes.json();
      setCatalogs(catalogsData);

      // Fetch catalog requests
      const token = localStorage.getItem('adminToken');
      const requestsRes = await fetch(API_ENDPOINTS.catalogRequest, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setCatalogRequests(requestsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(location);
          setVendorSearch({
            ...vendorSearch,
            latitude: location.latitude,
            longitude: location.longitude
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

  const handleVendorSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    setSearchResults([]);

    try {
      const { productCode, vendorName, location, phoneNumber, latitude, longitude } = vendorSearch;
      
      // Build search parameters
      const searchParams = new URLSearchParams();
      if (productCode) searchParams.append('productCode', productCode);
      if (vendorName) searchParams.append('vendorName', vendorName);
      if (location) searchParams.append('location', location);
      if (phoneNumber) searchParams.append('phoneNumber', phoneNumber);
      
      let url = `${API_ENDPOINTS.vendor}/search?${searchParams.toString()}`;
      
      // Always include location if available
      if (userLocation.latitude && userLocation.longitude) {
        url += `&latitude=${userLocation.latitude}&longitude=${userLocation.longitude}`;
      } else if (latitude && longitude) {
        url += `&latitude=${latitude}&longitude=${longitude}`;
      }

      console.log('Searching vendors with URL:', url);
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Search results:', data);
      
      if (response.ok) {
        setSearchResults(data);
      } else {
        console.error('Search failed:', data.message);
      }
    } catch (error) {
      console.error('Error searching vendors:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleViewProductPage = async (catalogId, productCode) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.catalog}/product-page/${catalogId}/${productCode}`);
      const data = await response.json();
      
      if (response.ok) {
        setCurrentPDF(getPdfUrl(data.pdfFile));
        setCurrentProductPage(data.page);
        setShowPDFViewer(true);
      } else {
        console.error('Error fetching product page:', data.message);
        // Fallback: just open the PDF
        if (searchResults.length > 0 && searchResults[0].catalogId) {
          const catalog = searchResults[0].catalogId;
          if (catalog.pdfFile) {
            setCurrentPDF(getPdfUrl(catalog.pdfFile));
            setCurrentProductPage(1);
            setShowPDFViewer(true);
          }
        }
      }
    } catch (error) {
      console.error('Error viewing product page:', error);
    }
  };

  // Function to extract base product code (remove suffixes like 'a', 'b', etc.)
  const extractBaseProductCode = (productCode) => {
    if (!productCode) return '';
    // Remove any trailing letters (a, b, c, etc.) and keep the base code
    return productCode.replace(/[a-z]$/i, '').toUpperCase();
  };

  // Handle vendor search from catalog requests
  const handleRequestVendorSearch = async (catalogNumber, requestId) => {
    const baseCode = extractBaseProductCode(catalogNumber);
    
    // Set searching state for this specific request
    setRequestVendorSearch({
      productCode: baseCode,
      searching: true,
      results: [],
      expandedRequestId: requestId
    });

    try {
      let url = `${API_ENDPOINTS.vendor}/product/${baseCode}`;
      
      // Always include location if available
      if (userLocation.latitude && userLocation.longitude) {
        url += `?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}`;
      }

      console.log('Searching vendors for request with URL:', url);
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Request vendor search results:', data);
      
      // Update results regardless of response status
      setRequestVendorSearch({
        productCode: baseCode,
        searching: false,
        results: response.ok ? data : [],
        expandedRequestId: requestId
      });
      
      if (!response.ok) {
        console.error('Request vendor search failed:', data.message);
      }
    } catch (error) {
      console.error('Error searching vendors for request:', error);
      setRequestVendorSearch({
        productCode: baseCode,
        searching: false,
        results: [],
        expandedRequestId: requestId
      });
    }
  };

  // Deleting a catalog request only removes it from this list — the full
  // record (requester phone number, catalog code/number, notes) is kept and
  // stays visible to superadmins in the Super Admin dashboard.
  const handleDeleteCatalogRequest = async (requestId) => {
    if (!window.confirm('Delete this catalog request? It will be removed from this list, but the request data is kept for the Super Admin dashboard.')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_ENDPOINTS.catalogRequest}/${requestId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setCatalogRequests(prev => prev.filter(r => r._id !== requestId));
      } else {
        const data = await response.json().catch(() => ({}));
        alert(`Error: ${data.message || 'Failed to delete catalog request'}`);
      }
    } catch (error) {
      console.error('Error deleting catalog request:', error);
      alert('Error deleting catalog request. Please try again.');
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

  const navItems = [
    { id: 'catalogs', label: 'Catalogs', description: 'Browse available product catalogs', icon: Box },
    { id: 'vendors', label: 'Find Vendors', description: 'Search for vendors by product code near your location', icon: Search },
    { id: 'requests', label: 'Catalog Requests', description: 'View and manage catalog requests from users', icon: Gift, badge: catalogRequests.length }
  ];
  const currentNavItem = navItems.find(item => item.id === activeTab) || navItems[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — pinned to the viewport so it never scrolls with the page */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 h-screen bg-gray-900 text-white flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-6 py-6 border-b border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src="/images/logo.png"
              alt="Adihuman Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<span class="font-bold text-white">A</span>';
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-lg leading-tight truncate">Adihuman</p>
            <p className="text-xs text-gray-400">{adminInfo?.username || 'Admin'}</p>
          </div>
          <button className="ml-auto lg:hidden text-gray-400" onClick={() => setSidebarOpen(false)}>
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 shadow-md'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <item.icon size={20} />
              <span className="flex-1 text-left">{item.label}</span>
              {!!item.badge && (
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                  activeTab === item.id ? 'bg-gray-900 text-white' : 'bg-red-500 text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-800">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-300 hover:bg-gray-800 transition-all"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content — offset past the fixed sidebar on large screens */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b px-4 sm:px-8 py-4 flex items-center gap-4">
          <button className="lg:hidden text-gray-500" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{currentNavItem.label}</h1>
            <p className="text-sm text-gray-500 hidden sm:block">{currentNavItem.description}</p>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Catalogs Tab */}
        {activeTab === 'catalogs' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <h2 className="text-2xl font-bold text-gray-900">All Catalogs</h2>
                <p className="text-gray-600 mt-1">Browse available product catalogs</p>
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
                        src={getImageUrl(catalog.image)} 
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
                      
                      {/* Price Range Display */}
                      {catalog.priceRange && (catalog.priceRange.minPrice > 0 || catalog.priceRange.maxPrice > 0) ? (
                        <div className="mb-3 p-2 bg-yellow-50 rounded-lg">
                          <p className="text-xs font-semibold text-gray-900">
                            {catalog.priceRange.currency}{catalog.priceRange.minPrice} - {catalog.priceRange.currency}{catalog.priceRange.maxPrice}
                          </p>
                        </div>
                      ) : catalog.priceRange ? (
                        <div className="mb-3 p-2 bg-yellow-50 rounded-lg">
                          <p className="text-xs font-semibold text-gray-900">
                            Price range available
                          </p>
                        </div>
                      ) : null}
                      
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                          {catalog.categoryName}
                        </span>
                        <span className="text-sm text-gray-500 capitalize">{catalog.type}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Find Vendors Tab */}
        {activeTab === 'vendors' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <h2 className="text-2xl font-bold text-gray-900">Find Product Vendors</h2>
                <p className="text-gray-600 mt-1">Search for vendors by product code near your location</p>
              </div>
              
              {/* Search Form */}
              <div className="p-6">
                <form onSubmit={handleVendorSearch} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Product Code</label>
                      <input
                        type="text"
                        value={vendorSearch.productCode}
                        onChange={(e) => setVendorSearch({ ...vendorSearch, productCode: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter product code"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Vendor Name</label>
                      <input
                        type="text"
                        value={vendorSearch.vendorName}
                        onChange={(e) => setVendorSearch({ ...vendorSearch, vendorName: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter vendor name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={vendorSearch.location}
                        onChange={(e) => setVendorSearch({ ...vendorSearch, location: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="City, state, or pincode"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="text"
                        value={vendorSearch.phoneNumber}
                        onChange={(e) => setVendorSearch({ ...vendorSearch, phoneNumber: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Your Location</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={userLocation.latitude && userLocation.longitude ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : ''}
                          readOnly
                          placeholder="Auto-detect or enter manually"
                          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                        />
                        <button
                          type="button"
                          onClick={handleGetLocation}
                          className="px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                          title="Get my location"
                        >
                          <Navigation className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={searching}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-6 py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-lg disabled:opacity-50"
                      >
                        <Search className="w-5 h-5" />
                        {searching ? 'Searching...' : 'Search Vendors'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border-t border-gray-200">
                  <div className="px-6 py-4 bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">
                      Found {searchResults.length} vendor(s) for product code: {vendorSearch.productCode}
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {searchResults.map((vendor) => (
                      <div key={vendor._id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h4 className="text-xl font-bold text-gray-900">{vendor.name}</h4>
                              {vendor.distance !== null && vendor.distance !== undefined && (
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-bold rounded-full">
                                  <MapPin className="w-4 h-4 inline mr-1" />
                                  {vendor.distance} km away
                                </span>
                              )}
                              {vendor.distance === null && (
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-bold rounded-full">
                                  <MapPin className="w-4 h-4 inline mr-1" />
                                  Location not available
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 mb-3">{vendor.address}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                                {vendor.city}, {vendor.state}
                              </span>
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                                {vendor.pincode}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                              <div className="flex items-center gap-2 text-gray-700">
                                <Phone className="w-5 h-5 text-green-600" />
                                <span className="font-medium">{vendor.phone}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-700">
                                <Package className="w-5 h-5 text-blue-600" />
                                <span className="font-medium">Code: {vendorSearch.productCode}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-700">
                                <DollarSign className="w-5 h-5 text-green-600" />
                                {vendor.catalogId?.priceRange && (vendor.catalogId.priceRange.minPrice > 0 || vendor.catalogId.priceRange.maxPrice > 0) ? (
                                  <span className="font-bold text-green-700">
                                    {vendor.catalogId.priceRange.currency}{vendor.catalogId.priceRange.minPrice} - {vendor.catalogId.priceRange.currency}{vendor.catalogId.priceRange.maxPrice}
                                  </span>
                                ) : vendor.priceRange && (vendor.priceRange.minPrice > 0 || vendor.priceRange.maxPrice > 0) ? (
                                  <span className="font-bold text-green-700">
                                    {vendor.priceRange.currency}{vendor.priceRange.minPrice} - {vendor.priceRange.currency}{vendor.priceRange.maxPrice}
                                  </span>
                                ) : (
                                  <span className="font-bold text-green-700">₹{vendor.price}</span>
                                )}
                                {vendor.transportCharges > 0 && (
                                  <span className="text-gray-500">+ ₹{vendor.transportCharges} transport</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {vendor.googleMapsLink && (
                                  <a
                                    href={vendor.googleMapsLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                  >
                                    <MapPin className="w-4 h-4" />
                                    Google Maps
                                  </a>
                                )}
                                {vendor.catalogId && vendor.catalogId.pdfFile && (
                                  <button
                                    onClick={() => handleViewProductPage(vendor.catalogId._id, vendorSearch.productCode)}
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                  >
                                    <FileText className="w-4 h-4" />
                                    View Product Page
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <a
                              href={`tel:${vendor.phone}`}
                              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all shadow-lg"
                            >
                              <Phone className="w-5 h-5" />
                              Call Now
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.length === 0 && !searching && vendorSearch.productCode && (
                <div className="p-12 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg">No vendors found for this product code</p>
                  <p className="text-gray-400 mt-2">Try a different product code or check back later</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Catalog Requests Tab */}
        {activeTab === 'requests' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <h2 className="text-2xl font-bold text-gray-900">Catalog Requests</h2>
                <p className="text-gray-600 mt-1">View and manage catalog requests from users</p>
              </div>
              
              {catalogRequests.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Gift className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg">No catalog requests yet</p>
                  <p className="text-gray-400 mt-2">Requests will appear here when users submit them</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {catalogRequests.map((request) => (
                    <div key={request._id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="text-xl font-bold text-gray-900">
                              {request.catalogCode}
                            </h4>
                            <span className={`px-3 py-1 text-sm font-bold rounded-full ${
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              request.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                              request.status === 'completed' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-gray-700">
                              <Package className="w-5 h-5 text-blue-600" />
                              <span className="font-medium">Catalog #: {request.catalogNumber}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <Phone className="w-5 h-5 text-green-600" />
                              <span className="font-medium">{request.phoneNumber}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <Clock className="w-5 h-5 text-gray-600" />
                              <span className="text-sm">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Find Vendor Button */}
                          <div className="mb-4">
                            <button
                              onClick={() => handleRequestVendorSearch(request.catalogNumber, request._id)}
                              disabled={requestVendorSearch.searching && requestVendorSearch.expandedRequestId === request._id}
                              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg text-sm disabled:opacity-50"
                            >
                              <Search className="w-4 h-4" />
                              {requestVendorSearch.searching && requestVendorSearch.expandedRequestId === request._id ? 'Finding Vendor...' : 'Find Vendor'}
                            </button>
                          </div>

                          {/* Vendor Search Results */}
                          {requestVendorSearch.expandedRequestId === request._id && (
                            <div className="mt-4">
                              {requestVendorSearch.results.length > 0 ? (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 overflow-hidden">
                                  <div className="px-4 py-3 bg-blue-100 border-b border-blue-200">
                                    <h5 className="font-bold text-gray-900 flex items-center gap-2">
                                      <Package className="w-5 h-5 text-blue-600" />
                                      Found {requestVendorSearch.results.length} vendor(s) for {requestVendorSearch.productCode}
                                    </h5>
                                  </div>
                                  <div className="p-4 space-y-4">
                                    {requestVendorSearch.results.map((vendor, index) => (
                                      <div key={vendor._id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                                        <div className="p-4">
                                          <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-2">
                                                <h6 className="font-bold text-lg text-gray-900">{vendor.name}</h6>
                                                {vendor.distance !== null && vendor.distance !== undefined && (
                                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                                                    <MapPin className="w-3 h-3 inline mr-1" />
                                                    {vendor.distance} km
                                                  </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{vendor.address}</p>
                                            <div className="flex flex-wrap gap-2 text-xs">
                                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                                                {vendor.city}, {vendor.state}
                                              </span>
                                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                                                {vendor.pincode}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                                            <Phone className="w-4 h-4 text-green-600" />
                                            <div>
                                              <p className="text-xs text-gray-500">Phone</p>
                                              <p className="text-sm font-semibold text-gray-900">{vendor.phone}</p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                                            <DollarSign className="w-4 h-4 text-yellow-600" />
                                            <div>
                                              <p className="text-xs text-gray-500">Price</p>
                                              {vendor.catalogId?.priceRange && (vendor.catalogId.priceRange.minPrice > 0 || vendor.catalogId.priceRange.maxPrice > 0) ? (
                                                <p className="text-sm font-bold text-gray-900">
                                                  {vendor.catalogId.priceRange.currency}{vendor.catalogId.priceRange.minPrice} - {vendor.catalogId.priceRange.currency}{vendor.catalogId.priceRange.maxPrice}
                                                </p>
                                              ) : vendor.priceRange && (vendor.priceRange.minPrice > 0 || vendor.priceRange.maxPrice > 0) ? (
                                                <p className="text-sm font-bold text-gray-900">
                                                  {vendor.priceRange.currency}{vendor.priceRange.minPrice} - {vendor.priceRange.currency}{vendor.priceRange.maxPrice}
                                                </p>
                                              ) : (
                                                <p className="text-sm font-bold text-gray-900">₹{vendor.price}</p>
                                              )}
                                            </div>
                                          </div>
                                          {vendor.transportCharges > 0 && (
                                            <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                                              <Package className="w-4 h-4 text-orange-600" />
                                              <div>
                                                <p className="text-xs text-gray-500">Transport</p>
                                                <p className="text-sm font-semibold text-gray-900">₹{vendor.transportCharges}</p>
                                              </div>
                                            </div>
                                          )}
                                          {vendor.googleMapsLink && (
                                            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                                              <MapPin className="w-4 h-4 text-blue-600" />
                                              <a
                                                href={vendor.googleMapsLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                                              >
                                                Google Maps
                                              </a>
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex gap-2">
                                          <a
                                            href={`tel:${vendor.phone}`}
                                            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-all shadow-md text-sm"
                                          >
                                            <Phone className="w-4 h-4" />
                                            Call Now
                                          </a>
                                          {vendor.catalogId && vendor.catalogId.pdfFile && (
                                            <button
                                              onClick={() => handleViewProductPage(vendor.catalogId._id, requestVendorSearch.productCode)}
                                              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md text-sm"
                                            >
                                              <FileText className="w-4 h-4" />
                                              View Product
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              ) : (
                                <div className="mt-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                      <Search className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900">No vendors found</p>
                                      <p className="text-sm text-gray-600">No vendors available for product code: {requestVendorSearch.productCode}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {request.notes && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                              <p className="text-sm text-gray-600"><strong>Notes:</strong> {request.notes}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4 flex flex-col gap-2">
                          <a
                            href={`tel:${request.phoneNumber}`}
                            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all shadow-lg text-sm"
                          >
                            <Phone className="w-4 h-4" />
                            Call
                          </a>
                          <select
                            value={request.status}
                            onChange={async (e) => {
                              try {
                                const token = localStorage.getItem('adminToken');
                                const response = await fetch(`${API_ENDPOINTS.catalogRequest}/${request._id}`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                  },
                                  body: JSON.stringify({ status: e.target.value })
                                });
                                if (response.ok) {
                                  fetchData();
                                }
                              } catch (error) {
                                console.error('Error updating status:', error);
                              }
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400"
                          >
                            <option value="pending">Pending</option>
                            <option value="contacted">Contacted</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <button
                            onClick={() => handleDeleteCatalogRequest(request._id)}
                            className="flex items-center justify-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-xl font-bold hover:bg-red-200 transition-all text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
        </main>
      </div>

      {/* PDF Viewer Modal */}
      {showPDFViewer && currentPDF && (
        <PDFViewer
          pdfUrl={currentPDF}
          initialPage={currentProductPage}
          onClose={() => setShowPDFViewer(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
