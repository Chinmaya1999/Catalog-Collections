// Builds public/sitemap.xml from the static pages plus every product in the API.
// Runs before `npm run build`; if the API is unreachable the existing sitemap is kept.
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://catalog.adihuman.com';
const API_URL = process.env.SITEMAP_API_URL || 'https://api.adihuman.com';
const OUT = path.join(__dirname, '..', 'public', 'sitemap.xml');

const staticPages = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/shop', changefreq: 'daily', priority: '0.9' },
  { loc: '/order-calculator', changefreq: 'monthly', priority: '0.6' },
  { loc: '/about', changefreq: 'monthly', priority: '0.6' },
  { loc: '/contact', changefreq: 'monthly', priority: '0.6' },
  { loc: '/catalog-request', changefreq: 'monthly', priority: '0.5' },
];

const entry = ({ loc, lastmod, changefreq, priority }) =>
  `  <url>\n    <loc>${SITE_URL}${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

(async () => {
  const today = new Date().toISOString().slice(0, 10);
  let products = [];
  try {
    const res = await fetch(`${API_URL}/api/products?limit=1000`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    products = (await res.json()).products || [];
  } catch (err) {
    console.warn(`sitemap: could not fetch products (${err.message}); keeping existing sitemap.xml`);
    return;
  }

  const urls = [
    ...staticPages.map((p) => ({ ...p, lastmod: today })),
    ...products.map((p) => ({
      loc: `/shop/${p._id}`,
      lastmod: (p.updatedAt || today).slice(0, 10),
      changefreq: 'weekly',
      priority: '0.7',
    })),
  ];
  fs.writeFileSync(OUT, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(entry).join('\n')}\n</urlset>\n`);
  console.log(`sitemap: wrote ${urls.length} URLs (${products.length} products)`);
})();
