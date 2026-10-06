import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { SearchInput } from './search-input';

const meta = { title: 'Components/Forms/SearchInput', component: SearchInput, tags: ['autodocs'], args: { label: 'Search alerts', placeholder: 'Search title, hostname or MITRE technique', shortcut: '⌘ K' }, parameters: { docs: { description: { component: 'Immediate input feedback with a cancelable debounced onSearch callback. The shortcut is a hint; the owning page handles the shortcut action. Native onChange and onValueChange remain immediate.' } } } } satisfies Meta<typeof SearchInput>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Matrix: Story = { render: () => <div className="story-grid">
  <SearchInput label="Search events" size="sm" defaultValue="T1059.001" shortcut="/" />
  <SearchInput label="Search alerts" size="md" defaultValue="PowerShell" shortcut="⌘ K" />
  <SearchInput label="Search investigations" size="lg" placeholder="Search incident name or analyst" />
  <SearchInput label="Search archived events" defaultValue="source:EDR" disabled />
  <SearchInput label="Saved query" defaultValue="severity:critical status:new" readOnly />
  <SearchInput label="Invalid query" defaultValue="severity:" invalid aria-describedby="search-syntax-error" />
  <p id="search-syntax-error" className="muted">Add a severity value, such as severity:critical.</p>
</div> };

const alerts = ['Encoded PowerShell command on WS-ATH-114', 'Impossible travel for k.nakamura', 'Brute force against OWA from 185.220.101.44'];
export const DebouncedSearch: Story = {
  render: function SearchExample() {
    const [query, setQuery] = useState('');
    const matches = alerts.filter((alert) => alert.toLowerCase().includes(query.toLowerCase()));
    return <div className="stack"><SearchInput label="Search detections" debounceMs={200} onSearch={setQuery} />
      <div role="status">{matches.length} matching detections</div>
      <ul>{matches.map((alert) => <li key={alert}>{alert}</li>)}</ul></div>;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search detections' }), 'PowerShell');
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('1 matching detections'));
    await userEvent.click(canvas.getByRole('button', { name: 'Clear search' }));
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('3 matching detections'));
  },
};
