import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCheck, Eye, Sparkles } from 'lucide-react';
import { DataGrid, type GridDensity } from '@/components/data-grid';
import {
  ActionsCell,
  AiVerdictCell,
  EntityCell,
  NumberCell,
  SeverityCell,
  SparklineCell,
  StatusCell,
  TagsCell,
  TimeCell,
} from '@/components/data-grid-cells';
import { BulkActionsBar } from '@/components/bulk-actions-bar';
import { Avatar } from '@/components/avatar';
import { JsonViewer } from '@/components/json-viewer';
import { Tooltip } from '@/components/tooltip';
import { FilterBar } from '@/patterns/filter-bar';
import { FilterPanel } from '@/patterns/filter-panel';
import { applyAlertFilters, createDefaultFilters, type AlertFilterState } from '@/lib/filters';
import type { Alert, Analyst } from '@/sample-data';
import './alerts-explorer.css';

export interface AlertsExplorerProps {
  alerts: Alert[];
  analysts: Analyst[];
  onAlertsChange: (alerts: Alert[]) => void;
  filters?: AlertFilterState;
  onFiltersChange?: (filters: AlertFilterState) => void;
  now?: Date | number;
  onOpenAlert?: (alert: Alert, visibleAlerts: Alert[]) => void;
  onAskAi: (alerts: Alert[]) => void;
  onSelectionChange?: (alerts: Alert[]) => void;
  defaultPanelOpen?: boolean;
  loading?: boolean;
  error?: ReactNode;
  onRetry?: () => void;
  height?: number | string;
  /** Disable pagination for a continuous investigation queue. */
  pagination?: boolean;
  /** Override automatic virtualization for large result sets. */
  virtualize?: boolean;
  density?: GridDensity;
  onDensityChange?: (density: GridDensity) => void;
  renderEventDetail?: (alert: Alert) => ReactNode;
}
export interface AlertEventsTableProps {
  alert: Alert;
  now?: Date | number;
}
export function AlertEventsTable({ alert, now }: AlertEventsTableProps) {
  return (
    <div className="aegis-alert-events">
      <h3>Evidence events · {alert.id}</h3>
      <table aria-label={`Evidence events for ${alert.id}`}>
        <thead>
          <tr>
            <th>Observed</th>
            <th>Activity</th>
            <th>Source address</th>
            <th>Host</th>
          </tr>
        </thead>
        <tbody>
          {alert.events.map((event) => (
            <tr key={event.id}>
              <td>
                <TimeCell value={event.timestamp} now={now} />
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
      <details className="aegis-alert-event-payloads">
        <summary>Inspect raw event payloads</summary>
        <JsonViewer
          value={alert.events.map((event) => ({
            id: event.id,
            timestamp: event.timestamp,
            ...event.payload,
          }))}
          label={`Raw evidence for ${alert.id}`}
          defaultExpandedDepth={1}
          maxHeight={360}
        />
      </details>
    </div>
  );
}
/** The bar and in-flow facet panel share one filter state. All bulk mutations affect selected records. */
export function AlertsExplorer({
  alerts,
  analysts,
  onAlertsChange,
  filters: controlledFilters,
  onFiltersChange,
  now,
  onOpenAlert,
  onAskAi,
  onSelectionChange,
  defaultPanelOpen = false,
  loading,
  error,
  onRetry,
  height = 540,
  pagination,
  virtualize,
  density,
  onDensityChange,
  renderEventDetail,
}: AlertsExplorerProps) {
  const panelId = useId();
  const shellRef = useRef<HTMLDivElement>(null);
  const [internalFilters, setInternalFilters] = useState(createDefaultFilters);
  const filters = controlledFilters ?? internalFilters;
  const [panelOpen, setPanelOpen] = useState(defaultPanelOpen);
  const [selection, setSelection] = useState<string[]>([]);
  const filterKey = JSON.stringify(filters);
  const previousFilterKey = useRef(filterKey);
  useEffect(() => {
    if (previousFilterKey.current === filterKey) return;
    previousFilterKey.current = filterKey;
    setSelection([]);
    onSelectionChange?.([]);
  }, [filterKey, onSelectionChange]);
  const filtered = useMemo(() => applyAlertFilters(alerts, filters, now), [alerts, filters, now]);
  const visibleSelection = selection.filter((id) => filtered.some((alert) => alert.id === id));
  function updateFilters(next: AlertFilterState) {
    if (controlledFilters === undefined) setInternalFilters(next);
    onFiltersChange?.(next);
    setSelection([]);
    onSelectionChange?.([]);
  }
  function closePanel() {
    setPanelOpen(false);
    shellRef.current
      ?.querySelector<HTMLButtonElement>('button[aria-controls="' + panelId + '"]')
      ?.focus();
  }
  function mutate(selected: Alert[], patch: Partial<Alert>) {
    const ids = new Set(selected.map((alert) => alert.id));
    onAlertsChange(alerts.map((alert) => (ids.has(alert.id) ? { ...alert, ...patch } : alert)));
  }
  const columns: ColumnDef<Alert>[] = [
    {
      accessorKey: 'severity',
      header: 'Severity',
      size: 116,
      minSize: 100,
      sortingFn: (a, b) =>
        ['critical', 'high', 'medium', 'low', 'info'].indexOf(a.original.severity) -
        ['critical', 'high', 'medium', 'low', 'info'].indexOf(b.original.severity),
      cell: ({ row }) => <SeverityCell severity={row.original.severity} />,
    },
    {
      accessorKey: 'title',
      header: 'Alert',
      size: 330,
      minSize: 220,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="aegis-alert-title">
          <Tooltip content={row.original.title}>
            <strong>{row.original.title}</strong>
          </Tooltip>
          <span>
            <code>{row.original.id}</code>
            <span aria-hidden="true"> · </span>
            {row.original.mitre.id} · {row.original.mitre.name}
          </span>
        </div>
      ),
    },
    {
      id: 'entity',
      accessorFn: (row) => row.entity.name,
      header: 'Entity',
      size: 230,
      cell: ({ row }) => <EntityCell entity={row.original.entity} />,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 142,
      cell: ({ row }) => <StatusCell status={row.original.status} />,
    },
    {
      accessorKey: 'eventCount',
      header: 'Events',
      size: 96,
      meta: { align: 'right' },
      cell: ({ row }) => <NumberCell value={row.original.eventCount} />,
    },
    {
      accessorKey: 'lastSeen',
      header: 'Last seen',
      size: 116,
      cell: ({ row }) => <TimeCell value={row.original.lastSeen} now={now} />,
    },
    {
      id: 'activity',
      header: 'Activity',
      size: 126,
      enableSorting: false,
      cell: ({ row }) => <SparklineCell data={row.original.sparkline} variant="area" />,
    },
    {
      id: 'aiVerdict',
      header: 'AI suggestion',
      size: 224,
      enableSorting: false,
      cell: ({ row }) => <AiVerdictCell {...row.original.aiVerdict} />,
    },
    { accessorKey: 'source', header: 'Source', size: 112 },
    {
      id: 'assignee',
      accessorFn: (row) => row.assignee?.name ?? 'Unassigned',
      header: 'Assignee',
      size: 180,
      cell: ({ row }) =>
        row.original.assignee ? (
          <span className="aegis-alert-assignee">
            <Avatar name={row.original.assignee.name} size="sm" />
            {row.original.assignee.name}
          </span>
        ) : (
          <span className="muted">Unassigned</span>
        ),
    },
    {
      id: 'tags',
      header: 'Tags',
      size: 230,
      enableSorting: false,
      cell: ({ row }) => <TagsCell tags={row.original.tags} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 116,
      minSize: 116,
      enableSorting: false,
      cell: ({ row }) => (
        <ActionsCell
          actions={[
            {
              id: 'explain',
              label: `Explain ${row.original.id} with AI`,
              icon: <Sparkles size={15} />,
              intent: 'ai',
              onClick: () => onAskAi([row.original]),
            },
            {
              id: 'open',
              label: `Open ${row.original.id}`,
              icon: <Eye size={15} />,
              onClick: () => onOpenAlert?.(row.original, filtered),
              disabled: !onOpenAlert,
            },
            {
              id: 'triage',
              label: 'Mark as triaged',
              icon: <CheckCheck size={15} />,
              onClick: () => mutate([row.original], { status: 'triaged' }),
            },
          ]}
        />
      ),
    },
  ];
  return (
    <div ref={shellRef} className="aegis-alerts-explorer" data-panel-open={panelOpen}>
      <div className="aegis-alerts-facets" id={panelId} inert={!panelOpen} aria-hidden={!panelOpen}>
        {panelOpen && (
          <FilterPanel
            value={filters}
            onValueChange={updateFilters}
            alerts={alerts}
            analysts={analysts}
            now={now}
            onClose={closePanel}
          />
        )}
      </div>
      <div className="aegis-alerts-results">
        <DataGrid
          data={filtered}
          columns={columns}
          getRowId={(row) => row.id}
          rowLabel={(row) => `${row.id}: ${row.title}`}
          label="Alerts"
          height={height}
          pagination={pagination}
          virtualize={virtualize}
          density={density}
          onDensityChange={onDensityChange}
          loading={loading}
          error={error}
          onRetry={onRetry}
          initialSorting={[{ id: 'lastSeen', desc: true }]}
          initialColumnVisibility={{
            source: false,
            tags: false,
            assignee: false,
            aiVerdict: false,
          }}
          selectedRowIds={visibleSelection}
          onSelectedRowsChange={(ids, rows) => {
            setSelection(ids);
            onSelectionChange?.(rows);
          }}
          onRowClick={onOpenAlert ? (row) => onOpenAlert(row, filtered) : undefined}
          renderExpandedRow={(row) =>
            renderEventDetail?.(row) ?? <AlertEventsTable alert={row} now={now} />
          }
          emptyTitle="No alerts match your filters"
          emptyDescription="Widen the time range or remove a filter to see more activity."
          renderToolbar={(api) => (
            <FilterBar
              value={filters}
              onValueChange={updateFilters}
              analysts={analysts}
              now={now}
              density={api.density}
              onDensityChange={api.setDensity}
              columns={api.columns}
              onColumnVisibilityChange={api.setColumnVisibility}
              filterPanelOpen={panelOpen}
              panelId={panelId}
              onTogglePanel={() => setPanelOpen((open) => !open)}
            />
          )}
          renderBulkActions={(selected, clear) => (
            <BulkActionsBar
              selectedCount={selected.length}
              analysts={analysts}
              onClear={() => {
                clear();
                onSelectionChange?.([]);
              }}
              onAssign={(id) =>
                mutate(selected, { assignee: analysts.find((analyst) => analyst.id === id) })
              }
              onStatusChange={(status) => mutate(selected, { status })}
              onSummarize={() => onAskAi(selected)}
            />
          )}
        />
      </div>
    </div>
  );
}
