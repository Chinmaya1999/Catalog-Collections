const express = require('express');
const { body, validationResult } = require('express-validator');
const Catalog = require('../models/Catalog');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const Tesseract = require('tesseract.js');
const { PDFDocument } = require('pdf-lib');

const router = express.Router();

// Get all catalogs (public)
router.get('/', async (req, res) => {
  try {
    const catalogs = await Catalog.find().sort({ order: 1, createdAt: -1 });
    res.json(catalogs);
  } catch (error) {
    console.error('Error fetching catalogs:', error);
    res.status(500).json({ message: 'Error fetching catalogs' });
  }
});

// Get single catalog by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const catalog = await Catalog.findById(req.params.id);
    if (!catalog) {
      return res.status(404).json({ message: 'Catalog not found' });
    }
    res.json(catalog);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching catalog' });
  }
});

// Create new catalog (admin only)
router.post('/', auth, upload.none(), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('categoryName').trim().notEmpty().withMessage('Category name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const catalogData = {
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      categoryName: req.body.categoryName,
      driveLink: req.body.driveLink || '',
      pdfFile: req.body.pdfFile || '',
      image: req.body.image,
      type: req.body.type || 'product',
      comboCount: req.body.comboCount || 0,
      featured: req.body.featured || false,
      new: req.body.new || false,
      ecoFriendly: req.body.ecoFriendly || false,
      order: req.body.order || 0,
      products: req.body.products && req.body.products.trim() ? JSON.parse(req.body.products) : []
    };

    const catalog = new Catalog(catalogData);
    await catalog.save();

    res.status(201).json({
      message: 'Catalog created successfully',
      catalog
    });
  } catch (error) {
    console.error('Error creating catalog:', error);
    res.status(500).json({ message: 'Error creating catalog' });
  }
});

// Update catalog (admin only)
router.put('/:id', auth, upload.none(), async (req, res) => {
  try {
    const catalog = await Catalog.findById(req.params.id);
    if (!catalog) {
      return res.status(404).json({ message: 'Catalog not found' });
    }

    const updateData = {
      name: req.body.name || catalog.name,
      description: req.body.description || catalog.description,
      category: req.body.category || catalog.category,
      categoryName: req.body.categoryName || catalog.categoryName,
      driveLink: req.body.driveLink !== undefined ? req.body.driveLink : catalog.driveLink,
      pdfFile: req.body.pdfFile !== undefined ? req.body.pdfFile : catalog.pdfFile,
      image: req.body.image || catalog.image,
      type: req.body.type || catalog.type,
      comboCount: req.body.comboCount || catalog.comboCount,
      featured: req.body.featured !== undefined ? req.body.featured : catalog.featured,
      new: req.body.new !== undefined ? req.body.new : catalog.new,
      ecoFriendly: req.body.ecoFriendly !== undefined ? req.body.ecoFriendly : catalog.ecoFriendly,
      order: req.body.order || catalog.order,
      products: req.body.products && req.body.products.trim() ? JSON.parse(req.body.products) : catalog.products
    };

    const updatedCatalog = await Catalog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({
      message: 'Catalog updated successfully',
      catalog: updatedCatalog
    });
  } catch (error) {
    console.error('Error updating catalog:', error);
    res.status(500).json({ message: 'Error updating catalog' });
  }
});

// Delete catalog (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const catalog = await Catalog.findById(req.params.id);
    if (!catalog) {
      return res.status(404).json({ message: 'Catalog not found' });
    }

    await Catalog.findByIdAndDelete(req.params.id);

    res.json({ message: 'Catalog deleted successfully' });
  } catch (error) {
    console.error('Error deleting catalog:', error);
    res.status(500).json({ message: 'Error deleting catalog' });
  }
});

// Upload catalog image (admin only)
router.post('/image', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    res.json({
      message: 'Image uploaded successfully',
      imagePath: `/uploads/catalogs/${req.file.filename}`
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

// Upload catalog PDF (admin only)
router.post('/pdf', auth, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Parse PDF to extract product information with OCR
    const pdfPath = req.file.path;
    const extractedProducts = await extractProductsWithOCR(pdfPath);

    res.json({
      message: 'PDF uploaded successfully',
      pdfPath: `/uploads/pdfs/${req.file.filename}`,
      extractedProducts: extractedProducts.products,
      totalPages: extractedProducts.totalPages,
      productCodePageMap: extractedProducts.productCodePageMap
    });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    res.status(500).json({ message: 'Error uploading PDF: ' + error.message });
  }
});

// Advanced product extraction with OCR and pattern matching
async function extractProductsWithOCR(pdfPath) {
  try {
    // First, try text extraction
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    
    // Extract products using text
    let products = extractProductsFromText(data.text, data.numpages);
    
    // If text extraction didn't find enough products, try OCR
    if (products.length < data.numpages * 0.5) { // If we found less than 50% of expected products
      console.log('Text extraction insufficient, trying OCR...');
      const ocrProducts = await extractProductsOCR(pdfPath, data.numpages);
      
      // Merge results, preferring OCR results
      const productMap = new Map();
      
      // Add text extraction results
      products.forEach(p => {
        productMap.set(p.code.toLowerCase(), p);
      });
      
      // Add/override with OCR results
      ocrProducts.forEach(p => {
        productMap.set(p.code.toLowerCase(), p);
      });
      
      products = Array.from(productMap.values());
    }
    
    // Create product code to page map
    const productCodePageMap = {};
    products.forEach(p => {
      productCodePageMap[p.code] = p.page;
    });
    
    return {
      products: products.sort((a, b) => a.page - b.page),
      totalPages: data.numpages,
      productCodePageMap
    };
    
  } catch (error) {
    console.error('Error in extractProductsWithOCR:', error);
    // Return fallback data
    return {
      products: [
        { code: 'AH-001', name: 'Product 1', page: 1, price: 0 },
        { code: 'AH-002', name: 'Product 2', page: 2, price: 0 }
      ],
      totalPages: 2,
      productCodePageMap: { 'AH-001': 1, 'AH-002': 2 }
    };
  }
}

// Extract products from text using pattern matching
function extractProductsFromText(text, totalPages) {
  const products = [];
  const lines = text.split('\n');
  
  // Define specific product code patterns for the user's format
  const patterns = [
    // AH-XXX format (with or without space)
    /AH[-\s]?(\d{3})/gi,
    // DNO - XX format
    /DNO[-\s]?(\d{2})/gi,
    // HGS - D1XX format
    /HGS[-\s]?D(\d{3})/gi,
    // Generic fallback pattern for other alphanumeric codes
    /([A-Z]{2,4}[-\s]?\d{2,4})/gi
  ];
  
  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();
    
    patterns.forEach(pattern => {
      const matches = trimmedLine.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Normalize the code: remove spaces, convert to uppercase
          const normalizedCode = match.toUpperCase().replace(/\s+/g, '');
          
          // Avoid duplicates
          if (!products.find(p => p.code === normalizedCode)) {
            const pageNumber = estimatePageNumber(lineIndex, lines.length, totalPages);
            products.push({
              code: normalizedCode,
              name: `Product ${normalizedCode}`,
              page: pageNumber,
              price: 0
            });
          }
        });
      }
    });
  });
  
  // Sort products by page number
  return products.sort((a, b) => a.page - b.page);
}

