const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories for different file types
const categoriesDir = path.join(uploadsDir, 'categories');
const catalogsDir = path.join(uploadsDir, 'catalogs');
const filesDir = path.join(uploadsDir, 'files');
const pdfsDir = path.join(uploadsDir, 'pdfs');

[categoriesDir, catalogsDir, filesDir, pdfsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadsDir;
    
    // Check the original URL to determine destination
    const originalUrl = req.originalUrl;
    
    if (originalUrl.includes('/catalog/image')) {
      uploadPath = catalogsDir;
    } else if (originalUrl.includes('/category-image')) {
      uploadPath = categoriesDir;
    } else if (originalUrl.includes('/catalog/pdf')) {
      uploadPath = pdfsDir;
    } else if (originalUrl.includes('/file')) {
      uploadPath = filesDir;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const isImage = /jpeg|jpg|png|gif/.test(file.mimetype);
  const isPdf = file.mimetype === 'application/pdf';

  if (extname && (isImage || isPdf)) {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDFs are allowed'));
  }
};

// Upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: fileFilter
});

module.exports = upload;
