// Real product-themed photography for category browsing tiles (Unsplash CDN, stable photo
// ids - each one hand-picked and verified so category tiles look like a real storefront
// instead of generic emoji/box icons). Matched by keyword against whatever the category is
// actually named in the DB, so a renamed or newly-added category still gets a sensible photo
// instead of breaking. Shared between the Home page category marquee and anywhere else that
// wants a photo for a category name.
const u = (id) => `https://images.unsplash.com/photo-${id}?w=500&h=500&q=80&auto=format&fit=crop`;

const CATEGORY_IMAGE_RULES = [
  { match: /apparel|t-?shirt|tee\b/i, url: u('1521572163474-6864f9cf17ab') },
  { match: /trophy|award/i, url: u('1567427017947-545c5f8d16ad') },
  { match: /bag|backpack/i, url: u('1553062407-98eeb64c6a62') },
  { match: /gift|combo/i, url: u('1549465220-1a8b9238cd48') },
  { match: /desk/i, url: u('1544816155-12df9643f363') },
  { match: /diary|notebook/i, url: u('1531346878377-a5be20888e57') },
  { match: /euroline|cookware/i, url: u('1556909114-44e3e70034e2') },
  { match: /storage|container/i, url: u('1584589167171-541ce45f1eea') },
  { match: /thermosteel|thermos|flask/i, url: u('1577937927133-66ef06acdf18') },
  { match: /unisteel|steel/i, url: u('1610824352934-c10d87b700cc') },
  { match: /drinkware|bottle|jug|tumbler/i, url: u('1523362628745-0c100150b504') },
  { match: /electronic/i, url: u('1518770660439-4636190af475') },
  { match: /home|living/i, url: u('1484154218962-a197022b5858') },
  { match: /keychain|cardholder/i, url: u('1585386959984-a4155224a1ad') },
  { match: /luggage|trolley/i, url: u('1553440569-bcc63803a83d') },
  { match: /pen|writing/i, url: u('1455390582262-044cdead277a') },
  { match: /skinta/i, url: u('1503341504253-dff4815485f1') },
  { match: /winbarg/i, url: u('1551028719-00167b16eac5') },
  { match: /zero degree/i, url: u('1556905055-8f358a7a47b2') },
  { match: /highline/i, url: u('1596755094514-f87e34085b2c') }
];

const DEFAULT_CATEGORY_IMAGE = u('1441986300917-64674bd600d8');

export const categoryImage = (name = '') =>
  (CATEGORY_IMAGE_RULES.find((r) => r.match.test(name)) || {}).url || DEFAULT_CATEGORY_IMAGE;