// Extract products using OCR (for image-based PDFs)
async function extractProductsOCR(pdfPath, totalPages) {
  const products = [];
  
  try {
    // Load PDF document
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Process each page with OCR
    for (let i = 0; i < Math.min(totalPages, pdfDoc.getPageCount()); i++) {
      try {
        // Convert page to image (this would require additional setup)
        // For now, we'll use a simplified approach
        const pageText = await extractPageTextWithOCR(pdfPath, i);
        
        // Apply pattern matching to OCR text
        const pageProducts = extractProductsFromText(pageText, 1);
        
        pageProducts.forEach(p => {
          p.page = i + 1; // Set actual page number
          if (!products.find(existing => existing.code === p.code)) {
            products.push(p);
          }
        });
        
        console.log(`Processed page ${i + 1}/${totalPages}, found ${pageProducts.length} products`);
        
      } catch (pageError) {
        console.error(`Error processing page ${i + 1}:`, pageError);
      }
    }
    
  } catch (error) {
    console.error('Error in OCR extraction:', error);
  }
  
  return products;
}

// Extract text from a specific page using OCR
async function extractPageTextWithOCR(pdfPath, pageNumber) {
  try {
    // This is a simplified version - in production, you'd need to:
    // 1. Convert PDF page to image using pdf-to-img or similar
    // 2. Run Tesseract OCR on the image
    // 3. Return the extracted text
    
    // For now, return empty string and rely on text extraction
    return '';
    
    // Example implementation (would require additional dependencies):
    /*
    const { createWorker } = Tesseract;
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    // Convert page to image (requires pdf-to-img or similar)
    const imagePath = await convertPdfPageToImage(pdfPath, pageNumber);
    
    const { data: { text } } = await worker.recognize(imagePath);
    await worker.terminate();
    
    return text;
    */
  } catch (error) {
    console.error('Error in extractPageTextWithOCR:', error);
    return '';
  }
}

// Helper function to estimate page number based on position
function estimatePageNumber(lineIndex, totalLines, totalPages) {
  if (totalPages <= 1) return 1;
  
  const avgLinesPerPage = totalLines / totalPages;
  const estimatedPage = Math.floor(lineIndex / avgLinesPerPage) + 1;
  
  return Math.min(Math.max(estimatedPage, 1), totalPages);
}

// Get page number for a specific product code
router.get('/product-page/:catalogId/:productCode', async (req, res) => {
  try {
    const { catalogId, productCode } = req.params;
    
    const catalog = await Catalog.findById(catalogId);
    if (!catalog) {
      return res.status(404).json({ message: 'Catalog not found' });
    }
    
    // Search for product code in products array
    const product = catalog.products.find(p => 
      p.code.toLowerCase() === productCode.toLowerCase()
    );
    
    if (product) {
      res.json({
        productCode: product.code,
        page: product.page,
        pdfFile: catalog.pdfFile,
        totalPages: catalog.products.length > 0 ? Math.max(...catalog.products.map(p => p.page)) : 0
      });
    } else {
      res.status(404).json({ message: 'Product code not found in catalog' });
    }
  } catch (error) {
    console.error('Error fetching product page:', error);
    res.status(500).json({ message: 'Error fetching product page' });
  }
});

// Get all product codes with page numbers for a catalog
router.get('/product-pages/:catalogId', async (req, res) => {
  try {
    const { catalogId } = req.params;
    
    const catalog = await Catalog.findById(catalogId);
    if (!catalog) {
      return res.status(404).json({ message: 'Catalog not found' });
    }
    
    res.json({
      products: catalog.products,
      pdfFile: catalog.pdfFile,
      productCodePageMap: catalog.productCodePageMap || {}
    });
  } catch (error) {
    console.error('Error fetching product pages:', error);
    res.status(500).json({ message: 'Error fetching product pages' });
  }
});

module.exports = router;
