import { useId, useMemo, useRef, useState, type FormEvent } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { CircleCheck, CircleAlert, Clock, Funnel, PanelLeftClose, Plus } from '@/components/icon';
import { Button } from '@/components/button';
import { Accordion } from '@/components/accordion';
import { Checkbox } from '@/components/checkbox';
import { CountBadge } from '@/components/count-badge';
import { IconButton } from '@/components/icon-button';
import { BarChart, chartColor } from '@/components/charts';
import { DataGrid } from '@/components/data-grid';
import { Field } from '@/components/field';
import { MetricCard } from '@/components/metric-card';
import { MiniBarChart } from '@/components/mini-bar-chart';
import { Modal } from '@/components/modal';
import { SearchInput } from '@/components/search-input';
import { Select } from '@/components/select';
import { TextInput } from '@/components/text-input';
import { FilterOptions } from '@/patterns/filter-panel';
import { AppliedFilterGroups } from '@/patterns/filter-bar';
import { DatasourceProviderIcon } from './datasource-provider-icon';
import {
  createDatasourceFixtures,
  datasourceDays,
  datasourceEventTotal,
  datasourceProviders,
  datasourceSchedules,
  datasourceSnapshot,
  type ConsoleDatasource,
  type DatasourceProvider,
} from './console-datasources-data';
import './console-datasources.css';
import '../filter-panel/filter-panel.css';

const compact = (value: number) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
const integer = (value: number) => value.toLocaleString('en-GB');
const displaySourceName = (value: string) =>
  value.replace(/(^|[-_\s])\p{L}/gu, (segment) => segment.toLocaleUpperCase('en-US'));
const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
const providerOptions = datasourceProviders.map((provider) => ({
  value: provider,
  label: provider,
}));

type DatasourceFacet = 'provider' | 'environment' | 'schedule' | 'health';
type DatasourceFacetValues = Record<DatasourceFacet, string[]>;
const emptyFacets = (): DatasourceFacetValues => ({
  provider: [],
  environment: [],
  schedule: [],
  health: [],
});
function matchesFacet(source: ConsoleDatasource, facet: DatasourceFacet, value: string) {
  if (facet === 'provider') return source.provider === value;
  if (facet === 'environment') return source.group === value;
  if (facet === 'schedule') return source.schedule === value;
  if (value === 'errors') return source.errors > 0;
  if (value === 'unparsed') return source.unparsed > 0;
  return source.errors === 0 && source.unparsed === 0;
}

