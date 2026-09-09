const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const ExtractionJob = require('../../models/ExtractionJob');
const Product = require('../../models/Product');
const { renderPage } = require('./render');
const { extractPageImages } = require('./imageExtract');
const { structurePage } = require('./heuristicStructure');
const { getPageText } = require('./pageText');
const { POOL_SIZE } = require('./ocr');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const JOBS_DIR = path.join(UPLOADS_DIR, 'product-extraction', 'jobs');
// Matches the OCR worker pool size (see ocr.js) - each concurrent page slot needs its own
// tesseract worker, so this can't exceed POOL_SIZE without pages contending for one.
const PAGE_CONCURRENCY = POOL_SIZE;

function toPublicPath(absPath) {
  const rel = path.relative(UPLOADS_DIR, absPath).split(path.sep).join('/');
  return `/uploads/${rel}`;
}

async function mapWithConcurrency(items, limit, worker) {
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index], index);
    }
  }
  const runners = Array.from({ length: Math.min(limit, items.length) }, run);
  await Promise.all(runners);
}

// Best-effort assignment of extracted page images to variant hero shots / color
// thumbnails, biggest-first. Nothing is discarded: every extracted image is still
// stored on the product so an admin can fix a wrong match in the review UI.
function assignImages(images, variants, colors) {
  const photos = images.filter(img => img.isLikelyPhoto);
  const heroes = photos.slice(0, variants.length || 1);
  const thumbs = photos.slice(heroes.length, heroes.length + colors.length);

  const productImages = images.map((img, i) => ({
    path: toPublicPath(img.path),
    width: img.width,
    height: img.height,
    isPrimary: false,
    source: 'embedded'
  }));

  const pathIndex = new Map(images.map((img, i) => [img.path, i]));

  const heroPaths = heroes.map(h => toPublicPath(h.path));
  if (heroPaths.length && productImages.length) {
    const primaryIdx = pathIndex.get(heroes[0].path);
    if (primaryIdx !== undefined) productImages[primaryIdx].isPrimary = true;
  }

  return {
    productImages,
    variantHeroPaths: heroPaths,
    colorThumbPaths: thumbs.map(t => toPublicPath(t.path))
  };
}

async function findDuplicate(skus) {
  const cleanSkus = skus.filter(Boolean);
  if (cleanSkus.length === 0) return null;
  const existing = await Product.findOne({
    status: 'approved',
    'variants.sku': { $in: cleanSkus }
  });
  return existing ? existing._id : null;
}

async function processPage(job, pdfPath, pageNumber) {
  const pagesDir = path.join(JOBS_DIR, String(job._id), 'pages');
  const imagesDir = path.join(JOBS_DIR, String(job._id), 'images', String(pageNumber));

  const pageImagePath = await renderPage(pdfPath, pageNumber, pagesDir);
  const images = await extractPageImages(pdfPath, pageNumber, imagesDir);
  const { pageCode } = await getPageText(pdfPath, pageNumber);
  const structured = await structurePage(pageImagePath);

  if (!structured.isProductPage || !Array.isArray(structured.products) || structured.products.length === 0) {
    return { productsCreated: 0, imagesFound: images.length, skipped: true };
  }

  let productsCreated = 0;
  for (const raw of structured.products) {
    const variants = Array.isArray(raw.variants) ? raw.variants : [];
    const colors = Array.isArray(raw.colors) ? raw.colors : [];
    const { productImages, variantHeroPaths, colorThumbPaths } = assignImages(images, variants, colors);

    const variantDocs = variants.map((v, i) => ({
      sku: v.sku ?? null,
      description: v.description ?? null,
      dimensionsCm: v.dimensionsCm ?? null,
      weightKg: typeof v.weightKg === 'number' ? v.weightKg : null,
      volumeLtr: typeof v.volumeLtr === 'number' ? v.volumeLtr : null,
      mrp: typeof v.mrp === 'number' ? v.mrp : null,
      sellingPrice: null,
      heroImage: variantHeroPaths[i] || variantHeroPaths[0] || null
    }));

    const colorDocs = colors.map((c, i) => ({
      name: c.name ?? null,
      code: c.code ?? null,
      thumbnailImage: colorThumbPaths[i] || null
    }));

    const duplicateOf = await findDuplicate(variantDocs.map(v => v.sku));

    const product = new Product({
      name: raw.name ?? null,
      brand: raw.brand ?? null,
      material: raw.material ?? null,
      description: raw.description ?? null,
      badges: Array.isArray(raw.badges) ? raw.badges : [],
      variants: variantDocs,
      colors: colorDocs,
      images: productImages,
      source: {
        jobId: job._id,
        pageNumber,
        pageCode,
        pageImage: toPublicPath(pageImagePath),
        rawAiJson: raw,
        confidence: typeof raw.confidence === 'number' ? raw.confidence : null
      },
      status: 'pending',
      possibleDuplicateOf: duplicateOf
    });
    await product.save();
    productsCreated += 1;
  }

  return { productsCreated, imagesFound: images.length, skipped: false };
}

