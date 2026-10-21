import { useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { parseDocument } from 'yaml';
import {
  ArrowLeft,
  FileCode,
  Funnel,
  PanelLeftClose,
  Pencil,
  Plus,
  ShieldCheck,
} from '@/components/icon';
import { Button } from '@/components/button';
import { Accordion, type AccordionItem } from '@/components/accordion';
import { Checkbox } from '@/components/checkbox';
import { IconButton } from '@/components/icon-button';
import { CountBadge } from '@/components/count-badge';
import { CopyButton } from '@/components/copy-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card';
import { CodeEditor } from '@/components/code-editor';
import { DataGrid } from '@/components/data-grid';
import { EmptyState } from '@/components/empty-state';
import { Modal } from '@/components/modal';
import { Notification } from '@/components/notification';
import { SearchInput } from '@/components/search-input';
import { Select } from '@/components/select';
import { SeverityBadge, type Severity } from '@/components/severity-badge';
import { Switch } from '@/components/switch';
import { Tabs } from '@/components/tabs';
import { Tag } from '@/components/tag';
import { Textarea } from '@/components/textarea';
import { TextInput } from '@/components/text-input';
import { Timeline } from '@/components/timeline';
import { FilterOptions } from '@/patterns/filter-panel';
import type { Alert, DetectionRule } from '@/sample-data';
import {
  formatSiemTime,
  siemExampleRules,
  siemStateLabels,
  siemExampleTime,
  type SiemExampleRule,
} from '@/sample-data/siem-example';
import '@/patterns/filter-panel/filter-panel.css';
import './console-detections.css';

export interface ConsoleDetectionsProps {
  rules: readonly DetectionRule[];
  alerts: readonly Alert[];
  onCreateRule: () => void;
  onOpenAlert: (alert: Alert) => void;
  onRulesChange?: (rules: DetectionRule[]) => void | Promise<void>;
  onShowContentLibrary?: () => void;
  selectedRuleId?: string;
  onSelectedRuleChange?: (id: string | undefined) => void;
  now?: number;
}
const severities: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
const severityOptions = severities.map((value) => ({
  value,
  label: value[0].toUpperCase() + value.slice(1),
}));
const schedules = ['Every 5m', 'Every 10m', 'Every 15m', 'Every hour'];
type RuleFacet = 'severity' | 'state' | 'source';
type RuleFilters = Record<RuleFacet, string[]>;
const ruleFacetLabels: Record<RuleFacet, string> = {
  severity: 'Severity',
  state: 'State',
  source: 'Source',
};
function ruleFacetValue(rule: SiemExampleRule, facet: RuleFacet) {
  return facet === 'state' ? (rule.enabled ? 'enabled' : 'disabled') : rule[facet];
}
function matchesRuleFilters(
  rule: SiemExampleRule,
  filters: RuleFilters,
  query: string,
  excludedFacet?: RuleFacet,
) {
  return (
    (Object.keys(filters) as RuleFacet[]).every(
      (facet) =>
        facet === excludedFacet ||
        filters[facet].length === 0 ||
        filters[facet].includes(ruleFacetValue(rule, facet)),
    ) &&
    `${rule.name} ${rule.id} ${rule.description} ${rule.technique}`
      .toLocaleLowerCase()
      .includes(query)
  );
}
const fixtureById = new Map(siemExampleRules.map((rule) => [rule.id, rule]));
function withMetadata(rule: DetectionRule): SiemExampleRule {
  const fixture = fixtureById.get(rule.id);
  const supplied = rule as Partial<SiemExampleRule>;
  return {
    ...rule,
    severity: supplied.severity ?? fixture?.severity ?? 'medium',
    enabled: supplied.enabled ?? fixture?.enabled ?? false,
    schedule: supplied.schedule ?? fixture?.schedule ?? 'Every 10m',
    updatedAt: supplied.updatedAt ?? fixture?.updatedAt ?? new Date(siemExampleTime).toISOString(),
    tactic: supplied.tactic ?? fixture?.tactic ?? 'Unspecified',
    category: supplied.category ?? fixture?.category ?? 'Custom',
    sql: supplied.sql ?? fixture?.sql ?? '-- No SQL input query has been configured for this rule.',
  };
}
function RuleState({ enabled }: { enabled: boolean }) {
  return (
    <Tag size="sm" intent={enabled ? 'success' : 'default'}>
      {enabled ? 'Enabled' : 'Disabled'}
    </Tag>
  );
}
interface RunRecord {
  id: string;
  startedAt: string;
  alerts: number;
  events: number;
}
function sampleRuns(alerts: readonly Alert[]): RunRecord[] {
  const groups = new Map<string, RunRecord>();
  for (const alert of alerts) {
    const timestamp = Math.floor(Date.parse(alert.lastSeen) / 600_000) * 600_000;
    const id = `sample-${timestamp}`;
    const record = groups.get(id) ?? {
      id,
      startedAt: new Date(timestamp).toISOString(),
      alerts: 0,
      events: 0,
    };
    record.alerts += 1;
    record.events += alert.eventCount;
    groups.set(id, record);
  }
  return [...groups.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}
const runColumns: ColumnDef<RunRecord>[] = [
  {
    accessorKey: 'startedAt',
    meta: { align: 'right', cellClassName: 'mono' },
    header: 'Sample window',
    size: 230,
    cell: ({ row }) => formatSiemTime(row.original.startedAt),
  },
  { accessorKey: 'alerts', header: 'Alerts', size: 120, meta: { align: 'right' } },
  { accessorKey: 'events', header: 'Signals', size: 120, meta: { align: 'right' } },
];
const alertColumns: ColumnDef<Alert>[] = [
  {
    accessorKey: 'title',
    header: 'Alert',
    size: 360,
    cell: ({ row }) => (
      <span className="aegis-detections-cell">
        <strong>{row.original.title}</strong>
        <small>{row.original.id}</small>
      </span>
    ),
  },
  {
    accessorKey: 'severity',
    header: 'Severity',
    size: 120,
    cell: ({ row }) => <SeverityBadge severity={row.original.severity} />,
  },
  {
    accessorKey: 'status',
    header: 'State',
    size: 150,
    cell: ({ row }) => (
      <Tag
        variant="status"
        intent={
          row.original.status === 'resolved'
            ? 'success'
            : row.original.status === 'new'
              ? 'function'
              : row.original.status === 'in-progress'
                ? 'warning'
                : 'default'
        }
        dotColor={row.original.status === 'triaged' ? 'var(--color-status-triaged-fg)' : undefined}
      >
        {siemStateLabels[row.original.status]}
      </Tag>
    ),
  },
  { accessorKey: 'eventCount', header: 'Signals', size: 100, meta: { align: 'right' } },
  {
    accessorKey: 'lastSeen',
    meta: { align: 'right', cellClassName: 'mono' },
    header: 'Created',
    size: 180,
    cell: ({ row }) => formatSiemTime(row.original.lastSeen),
  },
];

export function ConsoleDetections({
  rules,
  alerts,
  onCreateRule,
  onOpenAlert,
  onRulesChange,
  onShowContentLibrary,
  selectedRuleId,
  onSelectedRuleChange,
  now = siemExampleTime,
}: ConsoleDetectionsProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<RuleFilters>({ severity: [], state: [], source: [] });
  const [expandedFilters, setExpandedFilters] = useState(['severity', 'state', 'source']);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const filterPanelId = useId();
  const [internalSelectedId, setInternalSelectedId] = useState<string>();
  const selectedId = onSelectedRuleChange ? selectedRuleId : internalSelectedId;
  const setSelectedId = onSelectedRuleChange ?? setInternalSelectedId;
  const [tab, setTab] = useState('overview');
  const [overrides, setOverrides] = useState<Record<string, SiemExampleRule>>({});
  const [revisions, setRevisions] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState<SiemExampleRule>();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const savingRef = useRef(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const wasDetailOpen = useRef(false);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const editorId = useId();
  const prepared = useMemo(
    () => rules.map((rule) => overrides[rule.id] ?? withMetadata(rule)),
    [rules, overrides],
  );
  const selected = prepared.find((rule) => rule.id === selectedId);
  const isDetailOpen = selected !== undefined;
  useLayoutEffect(() => {
    if (wasDetailOpen.current && !isDetailOpen) {
      (
        searchRef.current ?? workspaceRef.current?.querySelector<HTMLElement>('.aegis-grid-scroll')
      )?.focus({ preventScroll: true });
    }
    wasDetailOpen.current = isDetailOpen;
  }, [isDetailOpen]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matching = prepared.filter((rule) => matchesRuleFilters(rule, filters, normalizedQuery));
  const related = selected ? alerts.filter((alert) => alert.ruleId === selected.id) : [];
  const runs = sampleRuns(related);
  const filtersCount = Object.values(filters).reduce((sum, values) => sum + values.length, 0);
  const facetOptions: Record<RuleFacet, { value: string; label: string; content?: ReactNode }[]> = {
    severity: severityOptions.map((option) => ({
      ...option,
      content: <SeverityBadge severity={option.value} />,
    })),
    state: [
      { value: 'enabled', label: 'Enabled' },
      { value: 'disabled', label: 'Disabled' },
    ],
    source: [...new Set([...prepared.map((rule) => rule.source), ...filters.source])].map(
      (value) => ({ value, label: value }),
    ),
  };
  function toggleFilter(facet: RuleFacet, value: string) {
    setFilters((current) => ({
      ...current,
      [facet]: current[facet].includes(value)
        ? current[facet].filter((item) => item !== value)
        : [...current[facet], value],
    }));
  }
  const filterGroups: AccordionItem[] = (Object.keys(facetOptions) as RuleFacet[]).map((facet) => {
    // Match Alerts: each facet count excludes its own category, but honors all other criteria.
    const counts = new Map<string, number>();
    for (const rule of prepared) {
      if (!matchesRuleFilters(rule, filters, normalizedQuery, facet)) continue;
      const value = ruleFacetValue(rule, facet);
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return {
      value: facet,
      title: ruleFacetLabels[facet],
      count: filters[facet].length || undefined,
      content: (
        <FilterOptions groupLabel={ruleFacetLabels[facet]}>
          {facetOptions[facet].map(({ value, label, content }) => {
            const count = counts.get(value) ?? 0;
            return (
              <Checkbox
                key={value}
                size="sm"
                checked={filters[facet].includes(value)}
                onCheckedChange={() => toggleFilter(facet, value)}
                label={
                  <span className="aegis-filter-facet-label">
                    <span>{content ?? label}</span>
                    <span className="aegis-filter-facet-count">
                      <span className="sr-only">{count} matching rules</span>
                      <span aria-hidden="true">{count}</span>
                    </span>
                  </span>
                }
              />
            );
          })}
        </FilterOptions>
      ),
    };
  });
  const columns = useMemo<ColumnDef<SiemExampleRule>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Rule',
        size: 360,
        minSize: 240,
        cell: ({ row }) => (
          <span className="aegis-detections-rule-name" title={row.original.name}>
            {row.original.name}
          </span>
        ),
      },
      {
        id: 'namespace',
        header: 'Namespace',
        size: 160,
        accessorFn: (rule) => rule.id.split('.').slice(0, -1).join('.') || '—',
      },
      {
        accessorKey: 'severity',
        header: 'Severity',
        size: 115,
        cell: ({ row }) => <SeverityBadge severity={row.original.severity} />,
      },
      {
        accessorKey: 'enabled',
        header: 'State',
        size: 120,
        cell: ({ row }) => <RuleState enabled={row.original.enabled} />,
      },
      {
        accessorKey: 'technique',
        header: 'MITRE',
        size: 150,
        cell: ({ row }) => <Tag size="sm">{row.original.technique}</Tag>,
      },
      { accessorKey: 'schedule', header: 'Schedule', size: 135 },
      {
        accessorKey: 'updatedAt',
        meta: { align: 'right', cellClassName: 'mono' },
        header: 'Updated',
        size: 180,
        cell: ({ row }) => (
          <time dateTime={row.original.updatedAt}>{formatSiemTime(row.original.updatedAt)}</time>
        ),
      },
    ],
    [],
  );
  function closeFilters() {
    setPanelOpen(false);
    const toggle = workspaceRef.current?.querySelector<HTMLButtonElement>(
      `button[aria-controls="${filterPanelId}"]`,
    );
    (toggle ?? workspaceRef.current?.querySelector<HTMLElement>('.aegis-grid-scroll'))?.focus();
  }
  function clearFilters() {
    setFilters({ severity: [], state: [], source: [] });
  }
  function openRule(rule: SiemExampleRule) {
    setSelectedId(rule.id);
    setTab('overview');
    requestAnimationFrame(() => detailHeading.current?.focus());
  }
  function backToRules() {
    setSelectedId(undefined);
  }
  async function saveRule() {
    if (!draft || savingRef.current || !draft.name.trim() || !draft.sql.trim()) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError('');
    const updated = { ...draft, name: draft.name.trim(), updatedAt: new Date(now).toISOString() };
    try {
      const yaml = parseDocument(updated.yaml);
      if (!yaml.errors.length) {
        yaml.set('title', updated.name);
        yaml.set('description', updated.description);
        yaml.set('level', updated.severity);
        updated.yaml = yaml.toString();
      }
      if (onRulesChange) {
        await onRulesChange(prepared.map((rule) => (rule.id === updated.id ? updated : rule)));
      } else {
        setOverrides((current) => ({ ...current, [updated.id]: updated }));
      }
      setRevisions((current) => ({ ...current, [updated.id]: (current[updated.id] ?? 0) + 1 }));
      setDraft(undefined);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'The rule could not be saved. Try again.',
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }
  const ruleEditor = draft && (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open && !saving) setDraft(undefined);
      }}
      title="Edit detection rule"
      description="Changes apply to this local session. Saving does not execute a detection backend."
      size="large"
      closeOnOutsideClick={false}
      footer={
        <>
          <Button emphasis="ghost" disabled={saving} onClick={() => setDraft(undefined)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={editorId}
            loading={saving}
            disabled={saving || !draft.name.trim() || !draft.sql.trim()}
          >
            Save changes
          </Button>
        </>
      }
    >
      <form
        id={editorId}
        className="aegis-detections-editor"
        onSubmit={(event) => {
          event.preventDefault();
          void saveRule();
        }}
      >
        {saveError && (
          <Notification intent="destroy" title="Rule was not saved" description={saveError} />
        )}
        <TextInput
          label="Rule name"
          value={draft.name}
          required
          disabled={saving}
          onValueChange={(name) => setDraft({ ...draft, name })}
        />
        <Textarea
          label="Description"
          value={draft.description}
          disabled={saving}
          onValueChange={(description) => setDraft({ ...draft, description })}
        />
        <div className="aegis-detections-editor-fields">
          <Select
            label="Severity"
            value={draft.severity}
            disabled={saving}
            options={severityOptions}
            onValueChange={(value) => setDraft({ ...draft, severity: value as Severity })}
          />
          <Select
            label="Schedule"
            value={draft.schedule}
            disabled={saving}
            options={[...new Set([...schedules, draft.schedule])].map((value) => ({
              value,
              label: value,
            }))}
            onValueChange={(schedule) => setDraft({ ...draft, schedule })}
          />
        </div>
        <Switch
          label="Enabled"
          description="Keep this rule enabled in the local configuration."
          checked={draft.enabled}
          disabled={saving}
          onCheckedChange={(enabled) => setDraft({ ...draft, enabled })}
        />
        <div className="aegis-detections-code">
          <span className="aegis-field-label">Input SQL</span>
          <CodeEditor
            language="sql"
            label="Detection input SQL"
            value={draft.sql}
            readOnly={saving}
            onValueChange={(sql) => setDraft({ ...draft, sql })}
            minHeight={210}
            maxHeight={320}
            statusBar="Local configuration · SQL"
          />
        </div>
      </form>
    </Modal>
  );
  const appliedFilters = filtersCount > 0 && (
    <div className="aegis-detections-applied" aria-label="Applied rule filters" role="group">
      {(Object.keys(filters) as RuleFacet[]).flatMap((facet) =>
        filters[facet].map((value) => {
          const label =
            facetOptions[facet].find((option) => option.value === value)?.label ?? value;
          return (
            <Tag
              key={`${facet}-${value}`}
              variant="removable"
              onRemove={() => {
                toggleFilter(facet, value);
                searchRef.current?.focus();
              }}
              removeLabel={`Remove ${ruleFacetLabels[facet].toLowerCase()} filter: ${label}`}
            >
              {ruleFacetLabels[facet]}: {label}
            </Tag>
          );
        }),
      )}
    </div>
  );
  if (!selected)
    return (
      <div
        className="aegis-detections aegis-detections-workspace"
        data-panel-open={panelOpen}
        ref={workspaceRef}
      >
        <div
          className="aegis-detections-facets"
          id={filterPanelId}
          aria-hidden={!panelOpen}
          inert={!panelOpen}
        >
          {panelOpen && (
            <aside
              className="aegis-filter-panel aegis-detections-filter-panel"
              aria-labelledby={`${filterPanelId}-heading`}
              onKeyDown={(event) => {
                if (
                  event.key === 'Escape' &&
                  !event.defaultPrevented &&
                  event.currentTarget.contains(event.target as Node)
                ) {
                  event.preventDefault();
                  closeFilters();
                }
              }}
            >
              <div className="aegis-filter-panel-heading">
                <h2 id={`${filterPanelId}-heading`}>
                  Filters{' '}
                  {filtersCount > 0 && (
                    <CountBadge count={filtersCount} label="applied rule filters" />
                  )}
                </h2>
                <div className="aegis-filter-panel-actions">
                  <Button
                    size="sm"
                    emphasis="ghost"
                    onClick={clearFilters}
                    disabled={!filtersCount}
                  >
                    Clear all
                  </Button>
                  <IconButton
                    aria-label="Collapse rule filters"
                    size="sm"
                    emphasis="ghost"
                    onClick={closeFilters}
                  >
                    <PanelLeftClose size={16} />
                  </IconButton>
                </div>
              </div>
              <span className="aegis-filter-panel-result" role="status">
                {matching.length} of {prepared.length} rules match
              </span>
              <div
                className="aegis-filter-panel-scroll"
                tabIndex={0}
                role="region"
                aria-label="Rule filter options"
              >
                <Accordion
                  type="multiple"
                  value={expandedFilters}
                  onValueChange={setExpandedFilters}
                  items={filterGroups}
                />
              </div>
            </aside>
          )}
        </div>
        <div className="aegis-detections-results">
          <DataGrid
            data={matching}
            columns={columns}
            getRowId={(rule) => rule.id}
            rowLabel={(rule) => rule.name}
            onRowClick={openRule}
            selectedRowIds={selectedRowIds}
            onSelectedRowsChange={setSelectedRowIds}
            label="Detection rules"
            noun="rules"
            density="default"
            pageSize={25}
            height={600}
            initialSorting={[{ id: 'name', desc: false }]}
            emptyTitle="No detection rules match"
            emptyDescription="Try another rule name or clear the active filters."
            renderToolbar={(api) =>
              api.selectionActions ?? (
                <div className="aegis-detections-toolbar">
                  <div className="aegis-detections-filter-toggle">
                    <IconButton
                      emphasis="tertiary"
                      aria-label={filtersCount > 0 ? `Filters, ${filtersCount} applied` : 'Filters'}
                      aria-controls={filterPanelId}
                      aria-expanded={panelOpen}
                      onClick={() => setPanelOpen((open) => !open)}
                    >
                      <Funnel size={16} />
                    </IconButton>
                  </div>
                  <SearchInput
                    ref={searchRef}
                    aria-label="Search detection rules"
                    placeholder="Search detection rules"
                    value={query}
                    onValueChange={setQuery}
                  />

                  <Button
                    className="aegis-detections-create"
                    leadingIcon={<Plus size={15} />}
                    onClick={onCreateRule}
                  >
                    Create detection rule
                  </Button>
                  {!panelOpen && appliedFilters}
                </div>
              )
            }
          />
        </div>
      </div>
    );
  const overview = (
    <div className="aegis-detections-detail-grid">
      <div className="aegis-detections-main">
        <Card>
          <CardHeader>
            <CardTitle>Run status</CardTitle>
          </CardHeader>
          <CardContent className="aegis-detections-status">
            <RuleState enabled={selected.enabled} />
            <p>
              {selected.enabled
                ? `Configured to run ${selected.schedule.toLowerCase()}.`
                : 'This rule is disabled in the local configuration.'}
            </p>
            <small>Local sample configuration · execution is not connected</small>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Input configuration</CardTitle>
            <p className="aegis-detections-note">
              SQL query · {selected.source} · main.default.security_events
            </p>
          </CardHeader>
          <CardContent>
            <CodeEditor
              language="sql"
              label="Detection input configuration"
              value={selected.sql}
              readOnly
              minHeight={280}
              maxHeight={420}
              statusBar="Read-only SQL configuration"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Detection logic</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{selected.description}</p>
            <div className="aegis-detections-tags">
              <SeverityBadge severity={selected.severity} />
              <Tag>{selected.category}</Tag>
            </div>
          </CardContent>
        </Card>
      </div>
      <aside className="aegis-detections-aside" aria-label="Rule details">
        <Card>
          <CardHeader>
            <CardTitle>Execution</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="aegis-detections-facts">
              <div>
                <dt>Schedule</dt>
                <dd>{selected.schedule}</dd>
              </div>
              <div>
                <dt>Time zone</dt>
                <dd>UTC</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{selected.source}</dd>
              </div>
              <div>
                <dt>Latest sample alert</dt>
                <dd>{runs[0] ? formatSiemTime(runs[0].startedAt) : 'No sample alerts'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>MITRE ATT&CK</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="aegis-detections-facts">
              <div>
                <dt>Tactic</dt>
                <dd>{selected.tactic}</dd>
              </div>
              <div>
                <dt>Technique</dt>
                <dd>
                  <Tag>{selected.technique}</Tag>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline
              label="Detection configuration history"
              now={now}
              items={[
                ...(revisions[selected.id]
                  ? [
                      {
                        id: 'session-edit',
                        title: 'Configuration updated',
                        description: `${revisions[selected.id]} local ${revisions[selected.id] === 1 ? 'revision' : 'revisions'} this session`,
                        timestamp: selected.updatedAt,
                        type: 'note' as const,
                      },
                    ]
                  : []),
                {
                  id: 'fixture-version',
                  title: 'Sample configuration loaded',
                  description: 'Version 1 · local fixture',
                  timestamp: fixtureById.get(selected.id)?.updatedAt ?? selected.updatedAt,
                  type: 'event',
                },
              ]}
            />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
  return (
    <section className="aegis-detections" aria-label="Detection rule detail">
      <header className="aegis-detections-detail-header">
        <Button emphasis="ghost" size="sm" leadingIcon={<ArrowLeft />} onClick={backToRules}>
          Detection rules
        </Button>
        <div className="aegis-detections-detail-title">
          <div className="aegis-detections-detail-heading">
            <h1 tabIndex={-1} ref={detailHeading}>
              {selected.name}
            </h1>
            <div className="aegis-detections-detail-identity">
              <code>{selected.id}</code>
              <CopyButton size="sm" text={selected.id} aria-label="Copy rule ID" />
            </div>
          </div>
          <Button
            emphasis="tertiary"
            leadingIcon={<Pencil size={15} />}
            onClick={() => {
              setSaveError('');
              setDraft({ ...selected });
            }}
          >
            Edit rule
          </Button>
        </div>
      </header>
      <Tabs
        label="Detection rule views"
        value={tab}
        onValueChange={setTab}
        items={[
          { value: 'overview', label: 'Overview', content: overview },
          {
            value: 'configuration',
            label: 'Configuration',
            content: (
              <div className="aegis-detections-main">
                <Notification
                  title="Local rule configuration"
                  description="Review the input SQL and detection metadata. Edit rule changes the local configuration; it does not execute this query."
                />
                <CodeEditor
                  language="sql"
                  label="Rule SQL configuration"
                  value={selected.sql}
                  readOnly
                  minHeight={320}
                  statusBar="SQL input"
                />
                <CodeEditor
                  language="yaml"
                  label="Rule YAML configuration"
                  value={selected.yaml}
                  readOnly
                  minHeight={220}
                  statusBar="Detection metadata · YAML"
                />
              </div>
            ),
          },
          {
            value: 'run-history',
            label: 'Run history',
            content: (
              <div className="aegis-detections-main">
                <Notification
                  title="Sample run history"
                  description="These ten-minute windows group the supplied alert fixtures. They are illustrative evidence, not live execution records."
                />
                <DataGrid
                  data={runs}
                  columns={runColumns}
                  getRowId={(run) => run.id}
                  label="Sample detection run history"
                  noun="windows"
                  enableSelection={false}
                  pageSize={10}
                  height={360}
                  emptyTitle="No sample run windows"
                  emptyDescription="This rule has no associated sample alerts."
                />
              </div>
            ),
          },
          {
            value: 'alerts',
            label: 'Alerts',
            count: related.length,
            content: (
              <DataGrid
                data={related}
                columns={alertColumns}
                getRowId={(alert) => alert.id}
                rowLabel={(alert) => alert.title}
                label="Alerts for this detection rule"
                enableSelection={false}
                onRowClick={onOpenAlert}
                height={420}
                pageSize={10}
                emptyTitle="No alerts for this rule"
                emptyDescription="Associated sample alerts will appear here."
              />
            ),
          },
          {
            value: 'system-errors',
            label: 'System errors',
            content: (
              <EmptyState
                icon={<ShieldCheck size={25} />}
                title="No rule-level errors in the sample"
                description="This example includes no execution-error records for this rule. Live rule health requires a connected detection backend."
              />
            ),
          },
        ]}
      />
      {onShowContentLibrary && (
        <Button
          emphasis="ghost"
          leadingIcon={<FileCode size={15} />}
          onClick={onShowContentLibrary}
        >
          Open content library
        </Button>
      )}
      {ruleEditor}
    </section>
  );
}