/** A local source-management example with reproducible telemetry and in-memory creation. */
export function ConsoleDatasources() {
  const [sources, setSources] = useState(createDatasourceFixtures);
  const [query, setQuery] = useState('');
  const [facetValues, setFacetValues] = useState(emptyFacets);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    'provider',
    'environment',
    'schedule',
    'health',
  ]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<ConsoleDatasource | null>(null);
  const [name, setName] = useState('');
  const [newProvider, setNewProvider] = useState<DatasourceProvider>('Amazon S3');
  const [schedule, setSchedule] = useState(datasourceSchedules[0]);
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const formId = useId();
  const filterPanelId = useId();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const facetGroups: {
    id: DatasourceFacet;
    label: string;
    options: { value: string; label: string }[];
  }[] = [
    { id: 'provider', label: 'Provider', options: providerOptions },
    {
      id: 'environment',
      label: 'Environment',
      options: [...new Set(sources.map((source) => source.group))].map((value) => ({
        value,
        label: value,
      })),
    },
    {
      id: 'schedule',
      label: 'Schedule',
      options: datasourceSchedules.map((value) => ({ value, label: value })),
    },
    {
      id: 'health',
      label: 'Health',
      options: [
        { value: 'errors', label: 'Has errors' },
        { value: 'unparsed', label: 'Unparsed records' },
        { value: 'healthy', label: 'Healthy' },
      ],
    },
  ];
  function matchesFilters(source: ConsoleDatasource, except?: DatasourceFacet) {
    return (
      `${source.name} ${source.provider} ${source.group}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()) &&
      facetGroups.every(
        ({ id }) =>
          id === except ||
          facetValues[id].length === 0 ||
          facetValues[id].some((value) => matchesFacet(source, id, value)),
      )
    );
  }
  const filtered = sources.filter((source) => matchesFilters(source));
  const filterCount = Object.values(facetValues).reduce((sum, values) => sum + values.length, 0);
  const appliedGroups = facetGroups.map((group) => ({
    id: group.id,
    label: group.label,
    values: group.options
      .filter((option) => facetValues[group.id].includes(option.value))
      .map((option) => option.label),
    onRemove: () => setFacetValues((current) => ({ ...current, [group.id]: [] })),
  }));
  function toggleFacet(facet: DatasourceFacet, value: string, checked: boolean) {
    setFacetValues((current) => ({
      ...current,
      [facet]: checked
        ? [...new Set([...current[facet], value])]
        : current[facet].filter((selectedValue) => selectedValue !== value),
    }));
  }
  function focusFilterToggle() {
    workspaceRef.current
      ?.querySelector<HTMLButtonElement>(`button[aria-controls="${filterPanelId}"]`)
      ?.focus({ preventScroll: true });
  }
  function closeFilters() {
    setPanelOpen(false);
    focusFilterToggle();
  }
  function clearFilters() {
    setFacetValues(emptyFacets());
  }
  // Overview metrics describe the full collection; filters scope only the table.
  const totalErrors = sources.reduce((sum, source) => sum + source.errors, 0);
  const totalUnparsed = sources.reduce((sum, source) => sum + source.unparsed, 0);
  const totalEvents = sources.reduce((sum, source) => sum + datasourceEventTotal(source), 0);
  const totalToday = sources.reduce((sum, source) => sum + (source.events.at(-1) ?? 0), 0);
  const processed = datasourceDays.map((label, day) => ({
    label,
    events: sources.reduce((sum, source) => sum + (source.events[day] ?? 0), 0),
  }));
  const columns = useMemo<ColumnDef<ConsoleDatasource>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Source name',
        size: 260,
        minSize: 210,
        cell: ({ row }) => (
          <div className="aegis-datasource-name">
            <DatasourceProviderIcon provider={row.original.provider} />
            <button
              type="button"
              title={displaySourceName(row.original.name)}
              onClick={() => setSelected(row.original)}
            >
              {displaySourceName(row.original.name)}
            </button>
          </div>
        ),
      },
      {
        accessorKey: 'schedule',
        header: 'Schedule',
        size: 138,
        minSize: 120,
        meta: { label: 'Processing schedule' },
      },
      {
        accessorKey: 'errors',
        header: 'Errors',
        size: 100,
        minSize: 92,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span
            className={row.original.errors ? 'aegis-datasource-error' : undefined}
            title={integer(row.original.errors)}
          >
            {compact(row.original.errors)}
          </span>
        ),
      },
      {
        accessorKey: 'unparsed',
        header: 'Unparsed',
        size: 125,
        minSize: 100,
        meta: { align: 'right', label: 'Unparsed records' },
        cell: ({ row }) => (
          <span title={integer(row.original.unparsed)}>{compact(row.original.unparsed)}</span>
        ),
      },
      {
        accessorKey: 'created',
        meta: { align: 'right', cellClassName: 'mono' },
        header: 'Created',
        size: 128,
        minSize: 128,
        cell: ({ row }) => (
          <time dateTime={row.original.created}>{formatDate(row.original.created)}</time>
        ),
      },
      {
        id: 'runs',
        header: 'Run history',
        size: 132,
        minSize: 120,
        enableSorting: false,
        cell: ({ row }) => (
          <div
            className="aegis-datasource-runs"
            role="img"
            aria-label={`Last six runs, oldest first: ${row.original.runs.map((run) => (run === 'not-run' ? 'not yet run' : run)).join(', ')}`}
          >
            {row.original.runs.map((run, index) => (
              <span key={index} data-run={run} aria-hidden="true">
                {run === 'success' ? (
                  <CircleCheck size={15} />
                ) : run === 'error' ? (
                  <CircleAlert size={15} />
                ) : (
                  <Clock size={15} />
                )}
              </span>
            ))}
          </div>
        ),
      },
      {
        id: 'events7d',
        accessorFn: datasourceEventTotal,
        header: 'Events · 7d',
        size: 125,
        minSize: 118,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span title={integer(datasourceEventTotal(row.original))}>
            {compact(datasourceEventTotal(row.original))}
          </span>
        ),
      },
      {
        id: 'events24h',
        accessorFn: (source) => source.events.at(-1) ?? 0,
        header: 'Events · 24h',
        size: 132,
        minSize: 126,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span title={integer(row.original.events.at(-1) ?? 0)}>
            {compact(row.original.events.at(-1) ?? 0)}
          </span>
        ),
      },
      {
        id: 'trend',
        header: 'Last 7 days',
        size: 125,
        minSize: 110,
        enableSorting: false,
        cell: ({ row }) => (
          <MiniBarChart
            data={row.original.events}
            width={100}
            height={28}
            style={{ color: chartColor('chart-2') }}
            label={`${displaySourceName(row.original.name)}, daily processed events: ${row.original.events.map(integer).join(', ')}`}
          />
        ),
      },
    ],
    [],
  );
  function beginCreate() {
    setName('');
    setNewProvider('Amazon S3');
    setSchedule(datasourceSchedules[0]);
    setError('');
    setCreating(true);
  }
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = name.trim();
    if (!clean || sources.some((source) => source.name.toLowerCase() === clean.toLowerCase())) {
      setError(clean ? 'Choose a name that is not already in use.' : 'Enter a source name.');
      nameRef.current?.focus();
      return;
    }
    setSources((current) => [
      {
        id: `local-${crypto.randomUUID()}`,
        name: clean,
        provider: newProvider,
        group: 'Local draft',
        schedule,
        errors: 0,
        unparsed: 0,
        created: datasourceSnapshot,
        runs: Array.from({ length: 6 }, () => 'not-run' as const),
        events: Array<number>(7).fill(0),
      },
      ...current,
    ]);
    setQuery('');
    clearFilters();
    setCreating(false);
    setAnnouncement(
      `${clean} was created locally. Configure credentials in a connected product to begin ingestion.`,
    );
  }
  return (
    <section className="aegis-datasources" aria-label="Datasource management">
      <div className="aegis-datasources-metrics">
        <MetricCard label="Total sources" value={sources.length} />
        <MetricCard label="Errors" value={compact(totalErrors)} />
        <MetricCard label="Unparsed records" value={compact(totalUnparsed)} />
        <MetricCard label="Events · last 7d" value={compact(totalEvents)} />
        <MetricCard label="Events · last 24h" value={compact(totalToday)} />
        <MetricCard
          className="aegis-datasources-processed"
          label="Processed events · 7d"
          value={compact(totalEvents)}
          title={`${integer(totalEvents)} processed events`}
          sparkline={processed.map(({ events }) => events)}
          sparklineVariant="bar"
          sparklineLabel={`Daily processed events: ${processed.map(({ label, events }) => `${label}, ${integer(events)}`).join('; ')}. Total: ${integer(totalEvents)}.`}
        />
      </div>
      <p className="aegis-datasources-announcement" role="status">
        {announcement}
      </p>
      <div className="aegis-datasources-workspace" data-panel-open={panelOpen} ref={workspaceRef}>
        <div
          className="aegis-datasources-facets"
          id={filterPanelId}
          aria-hidden={!panelOpen}
          inert={!panelOpen}
        >
          {panelOpen && (
            <aside
              className="aegis-filter-panel aegis-datasources-filter-panel"
              aria-labelledby={`${filterPanelId}-heading`}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && !event.defaultPrevented) {
                  event.preventDefault();
                  closeFilters();
                }
              }}
            >
              <div className="aegis-filter-panel-heading">
                <h2 id={`${filterPanelId}-heading`}>
                  Filters <CountBadge count={filterCount} label="applied datasource filters" />
                </h2>
                <div className="aegis-filter-panel-actions">
                  <Button size="sm" emphasis="ghost" onClick={clearFilters} disabled={!filterCount}>
                    Clear all
                  </Button>
                  <IconButton
                    aria-label="Collapse datasource filters"
                    size="sm"
                    emphasis="ghost"
                    onClick={closeFilters}
                  >
                    <PanelLeftClose size={16} />
                  </IconButton>
                </div>
              </div>
              <span className="aegis-filter-panel-result" role="status">
                {filtered.length} of {sources.length} sources match
              </span>
              <div
                className="aegis-filter-panel-scroll"
                tabIndex={0}
                role="region"
                aria-label="Datasource filter options"
              >
                <Accordion
                  type="multiple"
                  value={expandedGroups}
                  onValueChange={setExpandedGroups}
                  items={facetGroups.map((group) => ({
                    value: group.id,
                    title: group.label,
                    count: facetValues[group.id].length || undefined,
                    content: (
                      <FilterOptions groupLabel={group.label}>
                        {group.options.map((option) => {
                          const count = sources.filter(
                            (source) =>
                              matchesFilters(source, group.id) &&
                              matchesFacet(source, group.id, option.value),
                          ).length;
                          return (
                            <Checkbox
                              key={option.value}
                              checked={facetValues[group.id].includes(option.value)}
                              onCheckedChange={(checked) =>
                                toggleFacet(group.id, option.value, checked === true)
                              }
                              label={
                                <span className="aegis-filter-facet-label">
                                  <span className="aegis-datasources-provider-option">
                                    {group.id === 'provider' && (
                                      <span aria-hidden="true">
                                        <DatasourceProviderIcon
                                          provider={option.value as DatasourceProvider}
                                          size={16}
                                        />
                                      </span>
                                    )}
                                    <span className="aegis-filter-facet-text" title={option.label}>
                                      {option.label}
                                    </span>
                                  </span>
                                  <span className="aegis-filter-facet-count">
                                    <span className="sr-only">{count} matching sources</span>
                                    <span aria-hidden="true">{count}</span>
                                  </span>
                                </span>
                              }
                            />
                          );
                        })}
                      </FilterOptions>
                    ),
                  }))}
                />
              </div>
            </aside>
          )}
        </div>
        <div className="aegis-datasources-results">
          <DataGrid
            data={filtered}
            columns={columns}
            getRowId={(source) => source.id}
            label="Datasources"
            noun="sources"
            rowLabel={(source) => displaySourceName(source.name)}
            density="comfortable"
            pageSize={10}
            pagination
            enableSelection={false}
            emptyTitle="No matching datasources"
            emptyDescription="Try another search or clear a filter."
            renderToolbar={() => (
              <div className="aegis-datasources-toolbar-stack">
                <div className="aegis-datasources-toolbar">
                  <div className="aegis-datasources-filter-toggle">
                    <IconButton
                      emphasis="tertiary"
                      aria-label={filterCount > 0 ? `Filters, ${filterCount} applied` : 'Filters'}
                      aria-controls={filterPanelId}
                      aria-expanded={panelOpen}
                      onClick={() => setPanelOpen((open) => !open)}
                    >
                      <Funnel size={16} />
                    </IconButton>
                  </div>
                  <SearchInput
                    aria-label="Search datasources"
                    placeholder="Search datasources"
                    value={query}
                    onValueChange={setQuery}
                  />
                  <Button
                    className="aegis-datasources-create"
                    leadingIcon={<Plus size={16} />}
                    onClick={beginCreate}
                  >
                    Create datasource
                  </Button>
                </div>
                {!panelOpen && (
                  <AppliedFilterGroups
                    groups={appliedGroups}
                    onClearAll={clearFilters}
                    focusFallback={focusFilterToggle}
                  />
                )}
              </div>
            )}
          />
        </div>
      </div>
      <p className="aegis-datasources-note">
        Illustrative telemetry · 15–21 Oct 2026 · no external connections
      </p>
      <Modal
        open={creating}
        onOpenChange={setCreating}
        title="Create datasource"
        description="Add a local source entry. This example does not connect to external services."
        footer={
          <>
            <Button emphasis="tertiary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button type="submit" form={formId}>
              Create datasource
            </Button>
          </>
        }
      >
        <form id={formId} className="aegis-datasource-form" onSubmit={create} noValidate>
          <Field label="Source name" required error={error || undefined}>
            <TextInput
              ref={nameRef}
              value={name}
              maxLength={120}
              onValueChange={(next) => {
                setName(next);
                setError('');
              }}
              placeholder="production-cloudtrail"
            />
          </Field>
          <Select
            label="Provider"
            value={newProvider}
            onValueChange={(next) => setNewProvider(next as DatasourceProvider)}
            options={providerOptions}
          />
          <Select
            label="Processing schedule"
            value={schedule}
            onValueChange={setSchedule}
            options={datasourceSchedules.map((value) => ({ value, label: value }))}
          />
        </form>
      </Modal>
      <Modal
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected ? displaySourceName(selected.name) : 'Datasource details'}
        description={
          selected ? `${selected.provider} · ${selected.group} · ${selected.schedule}` : undefined
        }
        size="large"
      >
        {selected && (
          <div className="aegis-datasource-details">
            <dl>
              <div>
                <dt>Created</dt>
                <dd>{formatDate(selected.created)}</dd>
              </div>
              <div>
                <dt>Errors</dt>
                <dd>{integer(selected.errors)}</dd>
              </div>
              <div>
                <dt>Unparsed records</dt>
                <dd>{integer(selected.unparsed)}</dd>
              </div>
              <div>
                <dt>Events · last 7d</dt>
                <dd>{integer(datasourceEventTotal(selected))}</dd>
              </div>
            </dl>
            <BarChart
              title="Source processed events"
              data={datasourceDays.map((label, day) => ({ label, events: selected.events[day] }))}
              series={[{ key: 'events', label: 'Processed events', color: 'chart-2' }]}
              height={180}
              valueFormatter={compact}
              showLegend={false}
              showDataTable
            />
            <p>Local sample data. Source credentials and live collection are not configured.</p>
          </div>
        )}
      </Modal>
    </section>
  );
}
