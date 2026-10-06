import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Fingerprint, Globe, Monitor, RadioTower } from 'lucide-react';
import { Select, type SelectOption } from './select';
import { Field } from '@/components/field';

const sources: SelectOption[] = [
  { value: 'edr', label: 'Endpoint detection', description: 'Process, file and network activity from managed hosts.', icon: <Monitor size={16} />, group: 'Security telemetry' },
  { value: 'identity', label: 'Identity provider', description: 'Sign-ins and directory audit events.', icon: <Fingerprint size={16} />, group: 'Security telemetry' },
  { value: 'dns', label: 'DNS resolver', description: 'Queries from corporate recursive resolvers.', icon: <Globe size={16} />, group: 'Network telemetry' },
  { value: 'firewall', label: 'Perimeter firewall', description: 'Flow and policy decision events.', icon: <RadioTower size={16} />, group: 'Network telemetry' },
  { value: 'archive', label: 'Archived telemetry', description: 'Restoration is required before querying.', disabled: true, group: 'Network telemetry' },
];
const meta = { title: 'Components/Forms/Select', component: Select, tags: ['autodocs'], args: { label: 'Event source', options: sources, placeholder: 'Choose an event source' }, parameters: { docs: { description: { component: 'A single-selection Radix listbox with labeled groups, descriptive options, icons, typeahead, Arrow/Home/End navigation, Escape dismissal and native form participation. Values must be nonempty strings.' } } } } satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Matrix: Story = { render: () => <div className="story-grid">
  <Select label="Small source picker" options={sources} size="sm" defaultValue="edr" />
  <Select label="Default source picker" options={sources} defaultValue="identity" />
  <Select label="Large source picker" options={sources} size="lg" defaultValue="dns" />
  <Select label="Unselected source" options={sources} placeholder="Choose a source" />
  <Select label="Managed source" options={sources} defaultValue="edr" disabled />
  <Field label="Required source" required error="Choose the telemetry source for this detection."><Select options={sources} placeholder="Choose a source" /></Field>
</div> };
export const OpenMenu: Story = { args: { defaultOpen: true, defaultValue: 'edr' } };
export const NoSources: Story = { args: { options: [], defaultOpen: true } };
export const KeyboardSelection: Story = {
  render: function ControlledSource() {
    const [source, setSource] = useState('edr');
    return <div className="stack"><Select label="Event source" options={sources} value={source} onValueChange={setSource} />
      <output aria-live="polite">Selected source: {source}</output></div>;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox', { name: 'Event source' }));
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(canvas.getByText('Selected source: identity')).toBeInTheDocument();
    await expect(canvas.getByRole('combobox', { name: 'Event source' })).toHaveFocus();
  },
};
