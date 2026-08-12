import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Phone, 
  DollarSign,
  Package,
  ChevronDown,
  ChevronUp,
  FileText,
  X,
  Navigation,
  Image as ImageIcon,
  Download,
  Upload,
  BarChart3
} from 'lucide-react';
import PDFViewer from '../components/PDFViewer';
import { API_ENDPOINTS, getImageUrl, getPdfUrl } from '../config/api';

const SuperadminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('catalogs');
  const [catalogs, setCatalogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
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
  
  // Page-wise product code entry state
  const [pdfTotalPages, setPdfTotalPages] = useState(0);
  const [pageProductCodes, setPageProductCodes] = useState({});
  const [showPageEntryMode, setShowPageEntryMode] = useState(false);

  // Analysis state
  const [analysisData, setAnalysisData] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importResults, setImportResults] = useState(null);

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
    products: [],
    baseCodePattern: '',
    minPrice: '',
    maxPrice: '',
    currency: '₹'
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
    productCodes: [], // Changed to array for multiple selection
    productCode: '', // Keep single for backward compatibility
    price: '',
    minPrice: '',
    maxPrice: '',
    currency: '₹',
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
      const catalogsRes = await fetch(API_ENDPOINTS.catalog);
      const catalogsData = await catalogsRes.json();
      setCatalogs(catalogsData);

      // Fetch categories
      const categoriesRes = await fetch(API_ENDPOINTS.category);
      const categoriesData = await categoriesRes.json();
      setCategories(categoriesData);

      // Fetch product codes from catalogs
      const codesRes = await fetch(`${API_ENDPOINTS.catalog}/product-codes/all`);
      if (codesRes.ok) {
        const codesData = await codesRes.json();
        // Product codes are now available via catalog products
      }

      // Fetch all vendors
      const vendorsRes = await fetch(`${API_ENDPOINTS.vendor}/catalog/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (vendorsRes.ok) {
        const vendorsData = await vendorsRes.json();
        console.log('Fetched vendors:', vendorsData);
        setVendors(vendorsData);
      } else {
        console.error('Failed to fetch vendors:', await vendorsRes.text());
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
    setShowPageEntryMode(false);
    setPdfTotalPages(0);
    setPageProductCodes({});
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
      products: catalog.products || [],
      minPrice: catalog.priceRange?.minPrice || '',
      maxPrice: catalog.priceRange?.maxPrice || '',
      currency: catalog.priceRange?.currency || '₹'
    });
    setExtractedProducts(catalog.products || []);
    setShowCatalogModal(true);
  };

  const handleDeleteCatalog = async (id) => {
    if (!window.confirm('Are you sure you want to delete this catalog?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_ENDPOINTS.catalog}/${id}`, {
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

      const response = await fetch(`${API_ENDPOINTS.catalog}/image`, {
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

      console.log('Uploading PDF file:', file.name, file.size);

      const response = await fetch(`${API_ENDPOINTS.catalog}/pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      console.log('PDF upload response:', data);
      
      if (response.ok) {
        setCatalogFormData(prev => ({ ...prev, pdfFile: data.pdfPath }));
        
        // Set total pages and switch to page-wise entry mode
        if (data.totalPages) {
          console.log('Setting total pages:', data.totalPages);
          setPdfTotalPages(data.totalPages);
          setShowPageEntryMode(true);
          setPageProductCodes({});
          
          // Clear any auto-extracted products since we're doing manual entry
          setExtractedProducts([]);
          setCatalogFormData(prev => ({ ...prev, products: [] }));
        } else {
          console.error('No totalPages in response:', data);
        }
      } else {
        console.error('PDF upload failed:', data.message);
        alert(`PDF upload failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Error uploading PDF. Please try again.');
    }
  };

  // Handle page-wise product code entry
  const handlePageCodeEntry = (page, codes) => {
    setPageProductCodes(prev => ({
      ...prev,
      [page]: codes
    }));
  };

  // Auto-generate product codes based on base pattern
  const handleAutoGenerateCodes = () => {
    const basePattern = catalogFormData.baseCodePattern;
    if (!basePattern) {
      alert('Please enter a base code pattern first (e.g., ADB-000)');
      return;
    }

    // Parse the base pattern to extract prefix and determine number format
    const match = basePattern.match(/^(.*?)(0+)$/);
    if (!match) {
      alert('Invalid pattern. Please include zeros at the end (e.g., ADB-000 or AH-00)');
      return;
    }

    const prefix = match[1];
    const zeroCount = match[2].length;

    // Generate codes for all pages
    const newPageCodes = {};
    for (let pageNum = 1; pageNum <= pdfTotalPages; pageNum++) {
      // Generate sequential number with proper padding
      const paddedNumber = String(pageNum).padStart(zeroCount, '0');
      const code = `${prefix}${paddedNumber}`;
      newPageCodes[pageNum] = code;
    }

    setPageProductCodes(newPageCodes);
    alert(`Successfully generated ${pdfTotalPages} product codes from ${prefix}001 to ${prefix}${String(pdfTotalPages).padStart(zeroCount, '0')}`);
  };

  // Convert page-wise codes to products array
  const convertPageCodesToProducts = () => {
    const products = [];
    Object.keys(pageProductCodes).forEach(page => {
      const codes = pageProductCodes[page];
      if (codes && codes.trim()) {
        const codeArray = codes.split(',').map(code => code.trim()).filter(code => code);
        codeArray.forEach(code => {
          products.push({
            code: code,
            name: `Product ${code}`,
            page: parseInt(page),
            price: 0
          });
        });
      }
    });
    return products.sort((a, b) => a.page - b.page);
  };

  // Finish page-wise entry and convert to products
  const handleFinishPageEntry = async () => {
    const products = convertPageCodesToProducts();
    setExtractedProducts(products);
    setCatalogFormData(prev => ({ ...prev, products }));
    setShowPageEntryMode(false);
    
    // Auto-submit the form after a short delay
    setTimeout(() => {
      const form = document.querySelector('form[onSubmit]');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  // Skip page-wise entry and use auto-extraction
  const handleSkipPageEntry = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      
      // Re-upload PDF to get auto-extracted products
      const response = await fetch(`${API_ENDPOINTS.catalog}/pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok && data.extractedProducts) {
        setExtractedProducts(data.extractedProducts);
        setCatalogFormData(prev => ({ ...prev, products: data.extractedProducts }));
      }
      setShowPageEntryMode(false);
    } catch (error) {
      console.error('Error in auto-extraction:', error);
      setShowPageEntryMode(false);
    }
  };

  const handleCatalogSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('adminToken');
      const url = editingCatalog 
        ? `${API_ENDPOINTS.catalog}/${editingCatalog._id}`
        : API_ENDPOINTS.catalog;
      
      const method = editingCatalog ? 'PUT' : 'POST';

      const formDataToSend = new FormData();
      Object.keys(catalogFormData).forEach(key => {
        if (key === 'products') {
          formDataToSend.append(key, JSON.stringify(catalogFormData[key]));
        } else if (key === 'minPrice' || key === 'maxPrice') {
          // Ensure price values are sent as strings (server will parse them)
          formDataToSend.append(key, catalogFormData[key] || '0');
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
        // Refresh product codes after catalog creation/update
        const codesRes = await fetch(`${API_ENDPOINTS.catalog}/product-codes/all`);
        if (codesRes.ok) {
          const codesData = await codesRes.json();
          // Product codes are now available via catalog products
        }
      }
    } catch (error) {
      console.error('Error saving catalog:', error);
    }
  };

  const handleAddVendor = (catalog) => {
    setSelectedCatalog(catalog);
    setEditingVendor(null);
    
    // Auto-select all product codes if available
    const allProductCodes = catalog.products && catalog.products.length > 0 
      ? catalog.products.map(product => product.code)
      : [];
    
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
      productCodes: allProductCodes, // Auto-select all product codes
      productCode: allProductCodes.length > 0 ? allProductCodes[0] : '', // Keep first for backward compatibility
      price: '',
      minPrice: '',
      maxPrice: '',
      currency: '₹',
      transportCharges: '0'
    });
    setShowVendorModal(true);
  };

  const handleEditVendor = (vendor) => {
    // Find the catalog for this vendor
    const catalog = catalogs.find(c => c._id === vendor.catalogId);
    if (catalog) {
      setSelectedCatalog(catalog);
    }
    
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
      productCodes: vendor.productCodes || [vendor.productCode], // Handle both old and new format
      price: vendor.price,
      minPrice: vendor.priceRange?.minPrice || '',
      maxPrice: vendor.priceRange?.maxPrice || '',
      currency: vendor.priceRange?.currency || '₹',
      transportCharges: vendor.transportCharges
    });
    setShowVendorModal(true);
  };

  const handleDeleteVendor = async (vendorId) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_ENDPOINTS.vendor}/${vendorId}`, {
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

  const handleDeleteAllVendors = async () => {
    if (!window.confirm('Are you sure you want to delete ALL vendors from the database? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_ENDPOINTS.vendor}/all/delete`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setVendors([]);
      }
    } catch (error) {
      console.error('Error deleting all vendors:', error);
      alert('Error deleting all vendors. Please try again.');
    }
  };

  const handleVendorSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('adminToken');
      const url = editingVendor 
        ? `${API_ENDPOINTS.vendor}/${editingVendor._id}`
        : API_ENDPOINTS.vendor;
      
      const method = editingVendor ? 'PUT' : 'POST';
      
      // Use the first product code as the primary, but store all selected codes
      const primaryProductCode = vendorFormData.productCodes.length > 0 
        ? vendorFormData.productCodes[0] 
        : vendorFormData.productCode;
      
      const vendorData = {
        ...vendorFormData,
        productCode: primaryProductCode,
        productCodes: vendorFormData.productCodes.length > 0 ? vendorFormData.productCodes : [primaryProductCode],
        minPrice: vendorFormData.minPrice || vendorFormData.price,
        maxPrice: vendorFormData.maxPrice || vendorFormData.price,
        currency: vendorFormData.currency || '₹'
      };

      console.log('Submitting vendor:', { url, method, data: vendorData });

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(vendorData)
      });

      const data = await response.json();
      console.log('Vendor submission response:', data);

      if (response.ok) {
        const message = editingVendor 
          ? 'Vendor updated successfully' 
          : `Vendor created successfully with ${vendorFormData.productCodes.length} product code(s)`;
        alert(message);
        setShowVendorModal(false);
        fetchData();
      } else {
        console.error('Vendor creation failed:', data);
        alert(`Error: ${data.message || 'Failed to create vendor'}`);
      }
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert('Error saving vendor. Please try again.');
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

  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_ENDPOINTS.vendor}/export/excel`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vendors_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export Excel file');
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Error exporting Excel file');
    }
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setExcelFile(file);
    }
  };

  const handleImportExcel = async () => {
    if (!excelFile) {
      alert('Please select an Excel file first');
      return;
    }

    setUploading(true);
    setImportResults(null);

    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('excel', excelFile);

      const response = await fetch(`${API_ENDPOINTS.vendor}/import/excel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setImportResults(data.results);
        alert(`Import completed: ${data.results.success.length} successful, ${data.results.errors.length} failed`);
        fetchData(); // Refresh data
      } else {
        alert(`Import failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Error importing Excel:', error);
      alert('Error importing Excel file');
    } finally {
      setUploading(false);
      setExcelFile(null);
    }
  };

  const handleGoogleMapsLink = async (e) => {
    const link = e.target.value;
    setVendorFormData({ ...vendorFormData, googleMapsLink: link });

    // Parse Google Maps link to extract coordinates
    if (link && (link.includes('maps.app.goo.gl') || link.includes('google.com/maps') || link.includes('openstreetmap.org'))) {
      try {
        // For shortened links, we need to resolve them first
        if (link.includes('maps.app.goo.gl')) {
          // In production, you'd need a backend service to resolve shortened URLs
          // For now, we'll alert the user
          alert('Please use the full Google Maps URL with coordinates for automatic location detection.');
          return;
        }

        // Extract coordinates from Google Maps URL - multiple formats
        let coordsMatch = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        
        // Try alternative format: !3d(lat)!4d(lng)
        if (!coordsMatch) {
          coordsMatch = link.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
        }
        
        // Try format: q=lat,lng
        if (!coordsMatch) {
          coordsMatch = link.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
        }
        
        // Try OpenStreetMap format: #map=lat/zoom/lng or lat,lng
        if (!coordsMatch && link.includes('openstreetmap.org')) {
          coordsMatch = link.match(/#map=\d+\/(-?\d+\.\d+)\/(-?\d+\.\d+)/);
          if (!coordsMatch) {
            coordsMatch = link.match(/mlat=(-?\d+\.\d+)&mlon=(-?\d+\.\d+)/);
          }
        }

        if (coordsMatch) {
          const lat = parseFloat(coordsMatch[1]);
          const lng = parseFloat(coordsMatch[2]);
          console.log('Extracted coordinates:', { lat, lng });
          setVendorFormData({
            ...vendorFormData,
            location: {
              type: 'Point',
              coordinates: [lng, lat]
            }
          });
        } else {
          console.log('Could not extract coordinates from link format');
        }
      } catch (error) {
        console.error('Error parsing location link:', error);
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
    return vendors.filter(v => {
      // Handle both string and ObjectId comparison
      const vendorCatalogId = v.catalogId && v.catalogId._id ? v.catalogId._id : v.catalogId;
      return String(vendorCatalogId) === String(catalogId);
    });
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
        // Fallback: just open the PDF at page 1
        const catalog = catalogs.find(c => c._id === catalogId);
        if (catalog && catalog.pdfFile) {
          setCurrentPDF(getPdfUrl(catalog.pdfFile));
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
            Vendors by Catalog
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-md ${
              activeTab === 'analysis' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BarChart3 size={20} />
            Analysis
          </button>
          {/* <button
            onClick={() => setActiveTab('all-vendors')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-md ${
              activeTab === 'all-vendors' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MapPin size={20} />
            All Vendors
          </button> */}
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

        {/* Vendor Management Tab - Vendors by Catalog */}
        {activeTab === 'vendors' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <h2 className="text-2xl font-bold text-gray-900">Vendors by Catalog</h2>
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
                              src={getImageUrl(catalog.image)} 
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
                            {catalog.name}: {catalogVendors.length} vendors
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
                                      <p className="text-sm text-gray-600">{vendor.city}, {vendor.state}</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleEditVendor(vendor)}
                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                                        title="Edit Vendor"
                                      >
                                        <Edit size={18} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteVendor(vendor._id)}
                                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                                        title="Delete Vendor"
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
                                      <span className="truncate">{vendor.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <DollarSign size={16} className="text-green-600" />
                                      <span className="font-bold text-green-700">₹{vendor.price}</span>
                                      {vendor.transportCharges > 0 && (
                                        <span className="text-gray-500">+ ₹{vendor.transportCharges} transport</span>
                                      )}
                                    </div>
                                    
                                    {/* Product Codes Display */}
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Package size={16} className="text-purple-600" />
                                        <span className="font-medium text-gray-700">
                                          Product Codes ({vendor.productCodes?.length || 1})
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {vendor.productCodes && vendor.productCodes.length > 0 ? (
                                          vendor.productCodes.slice(0, 6).map((code, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                              {code}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                            {vendor.productCode}
                                          </span>
                                        )}
                                        {vendor.productCodes && vendor.productCodes.length > 6 && (
                                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                            +{vendor.productCodes.length - 6} more
                                          </span>
                                        )}
                                      </div>
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

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <h2 className="text-2xl font-bold text-gray-900">Catalog Analysis</h2>
                <p className="text-gray-600 mt-1">Export and import vendor data via Excel</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Export Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Download className="w-5 h-5 text-blue-600" />
                    Export Vendor Data
                  </h3>
                  <p className="text-gray-600 mb-4">Download all vendor data as an Excel file with complete details including vendor information, catalog details, pricing, and contact information.</p>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
                  >
                    <Download className="w-5 h-5" />
                    Download Excel File
                  </button>
                </div>

                {/* Import Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-green-600" />
                    Import Vendor Data
                  </h3>
                  <p className="text-gray-600 mb-4">Upload an Excel file with vendor data to bulk import vendors. The file should contain columns for vendor name, phone, address, catalog name, product codes, and pricing information.</p>
                  
                  <div className="mb-4">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelUpload}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                    />
                  </div>
                  
                  <button
                    onClick={handleImportExcel}
                    disabled={!excelFile || uploading}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-5 h-5" />
                    {uploading ? 'Importing...' : 'Import Excel File'}
                  </button>
                </div>

                {/* Import Results */}
                {importResults && (
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Import Results</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Total Rows</p>
                        <p className="text-2xl font-bold text-gray-900">{importResults.total}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Successfully Imported</p>
                        <p className="text-2xl font-bold text-green-600">{importResults.success.length}</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Failed</p>
                        <p className="text-2xl font-bold text-red-600">{importResults.errors.length}</p>
                      </div>
                    </div>
                    
                    {importResults.errors.length > 0 && (
                      <div className="mt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Failed Rows:</h4>
                    <div className="max-h-48 overflow-y-auto bg-white rounded-lg p-2">
                      {importResults.errors.map((error, index) => (
                        <div key={index} className="text-sm p-2 border-b last:border-0">
                          <span className="font-medium text-red-600">Row {error.row}:</span> {error.error}
                          <span className="text-gray-500 ml-2">- {JSON.stringify(error.data)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* All Vendors Tab */}
        {activeTab === 'all-vendors' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">All Vendors</h2>
                  <p className="text-gray-600 mt-1">Manage vendor information across all catalogs</p>
                </div>
                <button
                  onClick={handleDeleteAllVendors}
                  className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg"
                >
                  <Trash2 size={20} />
                  Delete All Vendors
                </button>
              </div>
              <div className="p-6">
                {catalogs.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No catalogs available</p>
                    <p className="text-gray-400 mt-2">Create catalogs first to add vendors</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {catalogs.map(catalog => {
                      const catalogVendors = vendors.filter(v => {
                        // Handle both string and ObjectId comparison
                        const vendorCatalogId = v.catalogId && v.catalogId._id ? v.catalogId._id : v.catalogId;
                        return String(vendorCatalogId) === String(catalog._id);
                      });
                      // Show all catalogs, even those with 0 vendors
                      
                      return (
                        <div key={catalog._id} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {catalog.image && (
                                <img 
                                  src={getImageUrl(catalog.image)}
                                  alt={catalog.name}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                              )}
                              <div>
                                <h3 className="font-bold text-gray-900 text-lg">{catalog.name}</h3>
                                <p className="text-sm text-gray-600">{catalog.categoryName}</p>
                              </div>
                            </div>
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-bold rounded-full">
                              {catalog.name}: {catalogVendors.length} vendors
                            </span>
                          </div>
                          
                          <div className="p-6">
                            {catalogVendors.length === 0 ? (
                              <div className="text-center py-8 bg-gray-50 rounded-xl">
                                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No vendors for this catalog</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {catalogVendors.map(vendor => (
                                <div key={vendor._id} className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-all">
                                  {/* Header with vendor name and catalog badge */}
                                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 border-b border-purple-200">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <h5 className="font-bold text-gray-900 text-lg mb-1">{vendor.name}</h5>
                                        <div className="flex items-center gap-2">
                                          <Package size={14} className="text-purple-600" />
                                          <span className="text-sm font-medium text-purple-700">{catalog.name}</span>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => {
                                            setSelectedCatalog(catalog);
                                            handleEditVendor(vendor);
                                          }}
                                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                                          title="Edit Vendor"
                                        >
                                          <Edit size={18} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteVendor(vendor._id)}
                                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                                          title="Delete Vendor"
                                        >
                                          <Trash2 size={18} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Vendor details */}
                                  <div className="p-5 space-y-3 text-sm">
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <Phone size={16} className="text-green-600" />
                                      <span className="font-medium">{vendor.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <MapPin size={16} className="text-blue-600" />
                                      <span className="truncate">{vendor.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <DollarSign size={16} className="text-green-600" />
                                      <span className="font-bold text-green-700">₹{vendor.price}</span>
                                      {vendor.transportCharges > 0 && (
                                        <span className="text-gray-500">+ ₹{vendor.transportCharges} transport</span>
                                      )}
                                    </div>
                                    
                                    {/* Product Codes Display */}
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Package size={16} className="text-purple-600" />
                                        <span className="font-medium text-gray-700">
                                          Product Codes ({vendor.productCodes?.length || 1})
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {vendor.productCodes && vendor.productCodes.length > 0 ? (
                                          vendor.productCodes.slice(0, 6).map((code, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                              {code}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                            {vendor.productCode}
                                          </span>
                                        )}
                                        {vendor.productCodes && vendor.productCodes.length > 6 && (
                                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                            +{vendor.productCodes.length - 6} more
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {catalogs.length > 0 && vendors.filter(v => catalogs.some(c => c._id === v.catalogId)).length === 0 && (
                      <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No vendors added yet</p>
                        <p className="text-gray-400 mt-2">Go to Catalogs tab to add vendors</p>
                      </div>
                    )}
                  </div>
                )}
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
                          src={getImageUrl(catalogFormData.image)} 
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
                          href={getPdfUrl(catalogFormData.pdfFile)}
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

                {/* Page-wise Product Code Entry */}
                {showPageEntryMode && (
                  <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        Add Product Codes Page-wise (PDF has {pdfTotalPages} pages)
                      </h3>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSkipPageEntry}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all text-sm"
                        >
                          Skip & Auto-extract
                        </button>
                        <button
                          type="button"
                          onClick={handleFinishPageEntry}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm"
                        >
                          Finish & Create Catalog
                        </button>
                      </div>
                    </div>

                    {/* Auto-Generate Codes Section */}
                    <div className="bg-white p-4 rounded-xl border-2 border-purple-200 mb-6">
                      <h4 className="font-bold text-gray-900 mb-3">Auto-Generate Product Codes</h4>
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Base Code Pattern
                          </label>
                          <input
                            type="text"
                            value={catalogFormData.baseCodePattern || ''}
                            onChange={(e) => setCatalogFormData({ ...catalogFormData, baseCodePattern: e.target.value })}
                            placeholder="e.g., ADB-000 or AH-00"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Enter base pattern with zeros (e.g., ADB-000). System will auto-generate: ADB-001, ADB-002, etc.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAutoGenerateCodes}
                          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-bold hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg"
                        >
                          Auto-Generate All Codes
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {Array.from({ length: pdfTotalPages }, (_, i) => i + 1).map(pageNum => (
                        <div key={pageNum} className="bg-white p-4 rounded-lg border">
                          <div className="flex items-center gap-4 mb-2">
                            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                              {pageNum}
                            </span>
                            <label className="flex-1 font-medium text-gray-900">
                              Product Codes for Page {pageNum}
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentPDF(getPdfUrl(catalogFormData.pdfFile));
                                setCurrentProductPage(pageNum);
                                setShowPDFViewer(true);
                              }}
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <FileText size={16} />
                              View Page
                            </button>
                          </div>
                          <input
                            type="text"
                            value={pageProductCodes[pageNum] || ''}
                            onChange={(e) => handlePageCodeEntry(pageNum, e.target.value)}
                            placeholder="Enter product codes separated by commas (e.g., AH-001, AH-002, DNO-01)"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Separate multiple codes with commas. Codes will be assigned to page {pageNum}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted Products Section */}
                {extractedProducts.length > 0 && !showPageEntryMode && (
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

                {/* Price Range Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Range</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Price</label>
                      <input
                        type="number"
                        value={catalogFormData.minPrice}
                        onChange={(e) => setCatalogFormData({ ...catalogFormData, minPrice: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Maximum Price</label>
                      <input
                        type="number"
                        value={catalogFormData.maxPrice}
                        onChange={(e) => setCatalogFormData({ ...catalogFormData, maxPrice: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
                      <select
                        value={catalogFormData.currency}
                        onChange={(e) => setCatalogFormData({ ...catalogFormData, currency: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      >
                        <option value="₹">₹ (INR)</option>
                        <option value="$">$ (USD)</option>
                        <option value="€">€ (EUR)</option>
                      </select>
                    </div>
                  </div>
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
                    disabled={showPageEntryMode}
                    className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
                      showPageEntryMode 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-500 hover:to-yellow-600'
                    }`}
                  >
                    {showPageEntryMode ? 'Complete Page Entry First' : (editingCatalog ? 'Update Catalog' : 'Create Catalog')}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Codes from Catalog</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="selectAllProducts"
                        checked={selectedCatalog && selectedCatalog.products && 
                          vendorFormData.productCodes.length === selectedCatalog.products.length}
                        onChange={(e) => {
                          if (e.target.checked && selectedCatalog && selectedCatalog.products) {
                            setVendorFormData({
                              ...vendorFormData,
                              productCodes: selectedCatalog.products.map(p => p.code)
                            });
                          } else {
                            setVendorFormData({
                              ...vendorFormData,
                              productCodes: []
                            });
                          }
                        }}
                        className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                      />
                      <label htmlFor="selectAllProducts" className="text-sm font-medium text-gray-700">
                        Select All Products ({selectedCatalog && selectedCatalog.products ? selectedCatalog.products.length : 0})
                      </label>
                    </div>
                    
                    <div className="max-h-48 overflow-y-auto border-2 border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
                      {selectedCatalog && selectedCatalog.products && selectedCatalog.products.length > 0 ? (
                        selectedCatalog.products.map((product, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors">
                            <input
                              type="checkbox"
                              id={`product-${index}`}
                              checked={vendorFormData.productCodes.includes(product.code)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setVendorFormData({
                                    ...vendorFormData,
                                    productCodes: [...vendorFormData.productCodes, product.code]
                                  });
                                } else {
                                  setVendorFormData({
                                    ...vendorFormData,
                                    productCodes: vendorFormData.productCodes.filter(code => code !== product.code)
                                  });
                                }
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                            />
                            <label htmlFor={`product-${index}`} className="flex-1 text-sm cursor-pointer">
                              <span className="font-medium text-gray-900">{product.code}</span>
                              <span className="text-gray-600 ml-2">
                                {product.name || 'Product'} (Page {product.page})
                              </span>
                            </label>
                            {selectedCatalog.pdfFile && (
                              <button
                                type="button"
                                onClick={() => handleViewProductPage(selectedCatalog._id, product.code)}
                                className="text-blue-600 hover:text-blue-800 text-xs"
                              >
                                <FileText size={14} />
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No products available in this catalog
                        </p>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      {vendorFormData.productCodes.length} product code(s) will be stored with this vendor
                    </p>
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

                {/* Price Range Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Range (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Price</label>
                      <input
                        type="number"
                        value={vendorFormData.minPrice}
                        onChange={(e) => setVendorFormData({ ...vendorFormData, minPrice: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Leave empty to use main price"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Maximum Price</label>
                      <input
                        type="number"
                        value={vendorFormData.maxPrice}
                        onChange={(e) => setVendorFormData({ ...vendorFormData, maxPrice: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Leave empty to use main price"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
                      <select
                        value={vendorFormData.currency}
                        onChange={(e) => setVendorFormData({ ...vendorFormData, currency: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      >
                        <option value="₹">₹ (INR)</option>
                        <option value="$">$ (USD)</option>
                        <option value="€">€ (EUR)</option>
                      </select>
                    </div>
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
