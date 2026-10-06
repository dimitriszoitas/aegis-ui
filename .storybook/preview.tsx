import type { Preview } from '@storybook/react-vite';
import { withThemeByClassName, withThemeByDataAttribute } from '@storybook/addon-themes';
import { AegisDocsContainer } from './docs-container';
import '../src/styles/globals.css';
const preview: Preview = {
  tags: ['autodocs'],
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
