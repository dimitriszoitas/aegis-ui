import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '../button';
import { BulkActionsBar } from '../bulk-actions-bar';
import { EntityCell, NumberCell, SeverityCell, TimeCell } from '../data-grid-cells';
import { SideSheet, SideSheetField, SideSheetSection } from '../side-sheet';
import { alerts, analysts, generateAlerts, referenceTime, type Alert } from '../../sample-data';
import { DataGrid, type GridDensity } from './data-grid';

const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
const columns: ColumnDef<Alert>[] = [
  {
    accessorKey: 'severity',
    header: 'Severity',
    size: 120,
    minSize: 104,
    maxSize: 180,
    sortingFn: (a, b) => severityOrder[a.original.severity] - severityOrder[b.original.severity],
    cell: ({ row }) => <SeverityCell severity={row.original.severity} />,
  },
  {
    accessorKey: 'title',
    header: 'Alert title',
    size: 410,
    minSize: 220,
    maxSize: 650,
    enableHiding: false,
    cell: ({ row }) => <span title={row.original.title}>{row.original.title}</span>,
  },
  {
    id: 'entity',
    accessorFn: (row) => row.entity.name,
    header: 'Entity',
    size: 220,
    minSize: 160,
    maxSize: 320,
    cell: ({ row }) => <EntityCell entity={row.original.entity} />,
  },
  {
    accessorKey: 'eventCount',
    header: 'Events',
    size: 96,
    minSize: 80,
    maxSize: 180,
    meta: { align: 'right' },
    cell: ({ row }) => <NumberCell value={row.original.eventCount} />,
  },
  {
    accessorKey: 'lastSeen',
    header: 'Last seen',
    size: 150,
    minSize: 120,
    maxSize: 260,
    cell: ({ row }) => <TimeCell value={row.original.lastSeen} now={referenceTime} />,
  },
];
const getRowId = (row: Alert) => row.id;
const rowLabel = (row: Alert) => `${row.id}: ${row.title}`;
function ExpandedEvents({ alert }: { alert: Alert }) {
  return (
    <section aria-label={`Correlated events for ${alert.id}`}>
      <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
        {alert.events.length} correlated events
      </h3>
      <table className="aegis-grid-event-table" aria-label={`Event evidence for ${alert.id}`}>
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Action</th>
            <th scope="col">Source IP</th>
            <th scope="col">Host</th>
          </tr>
        </thead>
        <tbody>
          {alert.events.map((event) => (
            <tr key={event.id}>
              <td>
                <code>{event.timestamp.slice(11, 19)}</code>
              </td>
              <td>{event.action}</td>
              <td>
                <code>{event.sourceIp}</code>
              </td>
              <td>
                <code>{event.host}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
const renderExpandedRow = (row: Alert) => <ExpandedEvents alert={row} />;
const meta = {
  title: 'Components/Data/DataGrid',
  component: DataGrid<Alert>,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { data: alerts, columns, getRowId, rowLabel, label: 'Security alerts', renderExpandedRow },
} satisfies Meta<typeof DataGrid<Alert>>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const DensityMatrix: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      {(['compact', 'default', 'comfortable'] as GridDensity[]).map((density) => (
        <DataGrid
          {...args}
          key={density}
          data={alerts.slice(0, 3)}
          density={density}
          pagination={false}
          renderToolbar={() => (
            <strong style={{ textTransform: 'capitalize', fontSize: 'var(--text-sm)' }}>
              {density} density
            </strong>
          )}
        />
      ))}
    </div>
  ),
};
export const MultiSort: Story = {
  args: {
    initialSorting: [
      { id: 'severity', desc: false },
      { id: 'eventCount', desc: true },
    ],
  },
};
export const ExpandedEvidence: Story = {
  args: { defaultExpandedRowIds: [alerts[0].id], data: alerts.slice(0, 8), pagination: false },
};
export const HiddenColumns: Story = {
  args: { initialColumnVisibility: { entity: false, lastSeen: false } },
};
export const Loading: Story = { args: { loading: true } };
export const Empty: Story = { args: { data: [] } };
function RetryExample() {
  const [failed, setFailed] = useState(true);
  return (
    <DataGrid
      {...meta.args}
      error={
        failed
          ? 'The event service could not be reached. Your investigation has been preserved.'
          : undefined
      }
      onRetry={() => setFailed(false)}
    />
  );
}
export const ErrorAndRetry: Story = { render: () => <RetryExample /> };
function ControlledSelection() {
  const [selected, setSelected] = useState([alerts[0].id, alerts[1].id, alerts[2].id]);
  const [message, setMessage] = useState('3 alerts are selected for triage.');
  return (
    <>
      <DataGrid
        {...meta.args}
        selectedRowIds={selected}
        onSelectedRowsChange={setSelected}
        renderBulkActions={(rows, clear) => (
          <BulkActionsBar
            selectedCount={rows.length}
            analysts={analysts}
            onAssign={(analystId) =>
              setMessage(
                `${rows.length} alerts assigned to ${analysts.find((analyst) => analyst.id === analystId)?.name ?? 'no analyst'}.`,
              )
            }
            onStatusChange={(status) =>
              setMessage(`${rows.length} alerts changed to ${status.replaceAll('-', ' ')}.`)
            }
            onSummarize={() =>
              setMessage(`AI summary requested for ${rows.length} selected alerts.`)
            }
            onClear={clear}
            position="inline"
          />
        )}
      />
      <p
        role="status"
        style={{
          marginTop: 'var(--space-3)',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-sm)',
        }}
      >
        {message}
      </p>
    </>
  );
}
export const SelectionAndBulkActions: Story = { render: () => <ControlledSelection /> };
function InvestigationExample() {
  const [alert, setAlert] = useState<Alert>();
  return (
    <>
      <DataGrid {...meta.args} onRowClick={setAlert} />
      <SideSheet
        title={alert?.title ?? 'Alert details'}
        description={alert?.id}
        open={!!alert}
        onOpenChange={(open) => {
          if (!open) setAlert(undefined);
        }}
        footer={
          <Button intent="function" onClick={() => setAlert(undefined)}>
            Return to alerts
          </Button>
        }
      >
        <SideSheetSection title="Investigation details">
          <SideSheetField label="Entity">{alert?.entity.name}</SideSheetField>
          <SideSheetField label="Technique">
            {alert?.mitre.id} · {alert?.mitre.name}
          </SideSheetField>
          <SideSheetField label="Event count">{alert?.eventCount}</SideSheetField>
        </SideSheetSection>
      </SideSheet>
    </>
  );
}
export const KeyboardInvestigation: Story = { render: () => <InvestigationExample /> };
const thousandAlerts = generateAlerts(1000, 2026);
export const VirtualizedThousandRows: Story = {
  args: {
    data: thousandAlerts,
    pagination: false,
    virtualize: true,
    height: 560,
    defaultExpandedRowIds: [thousandAlerts[0].id],
  },
};
export const KeyboardResizing: Story = {
  args: { data: alerts.slice(0, 10), pagination: false },
  parameters: {
    docs: {
      description: {
        story:
          'Focus a column resize handle and press Left or Right to adjust by 8px, Shift+Arrow for 24px, Home/End for min/max, or Enter to autosize. Pointer drag and double-click autosize use the same constraints.',
      },
    },
  },
};
