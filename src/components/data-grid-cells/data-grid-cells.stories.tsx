import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckCheck, ExternalLink, Sparkles, UserRoundCheck } from '@/components/icon';
import {
  ActionsCell,
  AiVerdictCell,
  EntityCell,
  ExpandCell,
  NumberCell,
  SeverityCell,
  SparklineCell,
  StatusCell,
  TagsCell,
  TimeCell,
} from './data-grid-cells';

const meta = {
  title: 'Components/Data grid/Cells',
  component: EntityCell,
  tags: ['autodocs'],
  args: { entity: { type: 'host', name: 'WS-ATH-114', detail: 'Windows 11 · Finance' } },
} satisfies Meta<typeof EntityCell>;
export default meta;
type Story = StoryObj<typeof meta>;
const now = Date.parse('2026-10-06T12:00:00.000Z');
const rows = [
  {
    id: 'ALT-2026-0842',
    severity: 'critical' as const,
    title: 'Encoded PowerShell execution',
    entity: { type: 'host' as const, name: 'WS-ATH-114', detail: 'Windows 11 · Finance' },
    status: 'new' as const,
    time: '2026-10-06T11:57:00Z',
    count: 18,
    tags: ['execution', 'powershell', 'office-child'],
    values: [2, 1, 3, 2, 0, 1, 2, 1, 4, 8, 14, 18],
    verdict: 'Investigate',
    confidence: 0.96,
  },
  {
    id: 'ALT-2026-0841',
    severity: 'high' as const,
    title: 'Impossible travel',
    entity: { type: 'user' as const, name: 'k.nakamura', detail: 'Identity · Tokyo → Amsterdam' },
    status: 'triaged' as const,
    time: '2026-10-06T11:45:00Z',
    count: 6,
    tags: ['identity', 'travel'],
    values: [0, 1, 0, 2, 0, 1, 4, 2, 0, 1, 2, 6],
    verdict: 'Needs context',
    confidence: 0.67,
  },
  {
    id: 'ALT-2026-0839',
    severity: 'medium' as const,
    title: 'Repeated OWA authentication failures',
    entity: { type: 'ip' as const, name: '185.220.101.42', detail: 'External · Tor exit node' },
    status: 'in-progress' as const,
    time: '2026-10-06T10:18:00Z',
    count: 1284,
    tags: ['credential-access', 'brute-force', 'external', 'owa'],
    values: [8, 20, 44, 82, 66, 46, 38, 30, 20, 14, 8, 2],
    verdict: 'Likely malicious',
    confidence: 0.89,
  },
];
function CellTable() {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [activity, setActivity] = useState(
    'Hover a row to reveal actions, or use Tab to reach each action.',
  );
  return (
    <div className="stack">
      <div
        className="surface"
        style={{ overflowX: 'auto', padding: 0 }}
        role="region"
        aria-label="Alert cell examples"
        tabIndex={0}
      >
        <table
          style={{
            width: '100%',
            minWidth: 1120,
            borderCollapse: 'collapse',
            fontSize: 'var(--text-sm)',
          }}
        >
          <caption className="sr-only">Reusable cells in the analyst alert queue</caption>
          <thead>
            <tr>
              {[
                'Events',
                'Severity',
                'Entity',
                'Last seen',
                'Tags',
                'Activity',
                'Status',
                'Count',
                'AI suggestion',
                'Actions',
              ].map((label) => (
                <th
                  scope="col"
                  key={label}
                  style={{
                    textAlign: label === 'Count' ? 'right' : 'left',
                    padding: 'var(--space-3)',
                    fontWeight: 500,
                    color: 'var(--color-text-secondary)',
                    borderBottom: '1px solid var(--color-border-subtle)',
                  }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => setActivity(`Opened ${row.id}: ${row.title}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') setActivity(`Opened ${row.id}: ${row.title}`);
                }}
                tabIndex={0}
                aria-label={row.title}
              >
                {[
                  <ExpandCell
                    expanded={expanded.includes(row.id)}
                    onExpandedChange={(value) =>
                      setExpanded((current) =>
                        value ? [...current, row.id] : current.filter((id) => id !== row.id),
                      )
                    }
                    count={3}
                  />,
                  <SeverityCell severity={row.severity} />,
                  <EntityCell entity={row.entity} />,
                  <TimeCell value={row.time} now={now} />,
                  <TagsCell tags={row.tags} maxVisible={1} />,
                  <SparklineCell data={row.values} variant="area" />,
                  <StatusCell status={row.status} />,
                  <NumberCell value={row.count} />,
                  <AiVerdictCell verdict={row.verdict} confidence={row.confidence} />,
                  <ActionsCell
                    actions={[
                      {
                        id: 'open',
                        label: `Open ${row.id}`,
                        icon: <ExternalLink size={15} />,
                        onClick: () => setActivity(`Opened ${row.id}: ${row.title}`),
                      },
                      {
                        id: 'explain',
                        label: `Explain ${row.id} with AI`,
                        icon: <Sparkles size={15} />,
                        intent: 'ai',
                        onClick: () => setActivity(`AI investigation requested for ${row.id}`),
                      },
                      {
                        id: 'assign',
                        label: 'Assign to me',
                        icon: <UserRoundCheck size={15} />,
                        onClick: () => setActivity(`${row.id} assigned to Eleni Papadopoulos`),
                      },
                      {
                        id: 'resolve',
                        label: 'Mark resolved',
                        icon: <CheckCheck size={15} />,
                        onClick: () => setActivity(`${row.id} marked resolved`),
                      },
                    ]}
                  />,
                ].map((cell, index) => (
                  <td
                    key={index}
                    style={{
                      padding: 'var(--space-3)',
                      borderBottom: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" aria-live="polite" style={{ margin: 0 }}>
        {activity}
      </p>
      {expanded.length > 0 && (
        <div className="surface">
          <strong>Expanded event groups</strong>
          <p className="muted" style={{ margin: 'var(--space-2) 0 0' }}>
            {expanded.join(', ')} · Process creation, identity correlation and network evidence are
            available.
          </p>
        </div>
      )}
    </div>
  );
}
export const AlertQueueComposition: Story = { render: () => <CellTable /> };
export const Entities: Story = {
  render: () => (
    <div className="stack" style={{ maxWidth: 320 }}>
      {rows.map((row) => (
        <div className="surface" key={row.id}>
          <EntityCell entity={row.entity} />
        </div>
      ))}
    </div>
  ),
};
