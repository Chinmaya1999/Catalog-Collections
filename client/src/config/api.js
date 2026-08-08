// API Configuration
export const API_BASE_URL = 'https://api.adihuman.com';

export const API_ENDPOINTS = {
  catalog: `${API_BASE_URL}/api/catalog`,
  category: `${API_BASE_URL}/api/category`,
  auth: `${API_BASE_URL}/api/auth`,
  admin: `${API_BASE_URL}/api/admin`,
  vendor: `${API_BASE_URL}/api/vendor`,
  contact: `${API_BASE_URL}/api/contact`,
  catalogRequest: `${API_BASE_URL}/api/catalog-request`,
  health: `${API_BASE_URL}/api/health`
};

// Helper function to get image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  return imagePath.startsWith('/uploads') ? `${API_BASE_URL}${imagePath}` : imagePath;
};

// Helper function to get PDF URL
export const getPdfUrl = (pdfPath) => {
  if (!pdfPath) return '';
  return pdfPath.startsWith('/uploads') ? `${API_BASE_URL}${pdfPath}` : pdfPath;
};
