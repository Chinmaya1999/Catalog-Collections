import { useState, useCallback, useMemo } from 'react';

const PROPOSAL_KEY = 'catlog_proposal';

const empty = { items: {}, customer: '' };

const load = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(PROPOSAL_KEY) || 'null');
    if (stored && typeof stored.items === 'object') return { ...empty, ...stored };
  } catch {
    // fall through to the empty proposal
  }
  return empty;
};

const persist = (state) => {
  try {
    localStorage.setItem(PROPOSAL_KEY, JSON.stringify(state));
  } catch {
    // ignore write failures (e.g. private browsing)
  }
};

// The supplier-facing "HGS-" prefix is swapped for our own "AH-" so customers see Adihuman codes.
export const displayCode = (product) => {
  const sku = product?.variants?.[0]?.sku;
  return sku ? sku.replace(/^HGS-/, 'AH-') : '';
};

// A proposal item keeps its own snapshot (code/name/price/photo), so the list survives a page
// reload without re-fetching every product, and still renders if a product is later unpublished.
const snapshot = (product) => {
  const primary = product.images?.find((i) => i.isPrimary) || product.images?.[0];
  return {
    code: displayCode(product),
    name: product.name || 'Unnamed product',
    price: typeof product.priceFrom === 'number' ? product.priceFrom : null,
    image: primary?.path || null,
    qty: ''
  };
};

/** "Proposal" basket on the Shop page: pick products, set quantities, send the list on WhatsApp. */
export const useProposal = () => {
  const [state, setState] = useState(load);

  const update = useCallback((fn) => {
    setState((prev) => {
      const next = fn(prev);
      persist(next);
      return next;
    });
  }, []);

  const toggle = useCallback((product) => update((prev) => {
    const items = { ...prev.items };
    if (items[product._id]) delete items[product._id]; else items[product._id] = snapshot(product);
    return { ...prev, items };
  }), [update]);

  const addMany = useCallback((products) => update((prev) => {
    const items = { ...prev.items };
    products.forEach((p) => { if (!items[p._id]) items[p._id] = snapshot(p); });
    return { ...prev, items };
  }), [update]);

  const setQty = useCallback((id, qty) => update((prev) => (
    prev.items[id] ? { ...prev, items: { ...prev.items, [id]: { ...prev.items[id], qty } } } : prev
  )), [update]);

  const remove = useCallback((id) => update((prev) => {
    const items = { ...prev.items };
    delete items[id];
    return { ...prev, items };
  }), [update]);

  const setCustomer = useCallback((customer) => update((prev) => ({ ...prev, customer })), [update]);
  const clear = useCallback(() => update((prev) => ({ ...prev, items: {} })), [update]);

  const list = useMemo(() => Object.entries(state.items).map(([id, item]) => ({ id, ...item })), [state.items]);

  return { items: state.items, list, customer: state.customer, toggle, addMany, setQty, remove, setCustomer, clear };
};
