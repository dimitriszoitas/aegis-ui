import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BulkActionsBar } from './bulk-actions-bar';
import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { Checkbox } from '@/components/checkbox';
import { SeverityBadge, type Severity } from '@/components/severity-badge';
import { StatusBadge, type AlertStatus } from '@/components/status-badge';

const meta = {
  title: 'Components/Data grid/Bulk actions bar',
  component: BulkActionsBar,
  tags: ['autodocs'],
} satisfies Meta<typeof BulkActionsBar>;
export default meta;
const analysts = [
  { id: 'eleni', name: 'Eleni Papadopoulos', initials: 'EP' },
  { id: 'marcus', name: 'Marcus Chen', initials: 'MC' },
  { id: 'aisha', name: 'Aisha Okafor', initials: 'AO' },
];
interface DemoAlert {
  id: string;
  title: string;
  severity: Severity;
  status: AlertStatus;
  assignee: string | null;
  count: number;
}
const initialAlerts: DemoAlert[] = [
  {
    id: 'ALT-2026-0842',
    title: 'Encoded PowerShell on WS-ATH-114',
    severity: 'critical',
    status: 'new',
    assignee: null,
    count: 18,
  },
  {
    id: 'ALT-2026-0841',
    title: 'Impossible travel for k.nakamura',
    severity: 'high',
    status: 'new',
    assignee: null,
    count: 6,
  },
  {
    id: 'ALT-2026-0839',
    title: 'Repeated OWA authentication failures',
    severity: 'medium',
    status: 'triaged',
    assignee: 'marcus',
    count: 1284,
  },
];
function BulkSelectionDemo({
  position = 'inline',
  failAssignment = false,
}: {
  position?: 'fixed' | 'inline';
  failAssignment?: boolean;
}) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [selected, setSelected] = useState(initialAlerts.map((alert) => alert.id));
  const [notice, setNotice] = useState('');
  const [summary, setSummary] = useState('');
  const selectedRows = alerts.filter((alert) => selected.includes(alert.id));
  async function pause() {
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  return (
    <div className="stack" style={{ maxWidth: 1000, padding: 'var(--space-6)', minHeight: 460 }}>
      <div className="between">
        <div>
          <h3 style={{ marginBottom: 'var(--space-1)' }}>Selected alert queue</h3>
          <p className="muted" style={{ margin: 0 }}>
            Assign owners, update status, or request an AI triage summary.
          </p>
        </div>
        <Button
          size="sm"
          emphasis="ghost"
          onClick={() => setSelected(alerts.map((alert) => alert.id))}
        >
          Select all alerts
        </Button>
      </div>
      <div className="surface stack">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="between"
            style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}
          >
            <Checkbox
              checked={selected.includes(alert.id)}
              onCheckedChange={(checked) =>
                setSelected((current) =>
                  checked === true
                    ? [...current, alert.id]
                    : current.filter((id) => id !== alert.id),
                )
              }
              label={alert.title}
              description={
                analysts.find((analyst) => analyst.id === alert.assignee)?.name ?? 'Unassigned'
              }
            />
            <div className="row">
              <SeverityBadge severity={alert.severity} />
              <StatusBadge status={alert.status} />
            </div>
          </div>
        ))}
      </div>
      {notice && (
        <p className="muted" role="status" style={{ margin: 0 }}>
          {notice}
        </p>
      )}
      {summary && (
        <Banner intent="ai" title="AI generated triage summary">
          {summary} Review the evidence before applying a verdict.
        </Banner>
      )}
      <div style={{ marginTop: 'auto' }}>
        <BulkActionsBar
          position={position}
          selectedCount={selected.length}
          analysts={analysts}
          onAssign={async (analystId) => {
            await pause();
            if (failAssignment)
              throw new Error(
                'The analyst assignment service is temporarily unavailable. Try again in a moment.',
              );
            setAlerts((current) =>
              current.map((alert) =>
                selected.includes(alert.id) ? { ...alert, assignee: analystId } : alert,
              ),
            );
            setNotice(
              `${selected.length} alerts ${analystId ? `assigned to ${analysts.find((analyst) => analyst.id === analystId)?.name}` : 'returned to the unassigned queue'}.`,
            );
          }}
          onStatusChange={async (status) => {
            await pause();
            setAlerts((current) =>
              current.map((alert) => (selected.includes(alert.id) ? { ...alert, status } : alert)),
            );
            setNotice(`${selected.length} alert statuses updated.`);
          }}
          onSummarize={async () => {
            await pause();
            setSummary(
              `${selectedRows.length} selected alerts contain ${selectedRows.reduce((total, alert) => total + alert.count, 0).toLocaleString()} correlated events. ${selectedRows.filter((alert) => alert.severity === 'critical').length} critical alerts require immediate analyst review. Evidence includes ${selectedRows.map((alert) => alert.title.toLowerCase()).join('; ')}.`,
            );
          }}
          onClear={() => {
            setSelected([]);
            setNotice('Alert selection cleared.');
          }}
        />
      </div>
    </div>
  );
}
export const InteractiveSelection: StoryObj = { render: () => <BulkSelectionDemo /> };
export const FloatingAtBottom: StoryObj = {
  render: () => <BulkSelectionDemo position="fixed" />,
  parameters: { layout: 'fullscreen' },
};
export const FailedAssignment: StoryObj = { render: () => <BulkSelectionDemo failAssignment /> };
