import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Globe, KeyRound, ShieldCheck, User } from 'lucide-react';
import { TextInput, type TextInputSize } from './text-input';
import { Field } from '@/components/field';

const meta = { title: 'Components/Forms/TextInput', component: TextInput, tags: ['autodocs'], args: { label: 'Hostname', defaultValue: 'WS-ATH-114' }, argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] }, prefix: { control: false }, suffix: { control: false } } } satisfies Meta<typeof TextInput>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Matrix: Story = { render: () => <div className="stack">{(['sm', 'md', 'lg'] as TextInputSize[]).map((size) => <section key={size} className="stack">
  <h3>{size === 'sm' ? 'Small · 28px' : size === 'md' ? 'Medium · 34px' : 'Large · 40px'}</h3>
  <div className="story-grid">
    <TextInput label="Hostname" size={size} defaultValue="WS-ATH-114" />
    <TextInput label="Filter expression" size={size} placeholder="source:EDR severity:critical" />
    <TextInput label="Analyst" size={size} defaultValue="k.nakamura" prefix={<User size={16} aria-hidden="true" />} clearable />
    <Field label="Source address" error="Enter an IPv4 or IPv6 address."><TextInput size={size} defaultValue="185.220.101" prefix={<Globe size={16} aria-hidden="true" />} /></Field>
    <TextInput label="Managed rule" size={size} defaultValue="DET-2026-0042" disabled />
    <TextInput label="Event identifier" size={size} defaultValue="EVT-2026-084721" readOnly suffix={<ShieldCheck size={16} aria-label="Verified event" />} />
  </div>
</section>)}</div> };

export const PrefixAndSuffix: Story = { render: () => <div className="story-grid">
  <TextInput label="Ingestion endpoint" prefix="https://" defaultValue="ingest.aegis.internal" suffix="/v1/events" />
  <TextInput label="API token" type="password" prefix={<KeyRound size={16} aria-hidden="true" />} defaultValue="aegis_local_demo_token" autoComplete="off" />
  <TextInput label="Retention period" type="number" defaultValue="90" min={1} max={365} suffix="days" />
</div> };

export const Clearable: Story = {
  render: function ClearableExample() {
    const [value, setValue] = useState('WS-ATH-114');
    return <div className="stack"><TextInput label="Hostname" value={value} onChange={(event) => setValue(event.currentTarget.value)} clearable />
      <output aria-live="polite">{value ? `Filtering host: ${value}` : 'All hosts included'}</output></div>;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Clear input' }));
    await expect(canvas.getByRole('textbox', { name: 'Hostname' })).toHaveValue('');
    await expect(canvas.getByRole('textbox', { name: 'Hostname' })).toHaveFocus();
    await expect(canvas.getByText('All hosts included')).toBeInTheDocument();
  },
};
