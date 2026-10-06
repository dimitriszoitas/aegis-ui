import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ShieldCheck } from 'lucide-react';
import { Breadcrumb } from './breadcrumb';
const meta = {
  title: 'Components/Navigation/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  args: {
    items: [
      { label: 'Workspace', href: '#workspace' },
      { label: 'Alerts', href: '#alerts' },
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
          { label: 'Detection rules', href: '#rules' },
          { label: 'Encoded PowerShell execution' },
        ]}
      />
      <Breadcrumb
        items={[{ label: 'Incidents', href: '#incidents' }, { label: 'INC-2026-0184' }]}
        separator="/"
      />
      <Breadcrumb items={[{ label: 'Overview' }]} />
    </div>
  ),
};
function NavigationDemo() {
  const [location, setLocation] = useState('Alert detail');
  return (
    <div className="surface stack">
      <Breadcrumb
        items={[
          { label: 'Overview', onClick: () => setLocation('Overview') },
          { label: 'Alerts', onClick: () => setLocation('Alerts') },
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
