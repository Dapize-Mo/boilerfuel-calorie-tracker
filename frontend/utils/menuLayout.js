// utils/menuLayout.js
// Persisted preference for which Nutrition-Facts layout the user prefers,
// shared between the /menu header toggle and the Profile → Settings control.

import { useCallback, useEffect, useState } from 'react';

export const MENU_LAYOUT_KEY = 'boilerfuel_menu_layout';
export const MENU_LAYOUTS = ['ledger', 'spread'];
export const DEFAULT_MENU_LAYOUT = 'ledger';

export function getMenuLayout() {
  if (typeof window === 'undefined') return DEFAULT_MENU_LAYOUT;
  try {
    const v = window.localStorage.getItem(MENU_LAYOUT_KEY);
    return MENU_LAYOUTS.includes(v) ? v : DEFAULT_MENU_LAYOUT;
  } catch {
    return DEFAULT_MENU_LAYOUT;
  }
}

export function useMenuLayout() {
  const [layout, setLayoutState] = useState(DEFAULT_MENU_LAYOUT);

  useEffect(() => {
    setLayoutState(getMenuLayout());
    const onStorage = (e) => { if (e.key === MENU_LAYOUT_KEY) setLayoutState(getMenuLayout()); };
    const onCustom = () => setLayoutState(getMenuLayout());
    window.addEventListener('storage', onStorage);
    window.addEventListener('bf-menu-layout', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('bf-menu-layout', onCustom);
    };
  }, []);

  const setLayout = useCallback((next) => {
    const value = MENU_LAYOUTS.includes(next) ? next : DEFAULT_MENU_LAYOUT;
    try { window.localStorage.setItem(MENU_LAYOUT_KEY, value); } catch {}
    setLayoutState(value);
    try { window.dispatchEvent(new CustomEvent('bf-menu-layout', { detail: value })); } catch {}
  }, []);

  return [layout, setLayout];
}
