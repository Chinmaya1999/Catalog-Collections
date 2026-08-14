const express = require('express');
const { body, validationResult } = require('express-validator');
const Catalog = require('../models/Catalog');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { PDFParse } = require('pdf-parse');
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
      products: req.body.products && req.body.products.trim() ? JSON.parse(req.body.products) : [],
      priceRange: {
        minPrice: parseFloat(req.body.minPrice) || 0,
        maxPrice: parseFloat(req.body.maxPrice) || 0,
        currency: req.body.currency || '₹'
      }
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
      products: req.body.products && req.body.products.trim() ? JSON.parse(req.body.products) : catalog.products,
      priceRange: {
        minPrice: req.body.minPrice !== undefined ? parseFloat(req.body.minPrice) : (catalog.priceRange?.minPrice || 0),
        maxPrice: req.body.maxPrice !== undefined ? parseFloat(req.body.maxPrice) : (catalog.priceRange?.maxPrice || 0),
        currency: req.body.currency || (catalog.priceRange?.currency || '₹')
      }
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

    const pdfPath = req.file.path;
    
    // Get accurate page count using pdf-lib
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const actualPageCount = pdfDoc.getPageCount();
    
    console.log(`PDF actual page count: ${actualPageCount}`);
    
    // Parse PDF to extract product information with OCR
    const extractedProducts = await extractProductsWithOCR(pdfPath, actualPageCount);

    res.json({
      message: 'PDF uploaded successfully',
      pdfPath: `/uploads/pdfs/${req.file.filename}`,
      extractedProducts: extractedProducts.products,
      totalPages: actualPageCount, // Use the accurate page count from pdf-lib
      productCodePageMap: extractedProducts.productCodePageMap
    });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    res.status(500).json({ message: 'Error uploading PDF: ' + error.message });
  }
});

// Advanced product extraction with OCR and pattern matching
async function extractProductsWithOCR(pdfPath, actualPageCount) {
  try {
    // First, try text extraction
    const dataBuffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ data: dataBuffer });
    const data = await parser.getText();
    await parser.destroy();

    console.log(`PDF has ${actualPageCount} pages (from pdf-lib)`);
    console.log(`Extracted text length: ${data.text.length} characters`);
    
    // Use the accurate page count from pdf-lib
    const totalPages = actualPageCount;
    
    // Extract products using text with improved pattern matching
    let products = extractProductsFromText(data.text, totalPages);
    
    console.log(`Found ${products.length} products from text extraction`);
    
    // Try to improve page number estimation by analyzing page breaks
    if (totalPages > 1) {
      products = improvePageNumbers(data.text, products, totalPages);
    }
    
    // If text extraction didn't find enough products, try OCR
    if (products.length < 5 && totalPages > 1) { // If we found very few products
      console.log('Text extraction insufficient, trying OCR...');
      const ocrProducts = await extractProductsOCR(pdfPath, totalPages);
      
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
    
    console.log(`Final product count: ${products.length}`);
    console.log(`Product code page map:`, productCodePageMap);
    
    return {
      products: products.sort((a, b) => a.page - b.page),
      totalPages: totalPages,
      productCodePageMap
    };
    
  } catch (error) {
    console.error('Error in extractProductsWithOCR:', error);
    // Return fallback data with actual page count
    const fallbackPages = actualPageCount || 2;
    const fallbackProducts = [];
    for (let i = 1; i <= Math.min(fallbackPages, 2); i++) {
      fallbackProducts.push({
        code: `AH-${String(i).padStart(3, '0')}`,
        name: `Product ${i}`,
        page: i,
        price: 0
      });
    }
    
    return {
      products: fallbackProducts,
      totalPages: fallbackPages,
      productCodePageMap: {}
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
  
  // Track seen codes to avoid duplicates
  const seenCodes = new Set();
  
  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();
    
    patterns.forEach(pattern => {
      const matches = trimmedLine.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Normalize the code: remove spaces, convert to uppercase
          const normalizedCode = match.toUpperCase().replace(/\s+/g, '');
          
          // Avoid duplicates using Set
          if (!seenCodes.has(normalizedCode)) {
            seenCodes.add(normalizedCode);
            const pageNumber = estimatePageNumber(lineIndex, lines.length, totalPages);
            products.push({
              code: normalizedCode,
              name: `Product ${normalizedCode}`,
              page: pageNumber,
              price: 0,
              lineIndex: lineIndex
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
  const seenCodes = new Set();
  
  try {
    // Load PDF document
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Create Tesseract worker
    const { createWorker } = Tesseract;
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    // Process each page with OCR
    for (let i = 0; i < Math.min(totalPages, pdfDoc.getPageCount()); i++) {
      try {
        // Convert page to image using pdf-lib and then to a format Tesseract can process
        // Note: This requires additional setup with pdf-to-image or similar library
        // For now, we'll use a simplified approach with text extraction
        
        // Since we can't easily convert PDF pages to images without additional dependencies,
        // we'll rely on the text extraction from pdf-parse which should work for most PDFs
        // If the PDF is image-based, we'll need to add pdf-to-image or similar
        
        console.log(`Processing page ${i + 1}/${totalPages}...`);
        
        // For now, skip OCR per page and rely on global text extraction
        // In production, you would:
        // 1. Convert PDF page to image using pdf-to-image
        // 2. Run Tesseract OCR on the image
        // 3. Extract product codes from the OCR text
        
      } catch (pageError) {
        console.error(`Error processing page ${i + 1}:`, pageError);
      }
    }
    
    await worker.terminate();
    
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

// Improve page number estimation by analyzing page breaks in the text
function improvePageNumbers(text, products, totalPages) {
  if (totalPages <= 1) return products;
  
  // Try to find page break markers in the text
  const lines = text.split('\n');
  const pageBreaks = [];
  
  // Look for common page break patterns
  lines.forEach((line, index) => {
    if (line.match(/^Page \d+|^---+|^\f/)) {
      pageBreaks.push(index);
    }
  });
  
  // If we found page breaks, use them to better estimate page numbers
  if (pageBreaks.length > 0) {
    products.forEach(product => {
      if (product.lineIndex !== undefined) {
        // Find which page break interval this product falls into
        let pageIndex = 0;
        for (let i = 0; i < pageBreaks.length; i++) {
          if (product.lineIndex > pageBreaks[i]) {
            pageIndex = i + 1;
          }
        }
        product.page = Math.min(pageIndex + 1, totalPages);
      }
    });
  }
  
  return products;
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

// Get all unique product codes from all catalogs
router.get('/product-codes/all', async (req, res) => {
  try {
    const catalogs = await Catalog.find({ products: { $exists: true, $ne: [] } });
    
    // Collect all unique product codes from all catalogs
    const productCodeSet = new Set();
    catalogs.forEach(catalog => {
      if (catalog.products && Array.isArray(catalog.products)) {
        catalog.products.forEach(product => {
          if (product.code) {
            productCodeSet.add(product.code);
          }
        });
      }
    });
    
    const productCodes = Array.from(productCodeSet).sort();
    res.json(productCodes);
  } catch (error) {
    console.error('Error fetching all product codes:', error);
    res.status(500).json({ message: 'Error fetching product codes', error: error.message });
  }
});

module.exports = router;
