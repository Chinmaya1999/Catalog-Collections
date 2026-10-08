// "Costs & profit" pricing for the superadmin's My pricing view. Ported from the ADIHUMAN gift
// catalogue artifact so both tools quote identical prices from identical settings.

export const DEFAULT_SETTINGS = {
  method: 'markup',            // 'markup' = % on cost, 'margin' = % of selling price
  profit: 30,
  useQtyProfit: false,
  qtyProfit: [[1, 5, 100], [6, 20, 80], [21, 50, 70], [51, 100, 60], [101, null, 40]], // [from, to|null, profit %]
  branding: 0,
  packaging: 0,
  freightPct: 0,
  other: 0,
  inputGst: false,
  showIncl: false,
  gstRate: 18,
  round: '5',
  prefix: 'AH-',
  brand: 'ADIHUMAN',
  sub: 'Corporate Gifting',
  contact: '',
  footer: 'Prices are per unit. Branding, packaging and delivery as discussed. Valid for 15 days.'
};

export const emptyPricing = () => ({ s: { ...DEFAULT_SETTINGS }, cat: {}, ov: {} });

// Merge a stored blob (localStorage / server) over the defaults so new settings keys always exist.
export const normalizePricing = (raw) => ({
  s: { ...DEFAULT_SETTINGS, ...(raw?.s || {}) },
  cat: raw?.cat && typeof raw.cat === 'object' ? raw.cat : {},
  ov: raw?.ov && typeof raw.ov === 'object' ? raw.ov : {}
});

export const roundTo = (v, mode) => {
  if (mode === '1') return Math.round(v);
  if (mode === '5') return Math.ceil(v / 5) * 5;
  if (mode === '10') return Math.ceil(v / 10) * 10;
  if (mode === '9') return Math.ceil((v + 1) / 10) * 10 - 1;
  return Math.round(v * 100) / 100;
};

const blank = (v) => v === undefined || v === null || v === '';

// Profit % for an order quantity, when "profit by quantity" is switched on.
export const qtyProfit = (s, q) => {
  if (!s.useQtyProfit || !Array.isArray(s.qtyProfit) || !s.qtyProfit.length) return +s.profit;
  for (const [from, to, pct] of s.qtyProfit) {
    if (q >= from && (to == null || q <= to)) return +pct;
  }
  return +s.profit;
};

/**
 * Price one product. `cost` is the supplier price (ex-GST), `category` its category name, `qty` the
 * quantity on a proposal line (0 = use `orderQty`). Returns null when there is no cost to price from.
 * Profit % priority: this product > its category > profit-by-quantity > default.
 */
export const priceOf = ({ code, cost, category }, qty, orderQty, pricing) => {
  const { s, cat, ov } = pricing;
  const o = ov[code] || {};
  const cs = cat[category] || {};
  const base = !blank(o.cost) ? +o.cost : cost;
  if (base == null || Number.isNaN(+base)) return null;

  const q = qty > 0 ? qty : orderQty;
  const supplier = base * (s.inputGst ? 1 + s.gstRate / 100 : 1);
  const addons = (+s.branding || 0) + (+s.packaging || 0) + (+s.other || 0) + (+cs.extra || 0) + (base * (+s.freightPct || 0)) / 100;
  const landed = supplier + addons;
  const pct = !blank(o.profit) ? +o.profit : !blank(cs.profit) ? +cs.profit : qtyProfit(s, q);
  const raw = s.method === 'margin' ? landed / (1 - Math.min(pct, 90) / 100) : landed * (1 + pct / 100);

  const g = 1 + s.gstRate / 100;
  let shown;
  let sell;
  if (s.showIncl) { shown = roundTo(raw * g, s.round); sell = shown / g; } else { shown = roundTo(raw, s.round); sell = shown; }
  const profit = sell - landed;
  return { base: +base, supplier, addons, landed, pct, sell, shown, profit, margin: sell ? (profit / sell) * 100 : 0 };
};

// The profit figure the cards show next to the rupees: margin, or markup on landed cost.
export const profitPct = (s, pr) => (s.method === 'margin' ? pr.margin : pr.landed ? (pr.profit / pr.landed) * 100 : 0);

export const gstLabel = (s) => (s.showIncl ? 'incl. GST' : '+ GST');

// Customers see "AH-K301"; the stored supplier code is "HGS-K301".
export const customerCode = (supplierCode, prefix) => (supplierCode ? `${prefix || ''}${supplierCode.replace(/^HGS-/, '')}` : '');
