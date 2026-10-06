import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Fingerprint, Folder, Globe, Monitor, Server } from '@/components/icon';
import { TreeView, type TreeViewItem } from './tree-view';

const sources: TreeViewItem[] = [
  {
    id: 'endpoint',
    label: 'Endpoint telemetry',
    icon: <Monitor size={16} />,
    count: 1248,
    children: [
      {
        id: 'windows',
        label: 'Windows workstations',
        icon: <Folder size={16} />,
        count: 862,
        children: [
          { id: 'ath', label: 'WS-ATH-114', icon: <Monitor size={16} />, count: 428 },
          { id: 'lon', label: 'WS-LON-082', icon: <Monitor size={16} />, count: 434 },
        ],
      },
      {
        id: 'linux',
        label: 'Linux servers',
        icon: <Folder size={16} />,
        count: 386,
        children: [
          { id: 'prod', label: 'SRV-PROD-09', icon: <Server size={16} />, count: 386 },
          {
            id: 'offline',
            label: 'SRV-DR-02',
            description: 'Agent disconnected',
            disabled: true,
            icon: <Server size={16} />,
            count: 0,
          },
        ],
      },
    ],
  },
  {
    id: 'identity',
    label: 'Identity telemetry',
    icon: <Fingerprint size={16} />,
    count: 672,
    children: [
      { id: 'entra', label: 'Microsoft Entra ID', count: 512 },
      { id: 'okta', label: 'Okta workforce', count: 160 },
    ],
  },
  {
    id: 'network',
    label: 'Network telemetry',
    icon: <Globe size={16} />,
    count: 2840,
    children: [
      { id: 'dns', label: 'Corporate DNS', count: 2201 },
      { id: 'firewall', label: 'Perimeter firewall', count: 639 },
    ],
  },
];
const meta = {
  title: 'Components/Forms/TreeView',
  component: TreeView,
  tags: ['autodocs'],
  args: { label: 'Event sources', items: sources },
  parameters: {
    docs: {
      description: {
        component:
          'Stores selected leaf IDs and derives parent checked/mixed state. Selecting a branch affects enabled descendants only. Arrow keys navigate and expand/collapse; Home/End jump; Space/Enter toggle; typing searches visible labels; * expands siblings; Control/Command+A selects all enabled leaves. Selection and expansion each support controlled and uncontrolled state.',
      },
    },
  },
} satisfies Meta<typeof TreeView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Matrix: Story = {
  render: () => (
    <div className="story-grid">
      <TreeView label="Collapsed sources" items={sources} />
      <TreeView
        label="Partially selected sources"
        items={sources}
        defaultExpandedIds={['endpoint', 'windows']}
        defaultSelectedIds={['ath']}
      />
      <TreeView
        label="Selected endpoint branch"
        items={sources}
        defaultExpandedIds={['endpoint', 'linux']}
        defaultSelectedIds={['ath', 'lon', 'prod']}
      />
      <TreeView
        label="Locked investigation scope"
        items={sources}
        disabled
        defaultExpandedIds={['identity']}
        defaultSelectedIds={['entra']}
      />
    </div>
  ),
};
export const FullyExpanded: Story = {
  args: {
    defaultExpandedIds: ['endpoint', 'windows', 'linux', 'identity', 'network'],
    defaultSelectedIds: ['ath', 'entra'],
  },
};
export const Empty: Story = {
  args: { items: [], emptyLabel: 'No connected sources match the current filters' },
};
export const KeyboardAndTriState: Story = {
  render: function ControlledTree() {
    const [selected, setSelected] = useState<string[]>(['ath']);
    const [expanded, setExpanded] = useState<string[]>(['endpoint', 'windows']);
    return (
      <div className="stack">
        <TreeView
          label="Event sources"
          items={sources}
          selectedIds={selected}
          onSelectedChange={setSelected}
          expandedIds={expanded}
          onExpandedChange={setExpanded}
        />
        <output aria-live="polite">{selected.length} sources selected</output>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const endpoint = canvas.getByRole('treeitem', { name: 'Endpoint telemetry' });
    await expect(endpoint).toHaveAttribute('aria-checked', 'mixed');
    endpoint.focus();
    await userEvent.keyboard(' ');
    await expect(endpoint).toHaveAttribute('aria-checked', 'true');
    await expect(canvas.getByText('3 sources selected')).toBeInTheDocument();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('treeitem', { name: 'Windows workstations' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(canvas.getByRole('treeitem', { name: 'Windows workstations' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await userEvent.keyboard('{ArrowLeft}');
    await expect(endpoint).toHaveFocus();
  },
};
