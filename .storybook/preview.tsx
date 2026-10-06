import type { Preview } from '@storybook/react-vite';
import { withThemeByClassName, withThemeByDataAttribute } from '@storybook/addon-themes';
import { AegisDocsContainer, WithDocsTheme } from './docs-container';
import '../src/styles/globals.css';
const preview: Preview = {
  tags: ['autodocs'],
  initialGlobals: { layoutTheme: 'floating' },
  globalTypes: {
    layoutTheme: {
      description: 'Workspace layout, independent of the light or dark color theme',
      toolbar: {
        title: 'Layout',
        icon: 'sidebar',
        dynamicTitle: true,
        items: [
          { value: 'floating', title: 'Floating' },
          { value: 'fixed', title: 'Fixed' },
        ],
      },
    },
  },
  decorators: [
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
