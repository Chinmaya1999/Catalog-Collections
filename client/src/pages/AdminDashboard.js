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
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PDFViewer from '../components/PDFViewer';
import { API_ENDPOINTS, getImageUrl, getPdfUrl } from '../config/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('catalogs');
  const [catalogs, setCatalogs] = useState([]);
  const [catalogRequests, setCatalogRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Vendor search state
  const [vendorSearch, setVendorSearch] = useState({
    productCode: '',
    latitude: '',
    longitude: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [userLocation, setUserLocation] = useState({ latitude: '', longitude: '' });
  
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
      } catch (err) {
        // ignore parse errors
      }
    }
    fetchData();
  }, [navigate]);

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
      const { productCode, latitude, longitude } = vendorSearch;
      let url = `${API_ENDPOINTS.vendor}/product/${productCode}`;
      
      // Always include location if available
      if (userLocation.latitude && userLocation.longitude) {
        url += `?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}`;
      } else if (latitude && longitude) {
        url += `?latitude=${latitude}&longitude=${longitude}`;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">View catalogs and find product vendors</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('catalogs')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-md ${
              activeTab === 'catalogs' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Box className="w-5 h-5" />
            View Catalogs
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-md ${
              activeTab === 'vendors' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Search className="w-5 h-5" />
            Find Vendors
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-md ${
              activeTab === 'requests' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Gift className="w-5 h-5" />
            Catalog Requests
            {catalogRequests.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {catalogRequests.length}
              </span>
            )}
          </button>
        </div>

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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Product Code</label>
                      <input
                        type="text"
                        value={vendorSearch.productCode}
                        onChange={(e) => setVendorSearch({ ...vendorSearch, productCode: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter product code"
                        required
                      />
                    </div>
                    <div className="md:col-span-1">
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
                    <div className="md:col-span-1 flex items-end">
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
                                <span className="font-bold text-green-700">₹{vendor.price}</span>
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
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

export default AdminDashboard;
