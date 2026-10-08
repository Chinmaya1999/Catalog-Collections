import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { priceOf, gstLabel } from '../utils/pricing';

const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const field = 'rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-dark';

// Number input that keeps what is being typed (so it can be cleared) and commits the parsed value.
// `blankAs` is what an emptied field means: 0 for a plain setting, '' for an optional override.
const NumField = ({ value, onCommit, blankAs = 0, placeholder, className = 'w-28', label }) => {
  const [text, setText] = useState(null);
  const shown = text ?? (value === undefined || value === null ? '' : String(value));
  return (
    <input
      type="number"
      inputMode="decimal"
      step="any"
      value={shown}
      placeholder={placeholder}
      aria-label={label}
      onChange={(e) => { setText(e.target.value); onCommit(e.target.value === '' ? blankAs : +e.target.value); }}
      onBlur={() => setText(null)}
      className={`${field} text-right ${className}`}
    />
  );
};

const Row = ({ label, hint, htmlFor, children }) => (
  <div className="flex items-center justify-between gap-4">
    <label htmlFor={htmlFor} className="min-w-0 text-sm font-medium text-brand-dark">
      {label}
      {hint && <span className="block text-xs font-normal text-ink-500">{hint}</span>}
    </label>
    {children}
  </div>
);

const Section = ({ title, children }) => (
  <fieldset className="space-y-3 rounded-2xl border border-ink-200 p-4">
    <legend className="px-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">{title}</legend>
    {children}
  </fieldset>
);

const Toggle = ({ id, checked, onChange }) => (
  <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 shrink-0 accent-brand-dark" />
);

