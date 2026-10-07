import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, MessageCircle, Copy, Check, Trash2, PackageSearch } from 'lucide-react';
import { getImageUrl } from '../config/api';

// Same WhatsApp number the rest of the site sends quotation/product requests to.
const WHATSAPP_NUMBER = '918296810381';

const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

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

const ProposalDrawer = ({ proposal, onClose }) => {
  const { list, customer, setCustomer, setQty, remove, clear } = proposal;
  const [copied, setCopied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const text = useMemo(() => buildProposalText(list, customer), [list, customer]);
  const totals = useMemo(() => list.reduce((acc, i) => {
    const qty = Number(i.qty) || 0;
    if (qty > 0 && i.price != null) { acc.units += qty; acc.value += qty * i.price; }
    return acc;
  }, { units: 0, value: 0 }), [list]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked - the WhatsApp button still works
    }
  };

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
          <div>
            <label htmlFor="proposal-customer" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">
              Company / person
            </label>
            <input
              id="proposal-customer"
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="e.g. Infosys HR team"
              className="input-field !rounded-xl"
            />
          </div>

          {list.length === 0 ? (
            <div className="rounded-2xl bg-ink-50 px-6 py-12 text-center">
              <PackageSearch className="mx-auto mb-3 h-8 w-8 text-ink-300" />
              <p className="text-sm text-ink-500">
                No products yet. Close this, set your budget, and tap + on the products you want to offer.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {list.map((item) => (
                <li key={item.id} className="grid grid-cols-[56px_1fr_auto] items-center gap-3 border-b border-ink-200/70 pb-3">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-ink-50 ring-1 ring-black/5">
                    {item.image ? (
                      <img src={getImageUrl(item.image)} alt="" className="h-full w-full object-contain mix-blend-multiply" loading="lazy" />
                    ) : (
                      <PackageSearch className="h-5 w-5 text-ink-300" />
                    )}
                  </div>
                  <div className="min-w-0 text-sm">
                    {item.code && <p className="font-mono text-[11px] text-ink-400">{item.code}</p>}
                    <p className="truncate font-medium text-brand-dark">{item.name}</p>
                    <p className="font-bold text-brand-dark">{item.price != null ? inr(item.price) : 'Price on request'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={item.qty}
                      onChange={(e) => setQty(item.id, e.target.value)}
                      placeholder="Qty"
                      aria-label={`Quantity for ${item.name}`}
                      className="w-20 rounded-lg border border-ink-200 px-2 py-1.5 text-right text-sm outline-none focus:border-brand-dark"
                    />
                    <button onClick={() => remove(item.id)} className="text-xs font-semibold text-ink-400 hover:text-rose-500">Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {list.length > 0 && (
            <div className="flex items-center justify-between rounded-2xl bg-ink-50 px-4 py-3 text-sm">
              {totals.units > 0 ? (
                <>
                  <span className="text-ink-600">Order value ({totals.units.toLocaleString('en-IN')} units)</span>
                  <b className="font-display text-base text-brand-dark">{inr(totals.value)}</b>
                </>
              ) : (
                <span className="text-ink-400">Enter quantities to see the order total.</span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-ink-200/70 px-5 py-4">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={list.length === 0}
            className={`btn-whatsapp flex-1 justify-center ${list.length === 0 ? 'pointer-events-none opacity-50' : ''}`}
          >
            <MessageCircle className="h-4 w-4" /> Send on WhatsApp
          </a>
          <button onClick={copy} disabled={list.length === 0} className="btn-outline disabled:opacity-50">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Copied' : 'Copy text'}
          </button>
          {list.length > 0 && (
            <button
              onClick={() => { if (confirmClear) { clear(); setConfirmClear(false); } else setConfirmClear(true); }}
              className="inline-flex items-center gap-1.5 px-3 text-sm font-semibold text-ink-500 hover:text-rose-500"
            >
              <Trash2 className="h-4 w-4" /> {confirmClear ? 'Tap again to clear' : 'Clear all'}
            </button>
          )}
        </div>
      </motion.aside>
    </motion.div>
  );
};

export default ProposalDrawer;
