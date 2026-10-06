import { useEffect, type RefObject } from 'react';

const isolatedElements = new Map<HTMLElement, { count: number; previous: boolean }>();

/** Pair Radix's aria-hidden treatment with native inertness for background controls. */
export function useModalIsolation(contentRef: RefObject<HTMLElement | null>, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const content = contentRef.current;
    if (!content) return;
    const isolated: HTMLElement[] = [];
    for (const element of document.body.children) {
      if (
        !(element instanceof HTMLElement) ||
        element.contains(content) ||
        element.matches('[data-aegis-overlay], [data-radix-focus-guard]')
      )
        continue;
      const existing = isolatedElements.get(element);
      if (existing) existing.count += 1;
      else isolatedElements.set(element, { count: 1, previous: element.inert });
      element.inert = true;
      isolated.push(element);
    }
    return () => {
      for (const element of isolated) {
        const state = isolatedElements.get(element);
        if (!state) continue;
        state.count -= 1;
        if (state.count === 0) {
          element.inert = state.previous;
          isolatedElements.delete(element);
        }
      }
    };
  }, [contentRef, enabled]);
}
