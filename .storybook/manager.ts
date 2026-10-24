import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

addons.setConfig({
  theme: create({
    base: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    brandTitle: 'Aegis',
    brandUrl: '?path=/docs/foundations-welcome--docs',
    brandTarget: '_self',
  }),
});
