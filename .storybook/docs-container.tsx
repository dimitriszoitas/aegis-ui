import { useEffect, useLayoutEffect, useState, type PropsWithChildren } from 'react';
import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks';
import { GLOBALS_UPDATED } from 'storybook/internal/core-events';
import { create } from 'storybook/theming';
import { applyTheme, type Theme } from '../src/lib/theme';

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
    applyTheme(theme, { persist: false });
  }, [theme]);
  return (
    <DocsContainer context={context} theme={docsThemes[theme]}>
      {children}
    </DocsContainer>
  );
}
