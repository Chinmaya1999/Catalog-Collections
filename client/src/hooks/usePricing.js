import { useState, useEffect, useCallback, useRef } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { emptyPricing, normalizePricing } from '../utils/pricing';

const PRICING_KEY = 'catlog_pricing';
const SAVE_DELAY_MS = 900;

const loadLocal = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(PRICING_KEY) || 'null');
    if (stored) return normalizePricing(stored);
  } catch {
    // fall through to the defaults
  }
  return emptyPricing();
};

/**
 * The superadmin's "Costs & profit" settings: { s: settings, cat: per-category overrides,
 * ov: per-product overrides }. Cached in localStorage for an instant first paint and saved to the
 * server (debounced) so the same settings show up on every device. Pass a null token for visitors:
 * nothing is read from or written to the server for them.
 */
export const usePricing = (adminToken) => {
  const [pricing, setPricing] = useState(loadLocal);
  const saveTimer = useRef(null);
  const tokenRef = useRef(adminToken);
  tokenRef.current = adminToken;

  const pushToServer = useCallback((value) => {
    if (!tokenRef.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch(`${API_ENDPOINTS.products}/admin/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ data: value })
      }).catch(() => { /* still cached locally; the next change retries */ });
    }, SAVE_DELAY_MS);
  }, []);

  // Server copy wins on load; if there isn't one yet, seed it from this device.
  useEffect(() => {
    if (!adminToken) return undefined;
    let cancelled = false;
    fetch(`${API_ENDPOINTS.products}/admin/pricing`, { headers: { Authorization: `Bearer ${adminToken}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (cancelled || !body) return;
        if (body.data) {
          const next = normalizePricing(body.data);
          setPricing(next);
          try { localStorage.setItem(PRICING_KEY, JSON.stringify(next)); } catch { /* private browsing */ }
        } else {
          pushToServer(loadLocal());
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [adminToken, pushToServer]);

  const update = useCallback((fn) => {
    setPricing((prev) => {
      const next = fn(prev);
      try { localStorage.setItem(PRICING_KEY, JSON.stringify(next)); } catch { /* private browsing */ }
      pushToServer(next);
      return next;
    });
  }, [pushToServer]);

  const setSetting = useCallback((key, value) => update((p) => ({ ...p, s: { ...p.s, [key]: value } })), [update]);

  const setCategory = useCallback((name, key, value) => update((p) => {
    const row = { ...(p.cat[name] || {}) };
    if (value === '' || value == null) delete row[key]; else row[key] = +value;
    const cat = { ...p.cat };
    if (Object.keys(row).length) cat[name] = row; else delete cat[name];
    return { ...p, cat };
  }), [update]);

  // key is 'cost' or 'profit'; blank clears it so the product falls back to the shared rules.
  const setOverride = useCallback((code, key, value) => update((p) => {
    const row = { ...(p.ov[code] || {}) };
    if (value === '' || value == null) delete row[key]; else row[key] = +value;
    const ov = { ...p.ov };
    if (Object.keys(row).length) ov[code] = row; else delete ov[code];
    return { ...p, ov };
  }), [update]);

  return { pricing, setSetting, setCategory, setOverride };
};
