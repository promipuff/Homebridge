import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppState, View } from './types';
import { initialState } from './lib/defaults';
import { translator } from './lib/i18n';

const KEY = 'homebridge:v1';

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed && parsed.version === 1) return { ...initialState(), ...parsed };
    }
  } catch {
    /* storage unavailable: start fresh */
  }
  return initialState();
}

export interface Toast {
  id: number;
  text: string;
  tone: 'ok' | 'info' | 'warn';
}

interface Ctx {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  view: View;
  go: (v: View, focus?: string) => void;
  focusTarget: string | null;
  clearFocusTarget: () => void;
  toast: (text: string, tone?: Toast['tone']) => void;
  toasts: Toast[];
  t: (k: string) => string;
  storageOk: boolean;
  resetAll: () => void;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);
  const [view, setView] = useState<View>('dashboard');
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [storageOk, setStorageOk] = useState(true);
  const toastId = useRef(0);

  const toast = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      setStorageOk(true);
    } catch {
      setStorageOk(false);
    }
  }, [state]);

  // Apply accessibility and theme settings to the document root.
  useEffect(() => {
    const root = document.documentElement;
    const s = state.settings;
    root.style.fontSize = `${Math.round(s.textScale * 100)}%`;
    root.classList.toggle('hc', s.highContrast);
    root.classList.toggle('reduce-motion', s.reduceMotion);
    if (s.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', s.theme);
    root.lang = s.language;
  }, [state.settings]);

  const update = useCallback((fn: (s: AppState) => AppState) => setState((s) => fn(s)), []);
  const go = useCallback((v: View, focus?: string) => {
    setView(v);
    setFocusTarget(focus ?? null);
    window.scrollTo({ top: 0 });
  }, []);
  const resetAll = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    setState(initialState());
    setView('dashboard');
  }, []);

  const t = useMemo(() => translator(state.settings.language), [state.settings.language]);
  const value = useMemo(
    () => ({ state, update, view, go, focusTarget, clearFocusTarget: () => setFocusTarget(null), toast, toasts, t, storageOk, resetAll }),
    [state, update, view, go, focusTarget, toast, toasts, t, storageOk, resetAll],
  );
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore outside provider');
  return c;
}
