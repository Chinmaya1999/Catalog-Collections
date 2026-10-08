import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, MessageCircle, Copy, Check, Trash2, PackageSearch, FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';
import { getImageUrl } from '../config/api';
import { buildWhatsAppText, buildCostingCsv, buildCustomerPdf, downloadBlob } from '../utils/proposalExport';

// Same WhatsApp number the rest of the site sends quotation/product requests to.
const WHATSAPP_NUMBER = '918296810381';

const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// Plain-text proposal for the public Shop tray (no pricing settings involved).
export const buildProposalText = (list, customer) => {
  const lines = ['*ADIHUMAN · Corporate Gifting*', customer ? `Gift options for ${customer}` : 'Gift options', ''];
  list.forEach((item, i) => {
    const qty = Number(item.qty) || 0;
    lines.push(`${i + 1}. ${item.code ? `${item.code} – ` : ''}${item.name}`);
    const price = item.price != null ? `${inr(item.price)} per unit` : 'Price on request';
    lines.push(`   ${price}${qty > 0 && item.price != null ? ` · ${qty} pcs = ${inr(item.price * qty)}` : qty > 0 ? ` · ${qty} pcs` : ''}`);
  });
  lines.push('', '_Prices are indicative per unit - please confirm the final price for my order._');
  return lines.join('\n');
};

/**
 * Proposal side panel.
 *  rows        - normalised lines (see utils/proposalExport.js); for the superadmin they carry cost/profit
 *  admin       - superadmin pricing view: generic WhatsApp share, costing CSV
 *  internal    - also show supplier codes and profit (false in "Customer view")
 *  usingShown  - nothing picked, so `rows` is just the first products the filters show
 *  settings    - pricing settings (brand, footer, contact) used for the PDF and WhatsApp text
 */
