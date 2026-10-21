import { useId, useMemo, useRef, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DropdownMenu } from '@/components/dropdown-menu';
import { IconButton } from '@/components/icon-button';
import { Columns3, Funnel } from '@/components/icon';
import { FilterPanel } from '@/patterns/filter-panel';
import { DataGrid, type GridDensity } from '@/components/data-grid';
import { SearchInput } from '@/components/search-input';
import { Select } from '@/components/select';
import { SeverityBadge } from '@/components/severity-badge';
import { Tag } from '@/components/tag';
import { MiniBarChart } from '@/components/mini-bar-chart';
import { BulkActionsBar } from '@/components/bulk-actions-bar';
import { TimeRangePicker } from '@/components/time-range-picker';
import {
  applyAlertFilters,
  createDefaultFilters,
  getAppliedFilterCount,
  type AlertFilterState,
} from '@/lib/filters';
import type { Alert, Analyst, DetectionRule } from '@/sample-data';
import { formatSiemTime, siemStateLabels, type SiemExampleAlert } from '@/sample-data/siem-example';
import './siem-example.css';
import './siem-alerts-table.css';

export interface SiemAlertsTableProps {
  alerts: Alert[];
  rules: DetectionRule[];
  analysts: Analyst[];
  filters: AlertFilterState;
  onFiltersChange: (filters: AlertFilterState) => void;
  onAlertsChange: (alerts: Alert[]) => void;
  onOpenAlert: (alert: Alert) => void;
  onAskAi: (alerts: Alert[]) => void;
  onSelectionChange?: (alerts: Alert[]) => void;
  ruleId: string;
  onRuleChange: (ruleId: string) => void;
  selectedRowIds: string[];
  density: GridDensity;
  now: number;
}
export function SiemAlertsTable({
  alerts,
  rules,
  analysts,
  filters,
  onFiltersChange,
  onAlertsChange,
  onOpenAlert,
  onAskAi,
  onSelectionChange,
  density,
  selectedRowIds,
  ruleId,
  onRuleChange,
  now,
}: SiemAlertsTableProps) {
  const panelId = useId();
  const shellRef = useRef<HTMLDivElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const ruleAlerts = useMemo(
    () => alerts.filter((alert) => ruleId === 'all' || alert.ruleId === ruleId),
    [alerts, ruleId],
  );
  const filtered = useMemo(
    () => applyAlertFilters(ruleAlerts, filters, now),
    [ruleAlerts, filters, now],
  );
  const filterCount = getAppliedFilterCount(filters) + Number(ruleId !== 'all');
  const patch = (value: Partial<AlertFilterState>) => onFiltersChange({ ...filters, ...value });
  function closePanel() {
    setPanelOpen(false);
    const toggle = shellRef.current?.querySelector<HTMLButtonElement>(
      'button[aria-controls="' + panelId + '"]',
    );
    if (toggle) toggle.focus();
    else shellRef.current?.querySelector<HTMLElement>('.aegis-grid-scroll')?.focus();
  }
  function clearFilters() {
    onFiltersChange(createDefaultFilters());
    onRuleChange('all');
  }
  const columns: ColumnDef<Alert>[] = [
    {
      accessorKey: 'title',
      header: 'Alert',
      size: 280,
      minSize: 260,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="siem-cell-copy">
          <strong>{row.original.title}</strong>
          <span>
            {row.original.id} · {row.original.ruleId}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'severity',
      header: 'Severity',
      size: 116,
      cell: ({ row }) => <SeverityBadge severity={row.original.severity} />,
    },
    {
      accessorKey: 'status',
      header: 'State',
      size: 120,
      cell: ({ row }) => (
        <Tag
          variant="status"
          dotColor={
            row.original.status === 'triaged' ? 'var(--color-status-triaged-fg)' : undefined
          }
          intent={
            row.original.status === 'resolved'
              ? 'success'
              : row.original.status === 'in-progress'
                ? 'warning'
                : row.original.status === 'new'
                  ? 'function'
                  : 'default'
          }
        >
          {siemStateLabels[row.original.status]}
        </Tag>
      ),
    },
    {
      id: 'exportedTo',
      header: 'Exported to',
      size: 120,
      accessorFn: (a) => (a as Partial<SiemExampleAlert>).exportedTo?.join(', ') || '—',
    },
    { accessorKey: 'eventCount', header: 'Signals', size: 100, meta: { align: 'right' } },
    {
      id: 'assignee',
      header: 'Assignee',
      size: 136,
      accessorFn: (a) => a.assignee?.name || 'Unassigned',
    },
    {
      id: 'created',
      meta: { align: 'right', cellClassName: 'mono' },
      header: 'Created',
      size: 160,
      minSize: 160,
      accessorFn: (a) => (a as Partial<SiemExampleAlert>).createdAt || a.firstSeen,
      cell: ({ getValue }) => (
        <time dateTime={getValue<string>()}>{formatSiemTime(getValue<string>())}</time>
      ),
    },
    {
      id: 'updated',
      meta: { align: 'right', cellClassName: 'mono' },
      header: 'Updated',
      size: 160,
      minSize: 160,
      accessorFn: (a) => (a as Partial<SiemExampleAlert>).updatedAt || a.lastSeen,
      cell: ({ getValue }) => (
        <time dateTime={getValue<string>()}>{formatSiemTime(getValue<string>())}</time>
      ),
    },
    {
      id: 'activity',
      header: 'Activity',
      size: 128,
      enableSorting: false,
      cell: ({ row }) => (
        <MiniBarChart
          data={row.original.sparkline}
          width={96}
          height={28}
          label={`Recent signal activity for ${row.original.id}`}
        />
      ),
    },
  ];
  function mutate(selected: Alert[], values: Partial<Alert>) {
    const ids = new Set(selected.map((a) => a.id));
    onAlertsChange(
      alerts.map((a) =>
        ids.has(a.id) ? { ...a, ...values, updatedAt: new Date(now).toISOString() } : a,
      ),
    );
  }
  return (
    <div className="siem-alerts-workspace" data-panel-open={panelOpen} ref={shellRef}>
      <div className="siem-alerts-facets" id={panelId} aria-hidden={!panelOpen} inert={!panelOpen}>
        {panelOpen && (
          <FilterPanel
            value={filters}
            onValueChange={onFiltersChange}
            alerts={ruleAlerts}
            analysts={analysts}
            now={now}
            onClose={closePanel}
            onClearAll={clearFilters}
            additionalFilterCount={Number(ruleId !== 'all')}
            statusGroupLabel="State"
            statusLabelOverrides={siemStateLabels}
          >
            <Select
              label="Detection rule"
              value={ruleId}
              onValueChange={onRuleChange}
              options={[
                { value: 'all', label: 'All detection rules' },
                ...rules.map((rule) => ({ value: rule.id, label: rule.name })),
              ]}
            />
          </FilterPanel>
        )}
      </div>
      <div className="siem-alerts-results">
        <DataGrid
          label="Security alerts"
          noun="alerts"
          data={filtered}
          columns={columns}
          getRowId={(a) => a.id}
          rowLabel={(a) => `${a.id}: ${a.title}`}
          density={density}
          selectedRowIds={selectedRowIds}
          pagination
          initialColumnVisibility={{ activity: false }}
          pageSize={25}
          height={620}
          initialSorting={[{ id: 'created', desc: true }]}
          onRowClick={onOpenAlert}
          onSelectedRowsChange={(_, rows) => onSelectionChange?.(rows)}
          emptyTitle="No alerts match your filters"
          emptyDescription="Try another rule, severity, or time range."
          renderToolbar={(api) =>
            api.selectionActions ?? (
              <div className="siem-alerts-toolbar">
                <div className="siem-alerts-filter-toggle">
                  <IconButton
                    emphasis="tertiary"
                    aria-label={filterCount > 0 ? `Filters, ${filterCount} applied` : 'Filters'}
                    aria-controls={panelId}
                    aria-expanded={panelOpen}
                    onClick={() => setPanelOpen((open) => !open)}
                  >
                    <Funnel size={16} />
                  </IconButton>
                </div>
                <SearchInput
                  aria-label="Search alerts"
                  placeholder="Search alerts, rules, or IDs…"
                  value={filters.query}
                  onValueChange={(query) => patch({ query })}
                />
                <TimeRangePicker
                  value={filters.timeRange}
                  onValueChange={(timeRange) => patch({ timeRange })}
                  now={now}
                />
                <DropdownMenu
                  label="Alert columns"
                  trigger={
                    <IconButton aria-label="Alert columns" emphasis="ghost">
                      <Columns3 size={17} />
                    </IconButton>
                  }
                  items={api.columns
                    .filter((c) => c.hideable)
                    .map((c) => ({
                      type: 'checkbox',
                      id: c.id,
                      label: c.label,
                      checked: c.visible,
                      onCheckedChange: (checked) => api.setColumnVisibility(c.id, checked),
                    }))}
                />
              </div>
            )
          }
          renderBulkActions={(selected, clear) => (
            <BulkActionsBar
              position="inline"
              selectedCount={selected.length}
              analysts={analysts}
              onClear={() => {
                clear();
                onSelectionChange?.([]);
              }}
              onAssign={(id) => mutate(selected, { assignee: analysts.find((a) => a.id === id) })}
              onStatusChange={(status) => mutate(selected, { status })}
              onSummarize={() => onAskAi(selected)}
            />
          )}
        />
      </div>
    </div>
  );
}
