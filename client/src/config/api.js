// API Configuration
// Use relative paths to leverage nginx proxy (no CORS issues)
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // Empty string for relative paths through nginx
  : 'https://api.adihuman.com';

export const API_ENDPOINTS = {
  catalog: `${API_BASE_URL}/api/catalog`,
  category: `${API_BASE_URL}/api/category`,
  auth: `${API_BASE_URL}/api/auth`,
  admin: `${API_BASE_URL}/api/admin`,
  vendor: `${API_BASE_URL}/api/vendor`,
  health: `${API_BASE_URL}/api/health`
};

// Helper function to get image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  // Use relative paths for uploads served through nginx proxy
  return imagePath.startsWith('/uploads') ? imagePath : imagePath;
};

// Helper function to get PDF URL
export const getPdfUrl = (pdfPath) => {
  if (!pdfPath) return '';
  // Use relative paths for uploads served through nginx proxy
  return pdfPath.startsWith('/uploads') ? pdfPath : pdfPath;
};