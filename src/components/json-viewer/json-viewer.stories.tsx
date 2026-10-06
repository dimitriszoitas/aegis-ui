import type { Meta, StoryObj } from '@storybook/react-vite';
import { alerts } from '../../sample-data';
import { JsonViewer } from './json-viewer';

const eventPayload = {
  '@timestamp': '2026-10-06T08:24:16.481Z',
  event: { id: 'EVT-1049-3', category: 'process', action: 'process-started', outcome: 'success' },
  host: { name: 'WS-ATH-114', ip: ['10.24.19.114', 'fe80::a83d:9b2c:7f10:114'], isolation: false },
  user: { name: 'k.nakamura', domain: 'NORTHSTAR', elevated: false },
  process: {
    name: 'powershell.exe',
    pid: 4820,
    parent: { name: 'explorer.exe', pid: 3104 },
    command_line:
      'powershell.exe -NoProfile -EncodedCommand SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkA',
    signature: null,
  },
  detection: {
    technique: 'T1059.001',
    confidence: 0.94,
    matched: true,
    tags: ['execution', 'encoded-command'],
  },
};
const meta = {
  title: 'Components/Data/JsonViewer',
  component: JsonViewer,
  tags: ['autodocs'],
  args: { value: eventPayload, label: 'Endpoint event payload', defaultExpandedDepth: 2 },
} satisfies Meta<typeof JsonViewer>;
export default meta;
type Story = StoryObj<typeof meta>;
export const NestedEvent: Story = {};
export const ArraysAndNulls: Story = {
  args: {
    rootName: 'correlation',
    value: {
      matched_events: [
        alerts[0].events[0].payload,
        null,
        { confirmed: false, confidence: 0, source: 'Identity', evidence: [] },
      ],
      external_context: null,
      tags: [],
      annotations: {},
    },
    defaultExpandedDepth: 3,
  },
};
export const PrimitiveValues: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <JsonViewer label="Rule enabled" rootName="enabled" value={true} />
      <JsonViewer label="Unassigned owner" rootName="assignee" value={null} />
      <JsonViewer label="Source address" rootName="source_ip" value="185.220.101.46" />
      <JsonViewer label="Correlated event count" rootName="event_count" value={1284} />
    </div>
  ),
};
export const LargePayload: Story = {
  args: {
    label: 'Correlated event batch',
    rootName: 'events',
    value: alerts.flatMap((alert) =>
      alert.events.map((event) => ({ id: event.id, alert_id: alert.id, ...event.payload })),
    ),
    maxVisibleItems: 25,
    maxHeight: 420,
    defaultExpandedDepth: 1,
  },
};
export const ComplexPaths: Story = {
  args: {
    label: 'Normalized cloud event',
    value: {
      'cloud.account.id': '984271605138',
      'request headers': {
        'x-forwarded-for': '185.220.101.46',
        'x-correlation-id': 'corr-72c9d10f',
      },
      'object[0]': { 'policy"name': 'Restricted service-account access', observed: true },
    },
    defaultExpandedDepth: 3,
  },
};
export const Collapsed: Story = { args: { defaultExpandedDepth: 0 } };
