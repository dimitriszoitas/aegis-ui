import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioTower, ShieldAlert, UserRound } from 'lucide-react';
import { Accordion, type AccordionItem } from './accordion';

const items: AccordionItem[] = [
  {
    value: 'severity',
    title: 'Severity',
    icon: <ShieldAlert />,
    count: 150,
    content: (
      <div>
        Critical: 12 alerts · High: 38 alerts · Medium: 64 alerts · Low: 28 alerts · Info: 8 alerts
      </div>
    ),
  },
  {
    value: 'source',
    title: 'Telemetry source',
    icon: <RadioTower />,
    count: 4,
    content:
      'Endpoint detection, firewall, identity provider, and DNS resolver logs are available in this investigation.',
  },
  {
    value: 'analyst',
    title: 'Assigned analyst',
    icon: <UserRound />,
    count: 3,
    content: 'Maya Chen, Nikos Papadopoulos, and Alex Morgan are on the current response shift.',
  },
  {
    value: 'restricted',
    title: 'Restricted evidence',
    content: 'Restricted incident evidence.',
    disabled: true,
  },
];
const meta = {
  title: 'Components/Lists/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  args: { type: 'single', collapsible: true, items, defaultValue: 'severity' },
} satisfies Meta<typeof Accordion>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Single: Story = {};
export const Multiple: Story = {
  render: () => <Accordion type="multiple" defaultValue={['severity', 'source']} items={items} />,
};
export const Contained: Story = { args: { variant: 'contained' } };
function ControlledExample() {
  const [value, setValue] = useState<string[]>(['source']);
  return (
    <>
      <Accordion type="multiple" value={value} onValueChange={setValue} items={items} />
      <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
        {value.length} filter sections expanded
      </p>
    </>
  );
}
export const Controlled: Story = { render: () => <ControlledExample /> };