const ProposalDrawer = ({ proposal, rows, admin, internal, usingShown, shownTotal, filterText, onPickAll, settings, gst, onClose }) => {
  const { customer, setCustomer, note, setNote, totals: showTotals, setTotals, setQty, remove, clear } = proposal;
  const [copied, setCopied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState('');
  const [status, setStatus] = useState('');

  const priced = useMemo(() => rows.filter((r) => r.priced), [rows]);
  const exportOpts = { ...settings, customer, note, gst, totals: showTotals };
  const text = useMemo(
    () => buildWhatsAppText(rows, { ...settings, customer, note, gst, totals: showTotals }),
    [rows, settings, customer, note, gst, showTotals]
  );

  const totals = useMemo(() => rows.reduce((acc, r) => {
    if (r.qty > 0 && r.priced) {
      acc.units += r.qty;
      acc.value += r.qty * r.shown;
      if (r.landed != null) { acc.cost += r.qty * r.landed; acc.profit += r.qty * r.profit; }
    }
    return acc;
  }, { units: 0, value: 0, cost: 0, profit: 0 }), [rows]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setStatus('Copying is blocked here - use Send on WhatsApp instead.');
    }
  };

  const downloadPdf = async () => {
    if (!priced.length) { setStatus('None of these products has a price yet. Enter their supplier cost first.'); return; }
    setBusy('pdf');
    setStatus(`Building a PDF of ${priced.length} product${priced.length === 1 ? '' : 's'}…`);
    try {
      const { blob, filename } = await buildCustomerPdf(rows, exportOpts);
      downloadBlob(blob, filename);
      setStatus(`Downloaded: ${filename}`);
    } catch (err) {
      console.error('PDF build failed:', err);
      setStatus(`Could not build the PDF: ${err.message || err}`);
    } finally {
      setBusy('');
    }
  };

  const downloadCsv = () => {
    downloadBlob(new Blob([buildCostingCsv(rows, gst)], { type: 'text/csv;charset=utf-8' }), `Costing - ${customer || 'proposal'}.csv`);
  };

  const waHref = admin
    ? `https://wa.me/?text=${encodeURIComponent(text)}`
    : `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  const empty = rows.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 bottom-0 flex w-full max-w-[520px] flex-col bg-white shadow-lift"
        aria-label="Proposal"
      >
        <div className="flex items-center justify-between border-b border-ink-200/70 px-5 py-4">
          <h2 className="font-display text-xl font-bold text-brand-dark">Proposal</h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-100 hover:bg-ink-200" aria-label="Close proposal">
            <X className="h-4 w-4 text-ink-600" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <fieldset className="space-y-3 rounded-2xl border border-ink-200 p-4">
            <legend className="px-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">Customer</legend>
            <div>
              <label htmlFor="proposal-customer" className="mb-1.5 block text-sm font-medium text-brand-dark">Company / person</label>
              <input
                id="proposal-customer"
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="e.g. Infosys HR team"
                className="input-field !rounded-xl"
              />
            </div>
            <div>
              <label htmlFor="proposal-note" className="mb-1.5 block text-sm text-ink-500">Note on the PDF (optional)</label>
              <textarea
                id="proposal-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Diwali gifting, 250 employees, logo on notebook"
                rows={2}
                className="input-field !rounded-xl resize-y"
              />
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span className="text-sm font-medium text-brand-dark">
                Show quantity totals
                <span className="block text-xs font-normal text-ink-500">Only for items where you enter a quantity</span>
              </span>
              <input type="checkbox" checked={showTotals} onChange={(e) => setTotals(e.target.checked)} className="h-4 w-4 accent-brand-dark" />
            </label>
          </fieldset>

          {usingShown && !empty && (
            <div className="space-y-2 rounded-2xl bg-ink-50 px-4 py-3 text-sm text-ink-600">
              <p>
                You haven't picked products, so this uses the <b>{rows.length}{shownTotal > rows.length ? ` (first) of ${shownTotal}` : ''}</b> priced
                products shown by your filters ({filterText}).
              </p>
              <button type="button" onClick={onPickAll} className="rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-dark hover:border-brand-dark">
                Pick all {rows.length} so I can set quantities
              </button>
            </div>
          )}

          {empty ? (
            <div className="rounded-2xl bg-ink-50 px-6 py-12 text-center">
              <PackageSearch className="mx-auto mb-3 h-8 w-8 text-ink-300" />
              <p className="text-sm text-ink-500">
                {usingShown
                  ? 'No priced products match your filters. Close this and widen the budget or categories, or tap + on products to pick them.'
                  : 'No products yet. Close this, set your budget, and tap + on the products you want to offer.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {rows.map((r) => (
                <li key={r.id} className="grid grid-cols-[56px_1fr_auto] items-center gap-3 border-b border-ink-200/70 pb-3">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-ink-50 ring-1 ring-black/5">
                    {r.image ? (
                      <img src={getImageUrl(r.image)} alt="" className="h-full w-full object-contain mix-blend-multiply" loading="lazy" />
                    ) : (
                      <PackageSearch className="h-5 w-5 text-ink-300" />
                    )}
                  </div>
                  <div className="min-w-0 text-sm">
                    {r.code && (
                      <p className="font-mono text-[11px] text-ink-400">
                        {r.code}{internal && r.supplierCode ? ` · ${r.supplierCode}` : ''}
                      </p>
                    )}
                    <p className="truncate font-medium text-brand-dark">{r.name}</p>
                    <p className="font-bold text-brand-dark">
                      {r.priced ? <>{inr(r.shown)} <span className="text-xs font-normal text-ink-400">{gst}</span></> : admin ? 'No cost set' : 'Price on request'}
                      {internal && r.priced && r.profit != null && <span className="ml-1 text-xs font-semibold text-amber-600">· profit {inr(r.profit)}</span>}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {!usingShown && (
                      <>
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={r.qty || ''}
                          onChange={(e) => setQty(r.id, e.target.value)}
                          placeholder="Qty"
                          aria-label={`Quantity for ${r.name}`}
                          className="w-20 rounded-lg border border-ink-200 px-2 py-1.5 text-right text-sm outline-none focus:border-brand-dark"
                        />
                        <button onClick={() => remove(r.id)} className="text-xs font-semibold text-ink-400 hover:text-rose-500">Remove</button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!empty && (
            <div className="space-y-1 rounded-2xl bg-ink-50 px-4 py-3 text-sm">
              {totals.units > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-600">Order value ({totals.units.toLocaleString('en-IN')} units)</span>
                    <b className="font-display text-base text-brand-dark">{inr(totals.value)} <span className="text-xs font-normal text-ink-400">{gst}</span></b>
                  </div>
                  {internal && totals.cost > 0 && (
                    <>
                      <div className="flex items-center justify-between text-ink-600"><span>Your landed cost</span><span className="tabular-nums">{inr(totals.cost)}</span></div>
                      <div className="flex items-center justify-between font-semibold text-amber-600"><span>Your profit</span><span className="tabular-nums">{inr(totals.profit)}</span></div>
                    </>
                  )}
                </>
              ) : (
                <span className="text-ink-400">Enter quantities to see the order total.</span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2 border-t border-ink-200/70 px-5 py-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={downloadPdf} disabled={empty || !!busy} className="btn-primary flex-1 justify-center disabled:opacity-50">
              {busy === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {busy === 'pdf' ? 'Making PDF…' : 'Download customer PDF'}
            </button>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={empty}
              className={`btn-whatsapp justify-center ${empty ? 'pointer-events-none opacity-50' : ''}`}
            >
              <MessageCircle className="h-4 w-4" /> Send on WhatsApp
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={copy} disabled={empty} className="btn-outline disabled:opacity-50">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Copied' : 'Copy text'}
            </button>
            {internal && (
              <button onClick={downloadCsv} disabled={empty} className="btn-outline disabled:opacity-50">
                <FileSpreadsheet className="h-4 w-4" /> Download costing CSV
              </button>
            )}
            {!usingShown && !empty && (
              <button
                onClick={() => { if (confirmClear) { clear(); setConfirmClear(false); } else setConfirmClear(true); }}
                className="inline-flex items-center gap-1.5 px-3 text-sm font-semibold text-ink-500 hover:text-rose-500"
              >
                <Trash2 className="h-4 w-4" /> {confirmClear ? 'Tap again to clear' : 'Clear picks'}
              </button>
            )}
          </div>
          {status && <p className="text-xs text-ink-500" role="status">{status}</p>}
        </div>
      </motion.aside>
    </motion.div>
  );
};

export default ProposalDrawer;
