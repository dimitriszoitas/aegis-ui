import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

/** UI presentation is independent of the light/dark color theme. */
export type LayoutTheme = 'floating' | 'fixed' | 'minimalistic';
export const layoutThemeLabels: Record<LayoutTheme, string> = {
  floating: 'Floating',
  fixed: 'Fixed',
  minimalistic: 'Minimalistic',
};
export const layoutThemeOptions: readonly { value: LayoutTheme; label: string }[] = [
  { value: 'floating', label: layoutThemeLabels.floating },
  { value: 'fixed', label: layoutThemeLabels.fixed },
  { value: 'minimalistic', label: layoutThemeLabels.minimalistic },
];
export const layoutThemeStorageKey = 'aegis-layout-theme';
const layoutThemeChangeEvent = 'aegis:layout-theme-change';

export function isLayoutTheme(value: unknown): value is LayoutTheme {
  return value === 'floating' || value === 'fixed' || value === 'minimalistic';
}

export function getInitialLayoutTheme(): LayoutTheme {
  if (typeof window === 'undefined') return 'floating';
  try {
    const stored = window.localStorage.getItem(layoutThemeStorageKey);
    return isLayoutTheme(stored) ? stored : 'floating';
  } catch {
    return 'floating';
  }
}

/** Apply at the document root so portaled panels follow the workspace layout. */
export function applyLayoutTheme(
  theme: LayoutTheme,
  { persist = true }: { persist?: boolean } = {},
): LayoutTheme {
  if (typeof document === 'undefined') return theme;
  document.documentElement.dataset.layoutTheme = theme;
  if (persist) {
    try {
      window.localStorage.setItem(layoutThemeStorageKey, theme);
    } catch {
      // Restricted embeds can still change the active layout.
    }
  }
  window.dispatchEvent(new CustomEvent(layoutThemeChangeEvent, { detail: theme }));
  return theme;
}

export function useLayoutTheme() {
  const [layoutTheme, setLayout] = useState<LayoutTheme>(getInitialLayoutTheme);
  useEffect(() => {
    const handleChange = (event: Event) => {
      const next = (event as CustomEvent<unknown>).detail;
      if (isLayoutTheme(next)) setLayout(next);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === layoutThemeStorageKey || event.key === null)
        setLayout(getInitialLayoutTheme());
    };
    window.addEventListener(layoutThemeChangeEvent, handleChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(layoutThemeChangeEvent, handleChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);
  useLayoutEffect(() => {
    applyLayoutTheme(layoutTheme, { persist: false });
  }, [layoutTheme]);
  const setLayoutTheme = useCallback((next: LayoutTheme) => {
    setLayout(next);
    applyLayoutTheme(next);
  }, []);
  return { layoutTheme, setLayoutTheme };
}
