import type { Preview } from '@storybook/react-vite';
import '../src/styles/globals.css';
const preview: Preview = {
 tags: ['autodocs'],
 parameters: { layout: 'padded', controls: { expanded: true }, a11y: { test: 'error' } },
};
export default preview;
