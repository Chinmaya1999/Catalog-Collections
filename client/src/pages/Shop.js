import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  PackageSearch,
  Heart,
  ArrowUpDown,
  ArrowRight,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Check,
  Plus,
  Calculator,
  Loader2,
  LayoutGrid,
  Table2,
  MessageCircle,
  ClipboardList,
  Pencil,
  SlidersHorizontal,
} from 'lucide-react';
import { API_ENDPOINTS, getImageUrl } from '../config/api';
import SEO from '../components/SEO';
import PriceNoticeBanner from '../components/PriceNoticeBanner';
import ProposalDrawer, { buildProposalText } from '../components/ProposalDrawer';
import CostsProfitDrawer from '../components/CostsProfitDrawer';
import { useSavedProducts } from '../hooks/useSavedProducts';
import { useProposal, displayCode } from '../hooks/useProposal';
import { usePricing } from '../hooks/usePricing';
import { priceOf, profitPct, gstLabel, customerCode } from '../utils/pricing';
import { buildWhatsAppText } from '../utils/proposalExport';
import { swatchColor } from '../utils/colorSwatch';

const WHATSAPP_NUMBER = '918296810381';
const VIEW_KEY = 'catlog_shop_view';
const MODE_KEY = 'catlog_shop_mode';
const ADD_ALL_LIMIT = 120;
const SHOWN_CAP = 60; // products a proposal uses when nothing is picked
const ADMIN_PAGE = 60;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Featured' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'code', label: 'Code' },
  { value: 'name_asc', label: 'Name: A to Z' }
];
const PROFIT_SORT = { value: 'profit_desc', label: 'Profit: high to low' };

// Customer budget per unit - same quick ranges as the gift catalogue.
const BUDGET_PRESETS = [
  { label: 'Any', min: '', max: '' },
  { label: 'Under ₹250', min: '', max: '250' },
  { label: '₹250–500', min: '250', max: '500' },
  { label: '₹500–1,000', min: '500', max: '1000' },
  { label: '₹1,000–2,000', min: '1000', max: '2000' },
  { label: '₹2,000+', min: '2000', max: '' }
];