// Profit-by-quantity bands. Edits are held as text and committed on blur; the last row is always blank
// for adding a band, and a row with no "from" or no profit is dropped.
const QtyBands = ({ bands, onCommit }) => {
  const toDraft = (b) => [...(bands || []), [null, null, null]].map((r) => r.map((v) => (v == null ? '' : String(v))));
  const [draft, setDraft] = useState(toDraft);

  const edit = (i, k, v) => setDraft((d) => d.map((r, ri) => (ri === i ? r.map((c, ci) => (ci === k ? v : c)) : r)));
  const commit = () => {
    const rows = draft
      .filter((r) => r[0].trim() !== '' && r[2].trim() !== '')
      .map((r) => [+r[0], r[1].trim() === '' ? null : +r[1], +r[2]])
      .sort((a, b) => a[0] - b[0]);
    onCommit(rows);
    setDraft([...rows, [null, null, null]].map((r) => r.map((v) => (v == null ? '' : String(v)))));
  };
  const cell = (i, k, props) => (
    <input
      type="number"
      inputMode="numeric"
      value={draft[i][k]}
      onChange={(e) => edit(i, k, e.target.value)}
      onBlur={commit}
      className={`${field} w-24 !px-2 !py-1.5 text-right`}
      {...props}
    />
  );

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-ink-50 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-500">
          <th className="px-2 py-2 text-left">From qty</th>
          <th className="px-2 py-2 text-left">To qty</th>
          <th className="px-2 py-2 text-right">Profit %</th>
        </tr>
      </thead>
      <tbody>
        {draft.map((r, i) => (
          <tr key={i}>
            <td className="px-2 py-1">{cell(i, 0, { 'aria-label': 'From quantity' })}</td>
            <td className="px-2 py-1">{cell(i, 1, { 'aria-label': 'To quantity', placeholder: r[0] !== '' ? 'and above' : '' })}</td>
            <td className="px-2 py-1 text-right">{cell(i, 2, { 'aria-label': 'Profit %' })}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const CostsProfitDrawer = ({ pricing, setSetting, setCategory, categories, orderQty, synced, onClose }) => {
  const { s, cat } = pricing;

  const example = useMemo(() => {
    const pr = priceOf({ code: '__example__', cost: 100, category: '' }, 0, orderQty, pricing);
    return pr;
  }, [pricing, orderQty]);

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
        aria-label="Costs and profit"
      >
        <div className="flex items-center justify-between border-b border-ink-200/70 px-5 py-4">
          <h2 className="font-display text-xl font-bold text-brand-dark">Costs &amp; profit</h2>
          <button onClick={onClose} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink-100 px-4 text-sm font-semibold text-ink-700 hover:bg-ink-200">
            <X className="h-3.5 w-3.5" /> Done
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {example && (
            <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 rounded-2xl bg-brand-dark p-4 text-sm text-white">
              <span className="col-span-2 text-xs text-white/60">
                Example for {orderQty > 1 ? `${orderQty} pcs` : '1 pc (set Order qty to see another quantity)'}
              </span>
              <span>Supplier price (ex-GST)</span><span className="tabular-nums">₹100</span>
              {s.inputGst && <><span>+ supplier GST {s.gstRate}%</span><span className="tabular-nums">{inr(example.supplier - 100)}</span></>}
              <span>+ your add-ons</span><span className="tabular-nums">{inr(example.addons)}</span>
              <span>= landed cost</span><span className="tabular-nums">{inr(example.landed)}</span>
              <span className="text-brand-yellow">+ profit ({example.pct}% {s.method === 'margin' ? 'margin on price' : 'markup on cost'})</span>
              <span className="tabular-nums text-brand-yellow">{inr(example.profit)}</span>
              <span className="mt-1 border-t border-white/15 pt-2 font-semibold">Customer sees</span>
              <span className="mt-1 border-t border-white/15 pt-2 font-semibold tabular-nums">{inr(example.shown)} {gstLabel(s)}</span>
            </div>
          )}

          <Section title="Profit">
            <Row label="How profit is set" hint="Markup adds % to cost; margin is % of the selling price" htmlFor="cp-method">
              <select id="cp-method" value={s.method} onChange={(e) => setSetting('method', e.target.value)} className={`${field} w-44`}>
                <option value="markup">Markup on cost</option>
                <option value="margin">Margin on price</option>
              </select>
            </Row>
            <Row label="Default profit %" hint="Used when profit by quantity is off" htmlFor="cp-profit">
              <NumField label="Default profit %" value={s.profit} onCommit={(v) => setSetting('profit', v)} />
            </Row>
          </Section>

          <Section title="Profit by order quantity">
            <Row
              label="Use profit by quantity"
              hint="Priced at the Order qty you enter, or the quantity on each proposal item. With no quantity, 1 pc is used."
              htmlFor="cp-useqty"
            >
              <Toggle id="cp-useqty" checked={s.useQtyProfit} onChange={(v) => setSetting('useQtyProfit', v)} />
            </Row>
            <QtyBands bands={s.qtyProfit} onCommit={(rows) => setSetting('qtyProfit', rows)} />
            <p className="text-xs text-ink-500">
              Leave "To qty" empty on the last row for "and above". Use the empty row to add a band; clear a row's numbers to remove it.
              A profit % set on a category or a single product still takes priority.
            </p>
          </Section>

          <Section title="Your costs per unit">
            <Row label="Branding / printing ₹" hint="Logo printing, engraving"><NumField label="Branding" value={s.branding} onCommit={(v) => setSetting('branding', v)} /></Row>
            <Row label="Packaging ₹" hint="Gift box, wrap, card"><NumField label="Packaging" value={s.packaging} onCommit={(v) => setSetting('packaging', v)} /></Row>
            <Row label="Courier & handling %" hint="% of supplier price"><NumField label="Courier and handling" value={s.freightPct} onCommit={(v) => setSetting('freightPct', v)} /></Row>
            <Row label="Other ₹" hint="Anything else per unit"><NumField label="Other" value={s.other} onCommit={(v) => setSetting('other', v)} /></Row>
            <Row label="Add supplier GST to my cost" hint="Tick if you can't claim input GST credit" htmlFor="cp-inputgst">
              <Toggle id="cp-inputgst" checked={s.inputGst} onChange={(v) => setSetting('inputGst', v)} />
            </Row>
          </Section>

          <Section title="Price shown to customers">
            <Row label="Show prices including GST" hint="Otherwise shown as “+ GST”" htmlFor="cp-incl">
              <Toggle id="cp-incl" checked={s.showIncl} onChange={(v) => setSetting('showIncl', v)} />
            </Row>
            <Row label="GST rate %"><NumField label="GST rate" value={s.gstRate} onCommit={(v) => setSetting('gstRate', v)} /></Row>
            <Row label="Round prices" htmlFor="cp-round">
              <select id="cp-round" value={s.round} onChange={(e) => setSetting('round', e.target.value)} className={`${field} w-44`}>
                <option value="0">Exact</option>
                <option value="1">Nearest ₹1</option>
                <option value="5">Up to ₹5</option>
                <option value="10">Up to ₹10</option>
                <option value="9">Ending in 9</option>
              </select>
            </Row>
            <Row label="Code prefix for customers" hint="Replaces the supplier’s “HGS-”" htmlFor="cp-prefix">
              <input id="cp-prefix" type="text" value={s.prefix} onChange={(e) => setSetting('prefix', e.target.value)} className={`${field} w-28`} />
            </Row>
          </Section>

          <Section title="By category">
            <p className="text-xs text-ink-500">
              Override the profit % or add an extra ₹ per unit for a whole category. Leave blank to use the defaults above.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink-50 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-500">
                  <th className="px-2 py-2 text-left">Category</th>
                  <th className="px-2 py-2 text-right">Profit %</th>
                  <th className="px-2 py-2 text-right">Extra ₹</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c} className="border-t border-ink-200/70">
                    <td className="px-2 py-1.5 text-brand-dark">{c}</td>
                    <td className="px-2 py-1 text-right">
                      <NumField label={`Profit % for ${c}`} className="w-20 !px-2 !py-1.5" blankAs="" placeholder={String(s.profit)} value={cat[c]?.profit} onCommit={(v) => setCategory(c, 'profit', v)} />
                    </td>
                    <td className="px-2 py-1 text-right">
                      <NumField label={`Extra ₹ for ${c}`} className="w-20 !px-2 !py-1.5" blankAs="" placeholder="0" value={cat[c]?.extra} onCommit={(v) => setCategory(c, 'extra', v)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Your details on customer PDFs">
            <Row label="Business name" htmlFor="cp-brand"><input id="cp-brand" type="text" value={s.brand} onChange={(e) => setSetting('brand', e.target.value)} className={`${field} w-52`} /></Row>
            <Row label="Tagline" htmlFor="cp-sub"><input id="cp-sub" type="text" value={s.sub} onChange={(e) => setSetting('sub', e.target.value)} className={`${field} w-52`} /></Row>
            <Row label="Contact line" hint="Phone, email or website" htmlFor="cp-contact"><input id="cp-contact" type="text" value={s.contact} onChange={(e) => setSetting('contact', e.target.value)} className={`${field} w-52`} /></Row>
            <div>
              <label htmlFor="cp-footer" className="mb-1.5 block text-xs text-ink-500">Footer note</label>
              <textarea id="cp-footer" rows={2} value={s.footer} onChange={(e) => setSetting('footer', e.target.value)} className={`${field} w-full resize-y`} />
            </div>
          </Section>

          <p className="text-xs text-ink-500">
            {synced ? 'Saved to your account, so the same settings appear on your phone and laptop.' : 'Saved on this device.'}
          </p>
        </div>
      </motion.aside>
    </motion.div>
  );
};

export default CostsProfitDrawer;
