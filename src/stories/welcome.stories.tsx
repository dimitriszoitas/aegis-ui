import type { Meta, StoryObj } from '@storybook/react-vite';
function Welcome() { return <main><h1>Aegis</h1><p>A floating surface design system for security operations.</p></main>; }
export default { title: 'Foundations/Welcome', component: Welcome } satisfies Meta<typeof Welcome>;
export const Overview: StoryObj<typeof Welcome> = {};
