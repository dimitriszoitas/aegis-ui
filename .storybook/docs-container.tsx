import { useEffect, useLayoutEffect, useState, type PropsWithChildren } from 'react';
import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks';
import type { Decorator } from '@storybook/react-vite';
import { GLOBALS_UPDATED } from 'storybook/internal/core-events';
import { useEffect as usePreviewEffect } from 'storybook/preview-api';
import { create } from 'storybook/theming';
import { applyTheme, type Theme } from '../src/lib/theme';

const docsThemeAttribute = 'data-aegis-docs-theme';

function parentDocsRoot(): HTMLElement | null {
  try {
    // Only Story blocks inherit their docs host, not standalone or manager previews.
    return window.frameElement?.id.startsWith('iframe--')
      ? window.parent.document.documentElement
      : null;
  } catch {
    return null;
  }
}

function readDocsTheme(root: HTMLElement | null): Theme | undefined {
  const theme = root?.getAttribute(docsThemeAttribute);
  return theme === 'light' || theme === 'dark' ? theme : undefined;
}

/** Isolated Docs stories omit URL globals; inherit the host without reloading the story. */
export const WithDocsTheme: Decorator = function WithDocsTheme(Story, context) {
  const root = parentDocsRoot();
  const theme = readDocsTheme(root);
  const override = context.parameters.themes?.themeOverride;
  usePreviewEffect(() => {
    if (!root) return;
    const update = () => {
      const next = override === 'light' || override === 'dark' ? override : readDocsTheme(root);
      if (!next) return;
      // Mirror the theme without initiating another Storybook render.
      document.documentElement.classList.toggle('light', next === 'light');
      applyTheme(next, { persist: false });
    };
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: [docsThemeAttribute] });
    update();
    return () => observer.disconnect();
  }, [root, override]);
  return Story(theme ? { globals: { ...context.globals, theme } } : undefined);
};

function initialTheme(context: DocsContainerProps['context']): Theme {
  try {
    const theme = context.getStoryContext(context.storyById()).globals.theme;
    if (theme === 'light' || theme === 'dark') return theme;
  } catch {
    // Standalone MDX pages have no primary component story.
  }
  const searches = [window.location.search];
  try {
    searches.push(window.parent.location.search);
  } catch {
    /* Cross-origin embeds use their own URL. */
  }
  for (const search of searches) {
    const globals = new URLSearchParams(search).get('globals') ?? '';
    const theme = globals.match(/(?:^|;)theme:(light|dark)(?:;|$)/)?.[1];
    if (theme === 'light' || theme === 'dark') return theme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
const docsThemes = {
  light: create({
    base: 'light',
    fontBase: 'Inter, sans-serif',
    fontCode: 'JetBrains Mono, monospace',
  }),
  dark: create({
    base: 'dark',
    fontBase: 'Inter, sans-serif',
    fontCode: 'JetBrains Mono, monospace',
  }),
};
/** MDX pages need the same global theme treatment as decorated component stories. */
export function AegisDocsContainer({ context, children }: PropsWithChildren<DocsContainerProps>) {
  const [theme, setTheme] = useState(() => initialTheme(context));
  useEffect(() => {
    const update = ({ globals }: { globals: Record<string, unknown> }) => {
      if (globals.theme === 'light' || globals.theme === 'dark') setTheme(globals.theme);
    };
    context.channel.on(GLOBALS_UPDATED, update);
    return () => context.channel.off(GLOBALS_UPDATED, update);
  }, [context.channel]);
  useLayoutEffect(() => {
    document.documentElement.setAttribute(docsThemeAttribute, theme);
    applyTheme(theme, { persist: false });
    return () => document.documentElement.removeAttribute(docsThemeAttribute);
  }, [theme]);
  return (
    <DocsContainer context={context} theme={docsThemes[theme]}>
      {children}
    </DocsContainer>
  );
}
