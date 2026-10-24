import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ShieldCheck } from '@/components/icon';
import { Breadcrumb } from './breadcrumb';
const meta = {
  title: 'Components/Navigation/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  args: {
    items: [
      { label: 'Workspace', href: '#workspace' },
      { label: 'Records', href: '#records' },
      { label: 'ALT-2026-0842' },
    ],
  },
} satisfies Meta<typeof Breadcrumb>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Hierarchy: Story = {
  render: () => (
    <div className="stack">
      <Breadcrumb
        items={[
          { label: 'Aegis', icon: <ShieldCheck size={15} />, href: '#aegis' },
          { label: 'Projects', href: '#projects' },
          { label: 'Customer portal redesign' },
        ]}
      />
      <Breadcrumb
        items={[{ label: 'Projects', href: '#projects' }, { label: 'PRJ-2026-0184' }]}
        separator="/"
      />
      <Breadcrumb items={[{ label: 'Overview' }]} />
    </div>
  ),
};
function NavigationDemo() {
  const [location, setLocation] = useState('Record detail');
  return (
    <div className="story-layout stack">
      <Breadcrumb
        items={[
          { label: 'Overview', onClick: () => setLocation('Overview') },
          { label: 'Records', onClick: () => setLocation('Records') },
          { label: 'ALT-2026-0842' },
        ]}
      />
      <p className="muted" aria-live="polite" style={{ margin: 0 }}>
        Current view: {location}
      </p>
    </div>
  );
}
export const ClientNavigation: Story = { render: () => <NavigationDemo /> };
