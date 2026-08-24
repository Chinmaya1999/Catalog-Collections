import { useState, useCallback } from 'react';

const SAVED_KEY = 'catlog_saved_catalogs';

const loadSavedIds = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set();
  }
};

const persistSavedIds = (ids) => {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore write failures (e.g. private browsing)
  }
};

/**
 * Shared "saved catalogs" state, backed by localStorage under one key so a
 * catalog saved from the Home page still shows saved on the Catalog page.
 */
export const useSavedCatalogs = () => {
  const [savedIds, setSavedIds] = useState(() => loadSavedIds());

  const toggleSaved = useCallback((id) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      persistSavedIds(next);
      return next;
    });
  }, []);

  return { savedIds, toggleSaved };
};
