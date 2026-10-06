import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Fingerprint, Globe, Monitor, Shield } from 'lucide-react';
import { MultiCombobox, type MultiComboboxOption } from './multi-combobox';
import { Field } from '@/components/field';

const sources: MultiComboboxOption[] = [
  { value: 'defender', label: 'Microsoft Defender', description: 'EDR telemetry from Windows endpoints.', icon: <Monitor size={16} />, group: 'Endpoint', keywords: ['EDR', 'Windows'] },
  { value: 'falcon', label: 'CrowdStrike Falcon', description: 'EDR telemetry from Linux and macOS.', icon: <Shield size={16} />, group: 'Endpoint', keywords: ['EDR', 'Linux', 'macOS'] },
  { value: 'entra', label: 'Microsoft Entra ID', description: 'Sign-in and directory audit logs.', icon: <Fingerprint size={16} />, group: 'Identity' },
  { value: 'okta', label: 'Okta workforce', description: 'SSO and multifactor authentication events.', icon: <Fingerprint size={16} />, group: 'Identity' },
  { value: 'dns', label: 'Corporate DNS', description: 'Recursive resolver query logs.', icon: <Globe size={16} />, group: 'Network' },
  { value: 'retired', label: 'Retired firewall', description: 'Connector disabled after migration.', disabled: true, group: 'Network' },
];
const meta = { title: 'Components/Forms/MultiCombobox', component: MultiCombobox, tags: ['autodocs'], args: { label: 'Included sources', options: sources }, parameters: { docs: { description: { component: 'A multi-select popover with cmdk list/group primitives. Checked state and active keyboard focus remain independent. Type to filter, use Arrow/Home/End to navigate, Enter to toggle, Escape to close and Backspace on an empty search to remove the last selection. Select all applies to enabled filtered options. Set filterOptions=false for externally searched results.' } } } } satisfies Meta<typeof MultiCombobox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Matrix: Story = { render: () => <div className="story-grid">
  <MultiCombobox label="Included sources" options={sources} />
  <MultiCombobox label="Endpoint sources" options={sources} defaultValue={['defender', 'falcon']} />
  <MultiCombobox label="All active sources" options={sources} defaultValue={['defender', 'falcon', 'entra', 'okta', 'dns']} maxVisible={2} />
  <MultiCombobox label="Managed scope" options={sources} defaultValue={['entra', 'okta']} disabled />
  <Field label="Investigation scope" required error="Choose at least one source to investigate."><MultiCombobox options={sources} /></Field>
</div> };
export const OpenGrouped: Story = { args: { defaultOpen: true, defaultValue: ['defender', 'entra'] } };
export const Loading: Story = { args: { defaultOpen: true, loading: true, options: [] } };
export const EmptyResults: Story = { args: { defaultOpen: true, options: [], emptyLabel: 'No sources match this investigation scope' } };
export const AsyncResults: Story = {
  render: function AsyncSources() {
    const [search, setSearch] = useState('');
    // The caller owns search state and may replace these results after an API request.
    const results = sources.filter((source) => source.label.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
    return <MultiCombobox label="Connected sources" options={results} search={search} onSearchChange={setSearch} filterOptions={false} defaultOpen />;
  },
};
export const KeyboardSelection: Story = {
  render: function ControlledSelection() {
    const [value, setValue] = useState<string[]>([]);
    return <div className="stack"><MultiCombobox label="Included sources" options={sources} value={value} onValueChange={setValue} />
      <output aria-live="polite">{value.length} connected sources included</output></div>;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('combobox', { name: 'Included sources' }));
    const input = body.getByRole('combobox', { name: 'Search sources' });
    await userEvent.type(input, 'EDR');
    await userEvent.keyboard('{Home}{Enter}');
    await expect(body.getByRole('option', { name: /Microsoft Defender/ })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(canvas.getByText('2 connected sources included')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await expect(canvas.getByRole('combobox', { name: 'Included sources' })).toHaveFocus();
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Microsoft Defender' }));
    await expect(canvas.getByText('1 connected sources included')).toBeInTheDocument();
  },
};
