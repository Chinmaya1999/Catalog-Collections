const express = require('express');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const XLSX = require('xlsx');

const ExtractionJob = require('../models/ExtractionJob');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { enqueueJob, retryFailedPages } = require('../services/extraction/pipeline');

const router = express.Router();
const UPLOADS_DIR = path.join(__dirname, '../uploads');

const superadminOnly = (req, res, next) => {
  if (!req.admin || req.admin.role !== 'superadmin') {
    return res.status(403).json({ message: 'Superadmin access required' });
  }
  next();
};

router.use(auth, superadminOnly);

// ==================== Upload & Jobs ====================

router.post('/upload', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  if (req.file.mimetype !== 'application/pdf') {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ message: 'Only PDF files are allowed' });
  }

  try {
    const job = new ExtractionJob({
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: `/uploads/product-extraction/pdfs/${req.file.filename}`,
      fileSize: req.file.size,
      status: 'uploaded',
      uploadedBy: req.admin._id
    });
    await job.save();

    enqueueJob(job._id);

    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating extraction job:', error);
    res.status(500).json({ message: 'Error creating extraction job: ' + error.message });
  }
});

router.get('/jobs', async (req, res) => {
  try {
    const jobs = await ExtractionJob.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs' });
  }
});

router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await ExtractionJob.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching job' });
  }
});

router.post('/jobs/:id/retry', async (req, res) => {
  try {
    const job = await ExtractionJob.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.failedPages.length === 0) {
      return res.status(400).json({ message: 'This job has no failed pages to retry' });
    }
    retryFailedPages(job._id).catch(err => console.error('Retry failed:', err));
    res.json({ message: 'Retry started' });
  } catch (error) {
    res.status(500).json({ message: 'Error retrying job' });
  }
});

router.delete('/jobs/:id', async (req, res) => {
  try {
    const job = await ExtractionJob.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    await Product.deleteMany({ 'source.jobId': job._id });

    const pdfPath = path.join(UPLOADS_DIR, job.filePath.replace(/^\/uploads\//, ''));
    fs.unlink(pdfPath, () => {});
    const jobAssetsDir = path.join(UPLOADS_DIR, 'product-extraction', 'jobs', String(job._id));
    fs.rm(jobAssetsDir, { recursive: true, force: true }, () => {});

    await ExtractionJob.findByIdAndDelete(job._id);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Error deleting job' });
  }
});

// ==================== Products ====================

router.get('/products', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.jobId) filter['source.jobId'] = req.query.jobId;
    const products = await Product.find(filter).sort({ 'source.pageNumber': 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product' });
  }
});

const EDITABLE_FIELDS = ['name', 'brand', 'material', 'description', 'badges', 'variants', 'colors', 'images'];

router.put('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    EDITABLE_FIELDS.forEach(field => {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    });

    await product.save();
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product: ' + error.message });
  }
});

router.post('/products/:id/approve', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error approving product' });
  }
});

router.post('/products/:id/reject', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting product' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product' });
  }
});

router.post('/products/:id/images/:imageId/primary', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let found = false;
    product.images.forEach(img => {
      const isMatch = img._id.toString() === req.params.imageId;
      img.isPrimary = isMatch;
      if (isMatch) found = true;
    });
    if (!found) return res.status(404).json({ message: 'Image not found on product' });

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error setting primary image' });
  }
});

router.delete('/products/:id/images/:imageId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.images = product.images.filter(img => img._id.toString() !== req.params.imageId);
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting image' });
  }
});

// ==================== Export ====================

function flattenProduct(product) {
  const rows = [];
  const variants = product.variants.length > 0 ? product.variants : [{}];
  const colors = product.colors.map(c => `${c.name || ''}${c.code ? ':' + c.code : ''}`).join('; ');
  const primaryImage = (product.images.find(i => i.isPrimary) || product.images[0] || {}).path || '';
  variants.forEach(v => {
    rows.push({
      'Page Code': product.source?.pageCode || '',
      'Product Name': product.name || '',
      'Material': product.material || '',
      'SKU Code': v.sku || '',
      'Description': v.description || '',
      'Dimensions (L x H x W, cm)': v.dimensionsCm || '',
      'Weight (kg)': v.weightKg ?? '',
      'Volume (ltrs)': v.volumeLtr ?? '',
      'MRP (INR)': v.mrp ?? '',
      'Colour Options': colors,
      'Primary Image': primaryImage,
      'Source Page #': product.source?.pageNumber ?? ''
    });
  });
  return rows;
}

router.get('/export/json', async (req, res) => {
  try {
    const products = await Product.find({ status: 'approved' });
    res.setHeader('Content-Disposition', 'attachment; filename=products.json');
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: 'Error exporting JSON' });
  }
});

router.get('/export/csv', async (req, res) => {
  try {
    const products = await Product.find({ status: 'approved' });
    const rows = products.flatMap(flattenProduct);
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting CSV' });
  }
});

router.get('/export/zip', async (req, res) => {
  try {
    const products = await Product.find({ status: 'approved' });
    const rows = products.flatMap(flattenProduct);
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=catalog-export.zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', err => { throw err; });
    archive.pipe(res);

    archive.append(JSON.stringify({ products }, null, 2), { name: 'products.json' });
    archive.append(csv, { name: 'products.csv' });

    for (const product of products) {
      for (const img of product.images) {
        const absPath = path.join(UPLOADS_DIR, img.path.replace(/^\/uploads\//, ''));
        if (fs.existsSync(absPath)) {
          archive.file(absPath, { name: `images/${product._id}/${path.basename(img.path)}` });
        }
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('Error exporting ZIP:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error exporting ZIP' });
    }
  }
});

module.exports = router;
