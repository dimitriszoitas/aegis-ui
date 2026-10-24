import type { Preview } from '@storybook/react-vite';
import { withThemeByClassName, withThemeByDataAttribute } from '@storybook/addon-themes';
import { AegisDocsContainer, WithDocsTheme } from './docs-container';
import { WithConsoleCanvas } from './console-canvas';
import { defaultLayoutTheme, layoutThemeOptions } from '../src/lib/layout-theme';
import '../src/styles/globals.css';
import './story-layout.css';
const preview: Preview = {
  tags: ['autodocs'],
  initialGlobals: { layoutTheme: defaultLayoutTheme },
  globalTypes: {
    layoutTheme: {
      description: 'Fundamental presentation, independent of the light or dark color theme',
      toolbar: {
        title: 'Presentation',
        icon: 'sidebar',
        dynamicTitle: true,
        items: layoutThemeOptions.map(({ value, label }) => ({ value, title: label })),
      },
    },
  },
  decorators: [
    WithConsoleCanvas,
    withThemeByClassName({
      themes: { light: 'light', dark: 'dark' },
      defaultTheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      parentSelector: 'html',
    }),
    withThemeByDataAttribute({
      themes: { light: 'light', dark: 'dark' },
      defaultTheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      attributeName: 'data-theme',
      parentSelector: 'html',
    }),
    // The outer decorator supplies inherited globals before the theme strategies run.
    WithDocsTheme,
  ],
  parameters: {
    layout: 'padded',
    backgrounds: { disable: true },
    controls: { expanded: true },
    docs: { container: AegisDocsContainer },
    a11y: { test: 'error', manual: new URLSearchParams(window.location.search).has('aegisTest') },
    options: { storySort: { order: ['Foundations', 'Components', 'Patterns', 'Console'] } },
  },
};
export default preview;
