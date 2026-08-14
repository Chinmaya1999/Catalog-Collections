const express = require('express');
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { PDFDocument } = require('pdf-lib');
const PdfDocument = require('../models/PdfDocument');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Restrict every route in this file to superadmins
const superadminOnly = (req, res, next) => {
  if (!req.admin || req.admin.role !== 'superadmin') {
    return res.status(403).json({ message: 'Superadmin access required' });
  }
  next();
};

// ==================== Type Detection ====================
function detectPdfType(text) {
  const lowerText = text.toLowerCase();
  const scores = { invoice: 0, 'vendor-list': 0, 'price-list': 0, catalog: 0 };

  const invoiceKeywords = ['invoice no', 'tax invoice', 'bill to', 'invoice date', 'gstin', 'total amount', 'invoice number'];
  invoiceKeywords.forEach(k => { if (lowerText.includes(k)) scores.invoice += 15; });

  const vendorKeywords = ['vendor', 'supplier', 'contact person', 'contact no'];
  vendorKeywords.forEach(k => { if (lowerText.includes(k)) scores['vendor-list'] += 10; });
  const phoneMatches = text.match(/\b[6-9]\d{9}\b|\+91[\s-]?\d{10}/g) || [];
  scores['vendor-list'] += Math.min(phoneMatches.length * 3, 30);

  const currencyMatches = text.match(/[₹$€]\s?\d[\d,]*(\.\d+)?|Rs\.?\s?\d[\d,]*/gi) || [];
  scores['price-list'] += Math.min(currencyMatches.length * 2, 40);
  const priceKeywords = ['price list', 'mrp', 'unit price', 'rate'];
  priceKeywords.forEach(k => { if (lowerText.includes(k)) scores['price-list'] += 8; });

  const codePatterns = [/AH[-\s]?\d{3}/gi, /DNO[-\s]?\d{2}/gi, /HGS[-\s]?D\d{3}/gi, /\b[A-Z]{2,4}-\d{2,4}\b/g];
  let codeMatches = 0;
  codePatterns.forEach(p => { codeMatches += (text.match(p) || []).length; });
  scores.catalog += Math.min(codeMatches * 4, 40);
  if (lowerText.includes('catalog') || lowerText.includes('sku') || lowerText.includes('product code')) {
    scores.catalog += 10;
  }

  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topType, topScore] = entries[0];
  const totalScore = entries.reduce((sum, [, s]) => sum + s, 0) || 1;

  if (topScore < 10) {
    return { detectedType: 'unknown', confidence: 0 };
  }

  const confidence = Math.round(Math.min((topScore / totalScore) * 100, 100));
  return { detectedType: topType, confidence };
}

// ==================== Generic Table Extraction ====================
function isNumericCell(cell) {
  return /^[\d.,₹$€%\-]+$/.test(cell);
}

function extractTableFromText(text) {
  const rawLines = text.split('\n').map(l => l.replace(/\s+$/, '')).filter(l => l.trim().length > 0);
  const splitLine = (line) => line.split(/\t+|\s{2,}/).map(c => c.trim()).filter(c => c.length > 0);
  const candidateRows = rawLines.map(splitLine);

  const countFrequency = {};
  candidateRows.forEach(cells => {
    if (cells.length >= 2) {
      countFrequency[cells.length] = (countFrequency[cells.length] || 0) + 1;
    }
  });

  const counts = Object.entries(countFrequency);
  if (counts.length === 0) {
    return { columns: [], rows: [] };
  }

  counts.sort((a, b) => b[1] - a[1]);
  const columnCount = parseInt(counts[0][0], 10);
  const matchingRows = candidateRows.filter(cells => cells.length === columnCount);

  if (matchingRows.length === 0) {
    return { columns: [], rows: [] };
  }

  const firstRow = matchingRows[0];
  const nonNumericCount = firstRow.filter(c => !isNumericCell(c)).length;
  const looksLikeHeader = nonNumericCount >= Math.ceil(columnCount / 2) && matchingRows.length > 1;

  let columns;
  let dataRows;
  if (looksLikeHeader) {
    columns = firstRow.map((c, i) => c || `Column ${i + 1}`);
    dataRows = matchingRows.slice(1);
  } else {
    columns = Array.from({ length: columnCount }, (_, i) => `Column ${i + 1}`);
    dataRows = matchingRows;
  }

  const seenCols = {};
  columns = columns.map(c => {
    const base = c || 'Column';
    seenCols[base] = (seenCols[base] || 0) + 1;
    return seenCols[base] > 1 ? `${base} (${seenCols[base]})` : base;
  });

  const MAX_ROWS = 2000;
  const rows = dataRows.slice(0, MAX_ROWS).map(cells => {
    const row = {};
    columns.forEach((col, i) => { row[col] = cells[i] !== undefined ? cells[i] : ''; });
    return row;
  });

  return { columns, rows };
}

// ==================== Routes ====================

// Upload + analyze a PDF (superadmin only)
router.post('/upload', auth, superadminOnly, upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const filePath = `/uploads/pdfs/analysis/${req.file.filename}`;

  try {
    const pdfBytes = fs.readFileSync(req.file.path);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const totalPages = pdfDoc.getPageCount();

    const parser = new PDFParse({ data: pdfBytes });
    const parsed = await parser.getText();
    await parser.destroy();
    const text = parsed.text || '';

    const { detectedType, confidence } = detectPdfType(text);
    const { columns, rows } = extractTableFromText(text);

    const doc = new PdfDocument({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath,
      fileSize: req.file.size,
      totalPages,
      detectedType,
      confidence,
      columns,
      extractedRows: rows,
      rowCount: rows.length,
      rawTextPreview: text.slice(0, 1000),
      status: 'completed',
      uploadedBy: req.admin._id
    });

    await doc.save();
    res.status(201).json(doc);
  } catch (error) {
    console.error('Error analyzing PDF:', error);

    const doc = new PdfDocument({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath,
      fileSize: req.file.size,
      status: 'failed',
      errorMessage: error.message,
      uploadedBy: req.admin._id
    });
    await doc.save().catch(() => {});

    res.status(500).json({ message: 'Error analyzing PDF: ' + error.message, document: doc });
  }
});

// List all analyzed PDFs (light projection for history list)
router.get('/', auth, superadminOnly, async (req, res) => {
  try {
    const documents = await PdfDocument.find()
      .select('-extractedRows -rawTextPreview')
      .sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    console.error('Error fetching PDF documents:', error);
    res.status(500).json({ message: 'Error fetching PDF documents' });
  }
});

// Get a single analyzed PDF with full extracted rows
router.get('/:id', auth, superadminOnly, async (req, res) => {
  try {
    const document = await PdfDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    console.error('Error fetching PDF document:', error);
    res.status(500).json({ message: 'Error fetching PDF document' });
  }
});

// Delete an analyzed PDF (record + file)
router.delete('/:id', auth, superadminOnly, async (req, res) => {
  try {
    const document = await PdfDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const absolutePath = path.join(__dirname, '..', document.filePath);
    fs.unlink(absolutePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Error deleting PDF file:', err);
      }
    });

    await PdfDocument.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting PDF document:', error);
    res.status(500).json({ message: 'Error deleting PDF document' });
  }
});

module.exports = router;