function resolvePdfPath(job) {
  return job.filePath.startsWith('/uploads')
    ? path.join(UPLOADS_DIR, job.filePath.replace(/^\/uploads\//, ''))
    : job.filePath;
}

async function runJob(jobId) {
  const job = await ExtractionJob.findById(jobId);
  if (!job) return;

  const absolutePdfPath = resolvePdfPath(job);

  let pdfBytes;
  try {
    pdfBytes = await fs.promises.readFile(absolutePdfPath);
  } catch (err) {
    job.status = 'failed';
    job.errorMessage = `Could not read uploaded PDF: ${err.message}`;
    await job.save();
    return;
  }

  let totalPages;
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    totalPages = pdfDoc.getPageCount();
  } catch (err) {
    job.status = 'failed';
    job.errorMessage = `Could not open PDF: ${err.message}`;
    await job.save();
    return;
  }

  job.totalPages = totalPages;
  job.status = 'processing';
  await job.save();

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  await mapWithConcurrency(pageNumbers, PAGE_CONCURRENCY, async (pageNumber) => {
    try {
      const result = await processPage(job, absolutePdfPath, pageNumber);
      await ExtractionJob.findByIdAndUpdate(job._id, {
        $inc: {
          processedPages: 1,
          productsFound: result.productsCreated,
          imagesFound: result.imagesFound
        },
        $set: { currentPage: pageNumber },
        ...(result.skipped ? { $push: { skippedPages: pageNumber } } : {})
      });
    } catch (err) {
      await ExtractionJob.findByIdAndUpdate(job._id, {
        $inc: { processedPages: 1 },
        $set: { currentPage: pageNumber },
        $push: { failedPages: { page: pageNumber, error: err.message } }
      });
    }
  });

  const finalJob = await ExtractionJob.findById(job._id);
  finalJob.status = finalJob.failedPages.length >= totalPages ? 'failed' : 'completed';
  if (finalJob.status === 'failed' && !finalJob.errorMessage) {
    finalJob.errorMessage = 'All pages failed to process.';
  }
  await finalJob.save();
}

// A simple single-flight queue so only one PDF is processed at a time.
const queue = [];
let running = false;

async function drainQueue() {
  if (running) return;
  running = true;
  while (queue.length > 0) {
    const jobId = queue.shift();
    try {
      await runJob(jobId);
    } catch (err) {
      await ExtractionJob.findByIdAndUpdate(jobId, {
        status: 'failed',
        errorMessage: err.message
      }).catch(() => {});
    }
  }
  running = false;
}

function enqueueJob(jobId) {
  queue.push(jobId);
  drainQueue();
}

async function retryFailedPages(jobId) {
  const job = await ExtractionJob.findById(jobId);
  if (!job || job.failedPages.length === 0) return;

  const absolutePdfPath = resolvePdfPath(job);

  const pagesToRetry = job.failedPages.map(f => f.page);
  job.failedPages = [];
  job.status = 'processing';
  await job.save();

  await mapWithConcurrency(pagesToRetry, PAGE_CONCURRENCY, async (pageNumber) => {
    try {
      const result = await processPage(job, absolutePdfPath, pageNumber);
      await ExtractionJob.findByIdAndUpdate(job._id, {
        $inc: {
          productsFound: result.productsCreated,
          imagesFound: result.imagesFound
        },
        ...(result.skipped ? { $push: { skippedPages: pageNumber } } : {})
      });
    } catch (err) {
      await ExtractionJob.findByIdAndUpdate(job._id, {
        $push: { failedPages: { page: pageNumber, error: err.message } }
      });
    }
  });

  const finalJob = await ExtractionJob.findById(job._id);
  finalJob.status = finalJob.failedPages.length >= finalJob.totalPages ? 'failed' : 'completed';
  await finalJob.save();
}

module.exports = { enqueueJob, retryFailedPages };