const inr = (n) => (typeof n === 'number' ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—');
const formatPrice = (n) => (typeof n === 'number' ? inr(n) : 'Price on request');

const isNewProduct = (publishedAt) => {
  if (!publishedAt) return false;
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  return ageMs >= 0 && ageMs < 14 * 24 * 60 * 60 * 1000;
};

const readStored = (key, fallback) => {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
};
const writeStored = (key, value) => {
  try { localStorage.setItem(key, value); } catch { /* private browsing */ }
};

// Only the superadmin (same token the dashboards use) can see supplier cost/profit - the costs
// endpoint is role-checked server-side, this just decides whether to ask for them at all.
const getAdminToken = () => {
  try {
    const info = JSON.parse(localStorage.getItem('adminInfo') || 'null');
    return info?.role === 'superadmin' ? localStorage.getItem('adminToken') : null;
  } catch {
    return null;
  }
};

// Supplier code ("HGS-K301"), primary category name and primary photo of a product.
const supplierCodeOf = (p) => p.variants?.[0]?.sku || '';
const categoryOf = (p) => p.categoryName || p.categoryNames?.[0] || '';
const pricingKeyOf = (p) => supplierCodeOf(p) || String(p._id);
const primaryImagePath = (p) => (p.images?.find((i) => i.isPrimary) || p.images?.[0])?.path || null;

// Category chips: "2-in-1 ..." sets first in numeric order, then the rest alphabetically.
const categoryRank = (name) => { const m = name.match(/^(\d)-in-1/); return m ? +m[1] : 9; };
const byCategoryName = (a, b) => categoryRank(a) - categoryRank(b) || a.localeCompare(b);

const adminSearchHay = (p, prefix) => [
  p.name, p.brand, p.categoryName, ...(p.categoryNames || []),
  supplierCodeOf(p), customerCode(supplierCodeOf(p), prefix)
].filter(Boolean).join(' ').toLowerCase();

const adminMatchesSearch = (hay, q) => {
  const squash = (t) => t.replace(/[-\s]/g, '');
  return q.split(' ').every((w) => hay.includes(w) || squash(hay).includes(squash(w)));
};

// Click-safe wrapper: cards are links, so anything interactive inside must not trigger navigation.
const stopLink = (e) => { e.preventDefault(); e.stopPropagation(); };

// Supplier-cost field for a product with no cost yet; commits on blur / Enter.
const CostInput = ({ code, onSet }) => (
  <input
    type="number"
    inputMode="decimal"
    placeholder="Enter cost ₹"
    aria-label={`Supplier cost for ${code}`}
    onClick={stopLink}
    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
    onBlur={(e) => { if (e.target.value !== '') onSet(e.target.value); }}
    className="w-full rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-brand-dark"
  />
);

/**
 * `pricing` is set only in the superadmin's priced view: `pr` is then the computed price (null = no
 * supplier cost) and `internal` adds supplier code + cost breakdown. Without `pricing` the card shows
 * the public shop price (priceFrom).
 */
const ProductCard = ({ product, saved, onToggleSave, selected, onToggleSelect, pricing, pr, internal, onEditPricing, onSetCost }) => {
  const primary = product.images?.find((i) => i.isPrimary) || product.images?.[0];
  const secondary = product.images?.find((i) => i !== primary);
  const extraColors = (product.colors?.length || 0) - 5;
  const badge = product.badges?.[0];
  const showFrom = !pricing && (product.variants?.length || 0) > 1;
  const supplierCode = supplierCodeOf(product);
  const code = pricing ? customerCode(supplierCode, pricing.s.prefix) : displayCode(product);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Link
        to={`/shop/${product._id}`}
        className={`group relative flex flex-col h-full bg-white rounded-3xl p-2 shadow-soft hover:shadow-lift hover:-translate-y-1 transition-all duration-500 ${
          selected ? 'ring-2 ring-brand-dark' : 'ring-1 ring-black/[0.06]'
        }`}
      >
        <div className="relative aspect-square rounded-2xl bg-gradient-to-b from-ink-50 to-ink-100 overflow-hidden">
          {primary ? (
            <>
              <img
                src={getImageUrl(primary.path)}
                alt={product.name || 'Product'}
                className={`absolute inset-0 w-full h-full object-contain p-3 mix-blend-multiply transition-all duration-700 ease-out group-hover:scale-105 ${secondary ? 'group-hover:opacity-0' : ''}`}
                loading="lazy"
              />
              {secondary && (
                <img
                  src={getImageUrl(secondary.path)}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-contain p-3 mix-blend-multiply opacity-0 scale-105 transition-all duration-700 ease-out group-hover:opacity-100 group-hover:scale-100"
                  loading="lazy"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center">
              <div>
                <PackageSearch className="w-9 h-9 text-ink-300 mx-auto" />
                <p className="mt-1.5 font-mono text-[11px] text-ink-400">No photo</p>
                {code && <p className="font-mono text-[11px] text-ink-400">{code}</p>}
              </div>
            </div>
          )}

          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
            {isNewProduct(product.publishedAt) && (
              <span className="inline-flex items-center gap-1 bg-brand-yellow text-brand-dark text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                <Sparkles className="w-2.5 h-2.5" /> New
              </span>
            )}
            {badge && (
              <span className="bg-brand-dark text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                {badge}
              </span>
            )}
          </div>

          <div className="absolute top-2.5 right-2.5 flex flex-col gap-2">
            {onToggleSelect && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSelect(product); }}
                aria-label={selected ? 'Remove from proposal' : 'Add to proposal'}
                title={selected ? 'Remove from proposal' : 'Add to proposal'}
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-soft transition-all duration-300 hover:scale-110 active:scale-90 ${
                  selected ? 'bg-brand-dark text-brand-yellow' : 'bg-white/90 backdrop-blur text-ink-600 hover:text-brand-dark'
                }`}
              >
                {selected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            )}
            {internal && onEditPricing && (
              <button
                type="button"
                onClick={(e) => { stopLink(e); onEditPricing(product); }}
                aria-label="Edit cost and profit for this product"
                title="Edit cost and profit for this product"
                className="w-9 h-9 rounded-full flex items-center justify-center shadow-soft bg-white/90 backdrop-blur text-ink-500 hover:text-brand-dark transition-all duration-300 hover:scale-110 active:scale-90"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(product._id); }}
              aria-label={saved ? 'Remove from saved' : 'Save product'}
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-soft transition-all duration-300 hover:scale-110 active:scale-90 ${
                saved ? 'bg-rose-500 text-white' : 'bg-white/90 backdrop-blur text-ink-500 hover:text-rose-500'
              }`}
            >
              <Heart className={`w-4 h-4 transition-colors ${saved ? 'fill-white' : ''}`} />
            </button>
          </div>
        </div>

        <div className="px-2.5 pt-3.5 pb-2.5 flex flex-col flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            {pricing
              ? (code && <p className="font-mono text-[11px] text-ink-500 truncate">{code}</p>)
              : (product.brand && <p className="text-[10px] font-bold text-ink-400 uppercase tracking-[0.14em] truncate">{product.brand}</p>)}
            {pricing
              ? (internal && supplierCode && <p className="font-mono text-[11px] text-ink-400 shrink-0 ml-auto" title="Supplier code">{supplierCode}</p>)
              : (code && <p className="font-mono text-[11px] text-ink-400 shrink-0 ml-auto">{code}</p>)}
          </div>
          <p className="font-semibold text-brand-dark text-sm leading-5 line-clamp-2 mb-2 flex-1">{product.name || 'Unnamed product'}</p>

          <div className="flex items-end justify-between gap-2">
            <div className="flex items-baseline gap-1">
              {showFrom && <span className="text-[11px] text-ink-400 font-medium">From</span>}
              {pricing ? (
                pr ? (
                  <>
                    <p className="text-brand-dark font-display font-extrabold text-base sm:text-lg">{inr(pr.shown)}</p>
                    <span className="text-[11px] text-ink-400 font-medium">{gstLabel(pricing.s)}</span>
                  </>
                ) : (
                  <p className="text-brand-dark font-display font-extrabold text-base sm:text-lg">Price on request</p>
                )
              ) : (
                <p className="text-brand-dark font-display font-extrabold text-base sm:text-lg">{formatPrice(product.priceFrom)}</p>
              )}
            </div>

            {product.colors?.length > 0 && (
              <div className="flex items-center -space-x-1 shrink-0 pb-1">
                {product.colors.slice(0, 5).map((c, i) => (
                  <span
                    key={i}
                    title={c.name || ''}
                    className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-sm shrink-0"
                    style={{ backgroundColor: c.code || swatchColor(c.name) }}
                  />
                ))}
                {extraColors > 0 && <span className="text-[10px] text-ink-400 font-semibold pl-1.5">+{extraColors}</span>}
              </div>
            )}
          </div>

          {internal && pr && (
            <div className="mt-2.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 border-t border-dashed border-ink-200 pt-2 text-[11px] text-ink-500">
              <span>Supplier</span><span className="text-right tabular-nums">{inr(pr.supplier)}</span>
              <span>Your add-ons</span><span className="text-right tabular-nums">{inr(pr.addons)}</span>
              <span>Landed cost</span><span className="text-right tabular-nums">{inr(pr.landed)}</span>
              <span className="font-semibold text-amber-600">Profit</span>
              <span
                className="text-right font-semibold text-amber-600 tabular-nums"
                title={pricing.s.method === 'margin' ? 'Margin on price' : 'Markup on cost'}
              >
                {inr(pr.profit)} · {profitPct(pricing.s, pr).toFixed(0)}%
              </span>
            </div>
          )}
          {internal && !pr && (
            <div className="mt-2.5 space-y-1.5 border-t border-dashed border-ink-200 pt-2">
              <span className="inline-block rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-500">No supplier cost</span>
              <CostInput code={supplierCode || product.name} onSet={(v) => onSetCost(product, v)} />
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

const ProductCardSkeleton = () => (
  <div className="bg-white rounded-3xl p-2 ring-1 ring-black/[0.06]">
    <div className="aspect-square rounded-2xl skeleton" />
    <div className="px-2.5 pt-4 pb-2.5 space-y-2.5">
      <div className="h-2.5 w-1/3 rounded-full skeleton" />
      <div className="h-3.5 w-4/5 rounded-full skeleton" />
      <div className="h-4 w-2/5 rounded-full skeleton" />
    </div>
  </div>
);

const CompareTable = ({ rows, proposal, pricing, internal, sort, setSort, onSetCost }) => {
  const priceSort = sort === 'price_asc' ? ' ↑' : sort === 'price_desc' ? ' ↓' : '';
  const th = 'sticky top-0 bg-ink-100 px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-ink-500 whitespace-nowrap';
  const num = `${th} text-right`;
  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-black/[0.06] shadow-soft">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={th} aria-label="Select" />
            <th className={th} aria-label="Photo" />
            <th className={`${th} cursor-pointer select-none`} onClick={() => setSort('code')}>Code{sort === 'code' ? ' ↑' : ''}</th>
            <th className={th}>Category</th>
            <th className={th}>Item</th>
            {internal && <th className={num}>Supplier ₹</th>}
            {internal && <th className={num}>Add-ons ₹</th>}
            {internal && <th className={num}>Landed ₹</th>}
            {internal && <th className={`${num} cursor-pointer select-none`} onClick={() => setSort('profit_desc')}>Profit ₹{sort === 'profit_desc' ? ' ↓' : ''}</th>}
            {internal && <th className={num}>Profit %</th>}
            <th className={`${num} cursor-pointer select-none`} onClick={() => setSort(sort === 'price_asc' ? 'price_desc' : 'price_asc')}>
              Price ₹{priceSort}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ p, pr }) => {
            const primary = p.images?.find((i) => i.isPrimary) || p.images?.[0];
            const selected = !!proposal.items[p._id];
            const supplierCode = supplierCodeOf(p);
            const td = 'px-3 py-2 border-t border-ink-200/70 align-middle';
            const code = pricing ? customerCode(supplierCode, pricing.s.prefix) : displayCode(p);
            const price = pricing ? (pr ? inr(pr.shown) : '—') : formatPrice(p.priceFrom);
            return (
              <tr key={p._id} className={selected ? 'bg-brand-yellow/20' : 'hover:bg-ink-50'}>
                <td className={td}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => proposal.toggle(p)}
                    aria-label={`Select ${p.name || 'product'}`}
                    className="h-4 w-4 accent-brand-dark"
                  />
                </td>
                <td className={td}>
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-black/10">
                    {primary ? (
                      <img src={getImageUrl(primary.path)} alt="" className="h-full w-full object-contain" loading="lazy" />
                    ) : (
                      <PackageSearch className="h-4 w-4 text-ink-300" />
                    )}
                  </div>
                </td>
                <td className={`${td} whitespace-nowrap font-mono text-xs text-ink-600`}>
                  {code || '—'}
                  {internal && supplierCode && <><br /><span className="text-ink-400">{supplierCode}</span></>}
                </td>
                <td className={`${td} whitespace-nowrap text-ink-500`}>{p.categoryName || '—'}</td>
                <td className={`${td} min-w-[220px] max-w-[340px]`}>
                  <Link to={`/shop/${p._id}`} className="font-medium text-brand-dark hover:underline">{p.name || 'Unnamed product'}</Link>
                </td>
                {internal && (
                  <td className={`${td} text-right tabular-nums`}>
                    <input
                      type="number"
                      inputMode="decimal"
                      key={`${p._id}-${pr ? pr.base : ''}`}
                      defaultValue={pr ? +pr.base.toFixed(2) : ''}
                      placeholder="—"
                      aria-label={`Supplier cost ${supplierCode || p.name}`}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                      onBlur={(e) => { if (e.target.value !== '' && +e.target.value !== (pr ? +pr.base.toFixed(2) : null)) onSetCost(p, e.target.value); }}
                      className="w-20 rounded-md border border-ink-200 px-2 py-1 text-right text-sm outline-none focus:border-brand-dark"
                    />
                  </td>
                )}
                {internal && <td className={`${td} text-right tabular-nums`}>{pr ? inr(pr.addons) : '—'}</td>}
                {internal && <td className={`${td} text-right tabular-nums`}>{pr ? inr(pr.landed) : '—'}</td>}
                {internal && <td className={`${td} text-right tabular-nums font-semibold text-amber-600`}>{pr ? inr(pr.profit) : '—'}</td>}
                {internal && <td className={`${td} text-right tabular-nums`}>{pr ? `${profitPct(pricing.s, pr).toFixed(0)}%` : '—'}</td>}
                <td className={`${td} text-right tabular-nums font-bold text-brand-dark whitespace-nowrap`}>{price}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const Segmented = ({ options, value, onChange, label }) => (
  <div role="group" aria-label={label} className="inline-flex gap-0.5 rounded-full bg-ink-100 p-1">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        aria-pressed={value === o.value}
        onClick={() => onChange(o.value)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all ${
          value === o.value ? 'bg-white text-brand-dark shadow-soft' : 'text-ink-500 hover:text-brand-dark'
        }`}
      >
        {o.icon}{o.label}
      </button>
    ))}
  </div>
);

// Per-product override of supplier cost and profit % (the pencil on a card). Blank = use the shared
// rules from Costs & profit.
const ProductPricingModal = ({ product, pricing, orderQty, setOverride, onClose }) => {
  const key = pricingKeyOf(product);
  const ov = pricing.ov[key] || {};
  const listCost = typeof product.supplierCost === 'number' ? product.supplierCost : null;
  const pr = priceOf({ code: key, cost: listCost, category: categoryOf(product) }, 0, orderQty, pricing);
  const catRule = pricing.cat[categoryOf(product)]?.profit;
  const fallbackLabel = catRule !== undefined && catRule !== '' ? 'category' : pricing.s.useQtyProfit ? 'quantity' : 'default';
  const field = 'w-28 rounded-xl border border-ink-200 bg-white px-3 py-2 text-right text-sm outline-none focus:border-brand-dark';
  const commit = (k) => (e) => setOverride(key, k, e.target.value);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Edit product pricing"
        className="w-full max-w-md space-y-4 rounded-3xl bg-white p-5 shadow-lift"
      >
        <div>
          <p className="font-mono text-xs text-ink-400">{customerCode(supplierCodeOf(product), pricing.s.prefix)} · {supplierCodeOf(product)}</p>
          <h3 className="font-display text-lg font-bold text-brand-dark">{product.name || 'Unnamed product'}</h3>
          <p className="text-xs text-ink-500">{categoryOf(product)}</p>
        </div>
        <fieldset className="space-y-3 rounded-2xl border border-ink-200 p-4">
          <legend className="px-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">This product only</legend>
          <label className="flex items-center justify-between gap-3 text-sm font-medium text-brand-dark">
            <span>Supplier cost ₹<span className="block text-xs font-normal text-ink-500">{listCost != null ? `Price list: ${inr(listCost)} + GST` : 'Not in price list'}</span></span>
            <input type="number" inputMode="decimal" step="any" key={`c${ov.cost ?? ''}`} defaultValue={ov.cost ?? ''} placeholder={listCost ?? ''} onBlur={commit('cost')} className={field} />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm font-medium text-brand-dark">
            <span>Profit % for this item<span className="block text-xs font-normal text-ink-500">Blank uses the {fallbackLabel} profit ({pr ? pr.pct : pricing.s.profit}% now)</span></span>
            <input type="number" inputMode="decimal" step="any" key={`p${ov.profit ?? ''}`} defaultValue={ov.profit ?? ''} onBlur={commit('profit')} className={field} />
          </label>
          {pr && (
            <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 border-t border-dashed border-ink-200 pt-2 text-xs text-ink-500">
              <span>Supplier</span><span className="tabular-nums">{inr(pr.supplier)}</span>
              <span>Your add-ons</span><span className="tabular-nums">{inr(pr.addons)}</span>
              <span>Landed cost</span><span className="tabular-nums">{inr(pr.landed)}</span>
              <span className="font-semibold text-amber-600">Profit</span>
              <span className="font-semibold tabular-nums text-amber-600">{inr(pr.profit)} · {profitPct(pricing.s, pr).toFixed(0)}%</span>
              <span className="font-semibold text-brand-dark">Customer sees</span>
              <span className="font-bold tabular-nums text-brand-dark">{inr(pr.shown)} {gstLabel(pricing.s)}</span>
            </div>
          )}
        </fieldset>
        <button onClick={onClose} className="btn-secondary w-full justify-center">Done</button>
      </motion.div>
    </motion.div>
  );
};

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filterOptions, setFilterOptions] = useState({ categories: [], brands: [], colors: [], priceRange: { min: 0, max: 0 } });
  const [loading, setLoading] = useState(true);
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [costsOpen, setCostsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [toast, setToast] = useState('');

  // Every filter is seeded from the URL and kept in sync with it (see the sync effect below).
  // Without this, clicking into a product and hitting the browser's Back button remounts Shop
  // from scratch with no way to recover the filters that were active - React state alone
  // doesn't survive that round trip, only the URL does.
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialMinPrice = searchParams.get('minPrice') || '';
  const initialMaxPrice = searchParams.get('maxPrice') || '';
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [brand, setBrand] = useState(() => searchParams.get('brand') || '');
  const [category, setCategory] = useState(() => searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [debouncedMinPrice, setDebouncedMinPrice] = useState(initialMinPrice);
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState(initialMaxPrice);
  const [sort, setSort] = useState(() => searchParams.get('sort') || 'newest');
  const [photosOnly, setPhotosOnly] = useState(() => searchParams.get('photos') === '1');
  const [page, setPage] = useState(1);
  const [orderQty, setOrderQty] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [view, setViewState] = useState(() => (readStored(VIEW_KEY, 'grid') === 'table' ? 'table' : 'grid'));

  const { savedIds, toggleSaved } = useSavedProducts();
  const proposal = useProposal();
  const topRef = useRef(null);
  const sentinelRef = useRef(null);

  // ---- Superadmin "My pricing" view ----
  // The superadmin gets the whole catalogue with supplier costs and prices/filters/sorts it here,
  // because the price depends on their Costs & profit settings. Everyone else (and the superadmin
  // if that fetch fails) browses the server-paged public catalogue at the shop price.
  const [adminToken] = useState(getAdminToken);
  const [adminCatalog, setAdminCatalog] = useState(null);
  const [adminFailed, setAdminFailed] = useState(false);
  const useAdmin = !!adminToken && !adminFailed;
  const [costMode, setCostModeState] = useState(() => readStored(MODE_KEY, 'pricing') !== 'customer');
  const internal = useAdmin && costMode; // show supplier cost / profit; false in Customer view
  const [adminCats, setAdminCats] = useState([]);
  const [hideNoCost, setHideNoCost] = useState(false);
  const [adminShown, setAdminShown] = useState(ADMIN_PAGE);
  const { pricing, setSetting, setCategory: setCategoryRule, setOverride } = usePricing(useAdmin ? adminToken : null);
  const qtyNum = Math.max(1, parseInt(orderQty, 10) || 1);
  const effectiveSort = !internal && sort === 'profit_desc' ? 'price_asc' : sort;

  const setView = (v) => { setViewState(v); writeStored(VIEW_KEY, v); };
  const setCostMode = (m) => { const on = m === 'pricing'; setCostModeState(on); writeStored(MODE_KEY, on ? 'pricing' : 'customer'); };
  const setCost = useCallback((p, value) => setOverride(pricingKeyOf(p), 'cost', value), [setOverride]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedMinPrice(minPrice), 400);
    return () => clearTimeout(t);
  }, [minPrice]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedMaxPrice(maxPrice), 400);
    return () => clearTimeout(t);
  }, [maxPrice]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!adminToken) return undefined;
    let cancelled = false;
    fetch(`${API_ENDPOINTS.products}/admin/catalog`, { headers: { Authorization: `Bearer ${adminToken}` } })
      .then((res) => { if (!res.ok) throw new Error(`catalog ${res.status}`); return res.json(); })
      .then((data) => { if (!cancelled) setAdminCatalog(data.products || []); })
      .catch((err) => { console.error('Admin catalog unavailable, using the public shop:', err); if (!cancelled) setAdminFailed(true); });
    return () => { cancelled = true; };
  }, [adminToken]);

  // pageNum/replace are explicit args (not the `page` state) so the very next infinite-scroll
  // page can be requested immediately after bumping `page`, without waiting on a re-render.
  const fetchProducts = useCallback(async (pageNum, replace) => {
    if (replace) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (category) params.set('category', category);
      if (brand) params.set('brand', brand);
      if (debouncedMinPrice) params.set('minPrice', debouncedMinPrice);
      if (debouncedMaxPrice) params.set('maxPrice', debouncedMaxPrice);
      if (photosOnly) params.set('hasPhoto', '1');
      params.set('sort', sort);
      params.set('page', pageNum);

      const res = await fetch(`${API_ENDPOINTS.products}?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts((prev) => (replace ? data.products : [...prev, ...data.products]));
        setPagination(data.pagination);
        setFilterOptions(data.filters);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      if (replace) setLoading(false); else setLoadingMore(false);
    }
  }, [debouncedSearch, category, brand, debouncedMinPrice, debouncedMaxPrice, photosOnly, sort]);

  // Any filter/search/sort change starts a fresh list from page 1 - this is the only place
  // that replaces `products` outright; scrolling further only ever appends (see the
  // IntersectionObserver effect below). The mount-run is skipped so landing on /shop doesn't
  // yank the page down to the grid before the user has done anything.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (useAdmin) return;
    setPage(1);
    fetchProducts(1, true);
    if (didMountRef.current) {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    didMountRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, category, brand, debouncedMinPrice, debouncedMaxPrice, photosOnly, sort, useAdmin]);

  // Mirrors the same filters into the URL (replacing, not pushing, so tweaking filters
  // doesn't spam the browser history) so that Back after opening a product restores them
  // instead of landing on a blank /shop.
  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedSearch) next.set('search', debouncedSearch);
    if (category) next.set('category', category);
    if (brand) next.set('brand', brand);
    if (debouncedMinPrice) next.set('minPrice', debouncedMinPrice);
    if (debouncedMaxPrice) next.set('maxPrice', debouncedMaxPrice);
    if (photosOnly) next.set('photos', '1');
    if (sort !== 'newest') next.set('sort', sort);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, category, brand, debouncedMinPrice, debouncedMaxPrice, photosOnly, sort]);

  // ---- My pricing: price every product, then filter + sort in the browser ----
  const adminRows = useMemo(() => {
    if (!useAdmin || !adminCatalog) return [];
    return adminCatalog.map((p) => ({
      p,
      pr: priceOf(
        { code: pricingKeyOf(p), cost: typeof p.supplierCost === 'number' ? p.supplierCost : null, category: categoryOf(p) },
        0, qtyNum, pricing
      ),
      hay: adminSearchHay(p, pricing.s.prefix)
    }));
  }, [useAdmin, adminCatalog, pricing, qtyNum]);

  const adminCategoryNames = useMemo(() => {
    const names = new Set();
    (adminCatalog || []).forEach((p) => { if (categoryOf(p)) names.add(categoryOf(p)); });
    return [...names].sort(byCategoryName);
  }, [adminCatalog]);

  const { adminFiltered, adminCatCounts, adminCatTotal } = useMemo(() => {
    const q = debouncedSearch.toLowerCase().replace(/\s+/g, ' ').trim();
    const lo = debouncedMinPrice === '' ? null : +debouncedMinPrice;
    const hi = debouncedMaxPrice === '' ? null : +debouncedMaxPrice;
    const hideUnpriced = hideNoCost || !costMode;
    const matches = (r, ignoreCats) => {
      if (q && !adminMatchesSearch(r.hay, q)) return false;
      if (!ignoreCats && adminCats.length && !adminCats.includes(categoryOf(r.p))) return false;
      if (lo != null || hi != null) {
        if (!r.pr) return false;
        if (lo != null && r.pr.shown < lo) return false;
        if (hi != null && r.pr.shown > hi) return false;
      }
      if (hideUnpriced && !r.pr) return false;
      if (photosOnly && !r.p.images?.length) return false;
      return true;
    };

    const counts = {};
    let total = 0;
    adminRows.forEach((r) => {
      if (matches(r, true)) { const c = categoryOf(r.p); counts[c] = (counts[c] || 0) + 1; total += 1; }
    });

    const rows = adminRows.filter((r) => matches(r, false));
    const big = 1e12;
    if (effectiveSort === 'code') rows.sort((a, b) => supplierCodeOf(a.p).localeCompare(supplierCodeOf(b.p), undefined, { numeric: true }));
    else if (effectiveSort === 'name_asc') rows.sort((a, b) => (a.p.name || '').localeCompare(b.p.name || ''));
    else if (effectiveSort === 'profit_desc') rows.sort((a, b) => (b.pr ? b.pr.profit : -big) - (a.pr ? a.pr.profit : -big));
    else if (effectiveSort === 'price_desc') rows.sort((a, b) => (b.pr ? b.pr.shown : -big) - (a.pr ? a.pr.shown : -big));
    else if (effectiveSort === 'price_asc') rows.sort((a, b) => (a.pr ? a.pr.shown : big) - (b.pr ? b.pr.shown : big));
    return { adminFiltered: rows, adminCatCounts: counts, adminCatTotal: total };
  }, [adminRows, debouncedSearch, debouncedMinPrice, debouncedMaxPrice, adminCats, hideNoCost, costMode, photosOnly, effectiveSort]);

  useEffect(() => {
    setAdminShown(ADMIN_PAGE);
  }, [debouncedSearch, debouncedMinPrice, debouncedMaxPrice, adminCats, hideNoCost, costMode, photosOnly, effectiveSort]);

  // Infinite scroll: load the next page (public) or reveal more rows (My pricing) once the sentinel
  // below the grid enters the viewport.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        if (useAdmin) {
          setAdminShown((n) => (n < adminFiltered.length ? n + ADMIN_PAGE : n));
        } else if (!loading && !loadingMore && page < pagination.totalPages) {
          const next = page + 1;
          setPage(next);
          fetchProducts(next, false);
        }
      },
      { rootMargin: '600px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [useAdmin, adminFiltered.length, adminShown, loading, loadingMore, page, pagination.totalPages, fetchProducts]);

  const listRows = useAdmin ? adminFiltered.slice(0, adminShown) : products.map((p) => ({ p }));
  const totalCount = useAdmin ? adminFiltered.length : pagination.total;
  const isLoading = useAdmin ? adminCatalog === null : loading;
  const reachedEnd = useAdmin ? adminShown >= adminFiltered.length : !loadingMore && page >= pagination.totalPages;

  const activeFilterCount = (category ? 1 : 0) + (brand ? 1 : 0) + (minPrice || maxPrice ? 1 : 0) + (photosOnly ? 1 : 0) + (adminCats.length ? 1 : 0) + (hideNoCost ? 1 : 0);
  const clearFilters = () => { setCategory(''); setBrand(''); setMinPrice(''); setMaxPrice(''); setPhotosOnly(false); setAdminCats([]); setHideNoCost(false); };

  const addAllShown = () => {
    const priced = useAdmin
      ? adminFiltered.filter((r) => r.pr).map((r) => r.p)
      : products.filter((p) => typeof p.priceFrom === 'number');
    if (priced.length === 0) { setToast('No priced products to add'); return; }
    if (priced.length > ADD_ALL_LIMIT) { setToast(`That's ${priced.length} products. Narrow the budget or category first (${ADD_ALL_LIMIT} max at once).`); return; }
    proposal.addMany(priced);
    setToast(`Added ${priced.length} product${priced.length === 1 ? '' : 's'} to the proposal`);
  };

  // ---- Proposal lines ----
  const adminById = useMemo(() => new Map((adminCatalog || []).map((p) => [String(p._id), p])), [adminCatalog]);
  const gst = gstLabel(pricing.s);

  const adminLine = useCallback((p, qty) => {
    const pr = priceOf(
      { code: pricingKeyOf(p), cost: typeof p.supplierCost === 'number' ? p.supplierCost : null, category: categoryOf(p) },
      qty, qtyNum, pricing
    );
    return {
      id: String(p._id),
      code: customerCode(supplierCodeOf(p), pricing.s.prefix),
      supplierCode: supplierCodeOf(p),
      name: p.name || 'Unnamed product',
      category: categoryOf(p),
      image: primaryImagePath(p),
      priced: !!pr,
      shown: pr?.shown,
      base: pr?.base, addons: pr?.addons, landed: pr?.landed, profit: pr?.profit, margin: pr?.margin,
      qty
    };
  }, [pricing, qtyNum]);

  // Nothing picked in My pricing: sending uses the first products the filters show (SHOWN_CAP).
  const usingShown = useAdmin && proposal.list.length === 0;
  const shownPricedCount = useMemo(() => (usingShown ? adminFiltered.filter((r) => r.pr).length : 0), [usingShown, adminFiltered]);

  const proposalRows = useMemo(() => {
    if (!useAdmin) {
      return proposal.list.map((i) => ({
        id: i.id, code: i.code, supplierCode: '', name: i.name, category: '', image: i.image,
        priced: i.price != null, shown: i.price, qty: Number(i.qty) || 0
      }));
    }
    if (usingShown) return adminFiltered.filter((r) => r.pr).slice(0, SHOWN_CAP).map((r) => adminLine(r.p, 0));
    return proposal.list
      .map((i) => { const p = adminById.get(String(i.id)); return p ? adminLine(p, Number(i.qty) || 0) : null; })
      .filter(Boolean);
  }, [useAdmin, usingShown, adminFiltered, adminById, adminLine, proposal.list]);

  const filterText = [
    minPrice || maxPrice ? `${minPrice ? inr(+minPrice) : '₹0'} – ${maxPrice ? inr(+maxPrice) : 'any'}` : '',
    adminCats.join(', '),
    debouncedSearch ? `“${debouncedSearch}”` : ''
  ].filter(Boolean).join(' · ') || 'no filters';

  const pickAllShown = () => {
    const picks = proposalRows.map((r) => adminById.get(r.id)).filter(Boolean);
    proposal.addMany(picks);
  };

  const proposalSummary = useMemo(() => {
    const prices = proposalRows.filter((r) => r.priced).map((r) => r.shown);
    if (prices.length === 0) return '';
    const lo = Math.min(...prices);
    const hi = Math.max(...prices);
    return ` · ${inr(lo)}${hi !== lo ? ` – ${inr(hi)}` : ''}${useAdmin ? ` ${gst}` : ''}`;
  }, [proposalRows, useAdmin, gst]);

  const exportSettings = { brand: pricing.s.brand, sub: pricing.s.sub, footer: pricing.s.footer, contact: pricing.s.contact };

  const sendProposalOnWhatsApp = () => {
    if (useAdmin) {
      if (!proposalRows.some((r) => r.priced)) { setToast('Add priced products to the proposal first'); return; }
      const text = buildWhatsAppText(proposalRows, { ...exportSettings, customer: proposal.customer, note: proposal.note, gst, totals: proposal.totals });
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      return;
    }
    const text = buildProposalText(proposal.list, proposal.customer);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const budgetLabel = minPrice || maxPrice ? ` in ${inr(Number(minPrice) || 0)} – ${maxPrice ? inr(Number(maxPrice)) : 'any'}${useAdmin ? ` ${gst}` : ''}` : '';
  const hasTray = useAdmin || proposal.list.length > 0;
  const sortOptions = internal ? [...SORT_OPTIONS, PROFIT_SORT] : SORT_OPTIONS;

  return (
    <div className={`pt-20 min-h-screen bg-brand-light ${hasTray ? 'pb-24' : ''}`}>
      <SEO
        title="Shop Products | Adihuman"
        description="Browse our full product catalog with real photos, prices, sizes and colours."
        path="/shop"
      />

      {/* Search row (the site Navbar above is the only nav) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="search"
              placeholder="Search code or item, e.g. AH-K301, bamboo, bottle"
              aria-label="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-ink-200 bg-white py-3 pl-11 pr-4 text-sm text-brand-dark outline-none transition-all placeholder:text-ink-400 focus:border-brand-dark focus:ring-4 focus:ring-brand-yellow/30"
            />
          </div>
          {useAdmin ? (
            <>
              <Segmented
                label="View mode"
                value={costMode ? 'pricing' : 'customer'}
                onChange={setCostMode}
                options={[{ value: 'pricing', label: 'My pricing' }, { value: 'customer', label: 'Customer view' }]}
              />
              {internal && (
                <button
                  type="button"
                  onClick={() => setCostsOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-brand-dark hover:border-brand-dark transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" /> Costs &amp; profit
                </button>
              )}
            </>
          ) : (
            <Link
              to="/admin/login"
              state={{ from: '/shop' }}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-4 py-2 text-sm font-semibold text-ink-500 hover:text-brand-dark transition-colors"
              title="Log in as superadmin to see supplier costs and profit"
            >
              My pricing · Costs &amp; profit
            </Link>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        {/* Customer budget per unit (+ order quantity for My pricing) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
          <label htmlFor="shop-min" className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-500">Customer budget per unit</label>
          <div className="flex items-center gap-1.5">
            <input id="shop-min" type="number" min="0" inputMode="numeric" placeholder="Min ₹" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-24 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-dark" />
            <span className="text-ink-400">–</span>
            <input type="number" min="0" inputMode="numeric" placeholder="Max ₹" aria-label="Maximum budget" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-24 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-dark" />
          </div>
          {useAdmin && (
            <div className="flex items-center gap-2">
              <label htmlFor="shop-qty" className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-500">Order qty</label>
              <input id="shop-qty" type="number" min="1" inputMode="numeric" placeholder="Any" value={orderQty} onChange={(e) => setOrderQty(e.target.value)} className="w-24 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-dark" />
            </div>
          )}
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-1.5 overflow-x-auto no-scrollbar max-w-full">
            {BUDGET_PRESETS.map((p) => {
              const active = minPrice === p.min && maxPrice === p.max;
              return (
                <button
                  key={p.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => { setMinPrice(p.min); setMaxPrice(p.max); }}
                  className={`chip shrink-0 !px-3 !py-1.5 !text-xs ${active ? 'chip-active' : ''}`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories */}
        {useAdmin ? (
          adminCategoryNames.length > 0 && (
            <div className="mt-4 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button type="button" aria-pressed={adminCats.length === 0} onClick={() => setAdminCats([])} className={`chip shrink-0 ${adminCats.length === 0 ? 'chip-active' : ''}`}>
                All <span className="ml-1 opacity-60 text-[11px]">{adminCatTotal}</span>
              </button>
              {adminCategoryNames.map((c) => {
                const active = adminCats.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setAdminCats((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]))}
                    className={`chip shrink-0 ${active ? 'chip-active' : ''}`}
                  >
                    {c} <span className="ml-1 opacity-60 text-[11px]">{adminCatCounts[c] || 0}</span>
                  </button>
                );
              })}
            </div>
          )
        ) : (
          filterOptions.categories.length > 0 && (
            <div className="mt-4 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button type="button" aria-pressed={!category} onClick={() => setCategory('')} className={`chip shrink-0 ${!category ? 'chip-active' : ''}`}>
                All
              </button>
              {filterOptions.categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={category === c.id}
                  onClick={() => setCategory(category === c.id ? '' : c.id)}
                  className={`chip shrink-0 ${category === c.id ? 'chip-active' : ''}`}
                >
                  {c.name} <span className="ml-1 opacity-60 text-[11px]">{c.count}</span>
                </button>
              ))}
            </div>
          )
        )}
      </section>

      <section ref={topRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-10 scroll-mt-28">
        {/* Count + controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 min-w-0">
            <p className="font-display text-lg font-semibold text-brand-dark">
              {totalCount.toLocaleString('en-IN')} product{totalCount === 1 ? '' : 's'}
              {budgetLabel && <em className="not-italic font-sans text-sm font-normal text-ink-400">{budgetLabel}</em>}
            </p>
            <button type="button" onClick={addAllShown} className="text-sm font-semibold text-brand-dark underline-offset-4 hover:underline">
              Add all shown to proposal
            </button>
            {activeFilterCount > 0 && (
              <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-brand-dark">
                <RotateCcw className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {savedIds.size > 0 && (
              <button
                onClick={() => setSavedModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold bg-rose-50 text-rose-600 ring-1 ring-rose-100 hover:bg-rose-100 transition-colors"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-500" />
                Saved <span className="rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{savedIds.size}</span>
              </button>
            )}
            <label className="inline-flex items-center gap-1.5 text-sm text-ink-500 cursor-pointer">
              <input type="checkbox" checked={photosOnly} onChange={(e) => setPhotosOnly(e.target.checked)} className="h-4 w-4 accent-brand-dark" />
              Only with photos
            </label>
            {internal && (
              <label className="inline-flex items-center gap-1.5 text-sm text-ink-500 cursor-pointer">
                <input type="checkbox" checked={hideNoCost} onChange={(e) => setHideNoCost(e.target.checked)} className="h-4 w-4 accent-brand-dark" />
                Hide items with no cost
              </label>
            )}
            {!useAdmin && filterOptions.brands.length > 0 && (
              <div className="relative">
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  aria-label="Brand"
                  className="pl-3.5 pr-8 py-2 rounded-full border border-ink-200 bg-white text-sm font-semibold text-ink-700 hover:border-brand-dark outline-none appearance-none cursor-pointer transition-colors"
                >
                  <option value="">All brands</option>
                  {filterOptions.brands.map((b) => <option key={b.name} value={b.name}>{b.name} ({b.count})</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400 pointer-events-none" />
              </div>
            )}
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400 pointer-events-none" />
              <select
                value={effectiveSort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort"
                className="pl-8 pr-8 py-2 rounded-full border border-ink-200 bg-white text-sm font-semibold text-ink-700 hover:border-brand-dark focus:ring-4 focus:ring-brand-yellow/30 focus:border-brand-dark outline-none appearance-none cursor-pointer transition-colors"
              >
                {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400 pointer-events-none" />
            </div>
            <Segmented
              label="Layout"
              value={view}
              onChange={setView}
              options={[
                { value: 'grid', label: 'Cards', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
                { value: 'table', label: 'Compare table', icon: <Table2 className="w-3.5 h-3.5" /> }
              ]}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : listRows.length === 0 ? (
          <div className="surface py-20 px-6 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-100">
              <PackageSearch className="w-8 h-8 text-ink-400" />
            </div>
            <p className="text-2xl font-display font-bold text-brand-dark">No products found</p>
            <p className="text-ink-500 mt-2 mb-7">Nothing matches. Try widening the budget or clearing the search.</p>
            {(activeFilterCount > 0 || search) && (
              <button onClick={() => { clearFilters(); setSearch(''); }} className="btn-secondary">
                <RotateCcw className="w-4 h-4" /> Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {view === 'table' ? (
              <CompareTable
                rows={listRows}
                proposal={proposal}
                pricing={useAdmin ? pricing : null}
                internal={internal}
                sort={effectiveSort}
                setSort={setSort}
                onSetCost={setCost}
              />
            ) : (
              <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                <AnimatePresence>
                  {listRows.map(({ p, pr }) => (
                    <ProductCard
                      key={p._id}
                      product={p}
                      saved={savedIds.has(p._id)}
                      onToggleSave={toggleSaved}
                      selected={!!proposal.items[p._id]}
                      onToggleSelect={proposal.toggle}
                      pricing={useAdmin ? pricing : null}
                      pr={pr}
                      internal={internal}
                      onEditPricing={setEditingProduct}
                      onSetCost={setCost}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Infinite scroll sentinel - the IntersectionObserver above fires the next
                page fetch once this enters the viewport, so the list just keeps growing. */}
            <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />

            {loadingMore && (
              <div className="flex items-center justify-center py-10">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-ink-500 shadow-soft ring-1 ring-black/5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Loading more products…</span>
                </span>
              </div>
            )}

            {reachedEnd && listRows.length > 0 && (
              <div className="flex items-center gap-4 py-12">
                <div className="h-px flex-1 bg-ink-200" />
                <p className="text-xs font-medium text-ink-400">
                  You've reached the end — {totalCount} {totalCount === 1 ? 'product' : 'products'} shown
                </p>
                <div className="h-px flex-1 bg-ink-200" />
              </div>
            )}
          </>
        )}
      </section>

      {/* Price notice + calculator promo */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PriceNoticeBanner />
        </div>
        <div className="lg:col-span-2">
          <Link
            to="/order-calculator"
            className="group relative flex h-full items-center justify-between gap-4 overflow-hidden rounded-3xl bg-brand-dark px-5 py-5 text-white shadow-card sm:px-6"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-yellow/30 blur-2xl transition-transform duration-700 group-hover:scale-150" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-yellow flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:rotate-6">
                <Calculator className="w-6 h-6 text-brand-dark" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold leading-tight">What do you want to order?</h2>
                <p className="text-white/55 text-xs sm:text-sm mt-1">
                  Pick a brand and quantity — see your bulk discount instantly and quote on WhatsApp.
                </p>
              </div>
            </div>
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-dark transition-transform duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* Proposal tray */}
      <AnimatePresence>
        {hasTray && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-40 bg-brand-dark text-white"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3">
              <p className="mr-auto min-w-0 text-sm">
                {usingShown ? (
                  shownPricedCount > 0 ? (
                    <>
                      <b className="font-display text-base">No products picked.</b> Sending will use the {shownPricedCount > SHOWN_CAP ? `first ${SHOWN_CAP} of ` : ''}{shownPricedCount} priced
                      products shown, or tap + to pick.
                    </>
                  ) : (
                    <><b className="font-display text-base">No products shown.</b> Change the filters or tap + to pick products.</>
                  )
                ) : (
                  <>
                    <b className="font-display text-base">{proposalRows.length} item{proposalRows.length === 1 ? '' : 's'}</b> in proposal{proposalSummary}
                    {proposal.customer && <> · for {proposal.customer}</>}
                  </>
                )}
              </p>
              <button
                onClick={sendProposalOnWhatsApp}
                disabled={useAdmin && !proposalRows.some((r) => r.priced)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <MessageCircle className="w-4 h-4" /> Send on WhatsApp
              </button>
              <button onClick={() => setProposalOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-brand-yellow px-4 py-2 text-sm font-bold text-brand-dark hover:brightness-95 transition">
                <ClipboardList className="w-4 h-4" /> Review proposal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {proposalOpen && (
          <ProposalDrawer
            proposal={proposal}
            rows={proposalRows}
            admin={useAdmin}
            internal={internal}
            usingShown={usingShown}
            shownTotal={shownPricedCount}
            filterText={filterText}
            onPickAll={pickAllShown}
            settings={exportSettings}
            gst={useAdmin ? gst : '+ GST'}
            onClose={() => setProposalOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {costsOpen && (
          <CostsProfitDrawer
            pricing={pricing}
            setSetting={setSetting}
            setCategory={setCategoryRule}
            categories={adminCategoryNames}
            orderQty={qtyNum}
            synced
            onClose={() => setCostsOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingProduct && (
          <ProductPricingModal
            product={editingProduct}
            pricing={pricing}
            orderQty={qtyNum}
            setOverride={setOverride}
            onClose={() => setEditingProduct(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed left-1/2 z-[70] max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-xl bg-brand-dark px-4 py-2.5 text-sm text-white shadow-lift ${hasTray ? 'bottom-24' : 'bottom-6'}`}
            role="status"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved products modal */}
      <AnimatePresence>
        {savedModalOpen && (
          <SavedProductsModal
            savedIds={savedIds}
            toggleSaved={toggleSaved}
            proposal={proposal}
            onClose={() => setSavedModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const SavedProductsModal = ({ savedIds, toggleSaved, proposal, onClose }) => {
  const [items, setItems] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const ids = [...savedIds];
    if (ids.length === 0) {
      setItems([]);
      return;
    }
    setItems(null);
    fetch(`${API_ENDPOINTS.products}?ids=${ids.join(',')}`)
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data) => { if (!cancelled) setItems(data.products || []); })
      .catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedIds.size]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-brand-light rounded-t-[2rem] sm:rounded-[2rem] shadow-lift w-full sm:max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-ink-200/70">
          <h3 className="font-display font-bold text-brand-dark text-xl flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50"><Heart className="w-4 h-4 fill-rose-500 text-rose-500" /></span> Saved products
          </h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-ink-100 hover:bg-ink-200 flex items-center justify-center" aria-label="Close">
            <X className="w-4 h-4 text-ink-600" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {items === null ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-ink-400 py-10">No saved products yet — tap the heart icon on any product to save it here.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  saved={savedIds.has(p._id)}
                  onToggleSave={toggleSaved}
                  selected={!!proposal.items[p._id]}
                  onToggleSelect={proposal.toggle}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Shop;
