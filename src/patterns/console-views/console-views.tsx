import { useMemo, useState, type ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowRight,
  CircleCheck,
  Download,
  FileCode2,
  Layers,
  Play,
  Plus,
  Search,
  ShieldAlert,
} from '@/components/icon';
import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { ButtonGroup } from '@/components/button-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card';
import { BarChart, DonutChart, type ChartColor } from '@/components/charts';
import { CountBadge } from '@/components/count-badge';
import { DataGrid, type GridDensity } from '@/components/data-grid';
import { EntityCell, NumberCell, TimeCell } from '@/components/data-grid-cells';
import { EmptyState } from '@/components/empty-state';
import { List, ListItem } from '@/components/list';
import { MetricCard } from '@/components/metric-card';
import { RadioGroup } from '@/components/radio-group';
import { Separator } from '@/components/separator';
import type { LayoutTheme } from '@/lib/layout-theme';
import { formatRelativeTime } from '@/components/relative-time';
import { SearchInput } from '@/components/search-input';
import { Select } from '@/components/select';
import { SeverityBadge, severityLabels, type Severity } from '@/components/severity-badge';
import { statusLabels } from '@/components/status-badge';
import { Tag } from '@/components/tag';
import { YamlPresenter } from '@/components/yaml-presenter';
import type { Alert, AlertSource, DetectionRule } from '@/sample-data/types';
import './console-views.css';

const severities: readonly Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
const sources: readonly AlertSource[] = ['EDR', 'Identity', 'Firewall', 'DNS'];
const severityRank = (severity: Severity) => severities.indexOf(severity);
const isActive = (alert: Alert) => alert.status !== 'resolved' && alert.status !== 'false-positive';
const byPriority = (a: Alert, b: Alert) =>
  severityRank(a.severity) - severityRank(b.severity) ||
  Date.parse(b.lastSeen) - Date.parse(a.lastSeen);
const number = (value: number) => value.toLocaleString('en-GB');
const sourceOptions = [
  { value: 'all', label: 'All sources' },
  ...sources.map((source) => ({ value: source, label: source })),
];

interface ViewHeadingProps {
  title: string;
  description: string;
  action?: ReactNode;
}
function ViewHeading({ title, description, action }: ViewHeadingProps) {
  return (
    <header className="aegis-console-view-heading">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}
interface AlertLinksProps {
  alerts: readonly Alert[];
  onOpenAlert: (alert: Alert) => void;
  now?: Date | number;
}
function AlertLinks({ alerts, onOpenAlert, now }: AlertLinksProps) {
  return (
    <List divided aria-label="Alert investigations">
      {alerts.map((alert) => (
        <ListItem
          key={alert.id}
          title={alert.title}
          description={
            <>
              <span className="mono">{alert.id}</span> · {alert.entity.name} · {alert.mitre.id}
            </>
          }
          icon={<ShieldAlert size={17} />}
          meta={
            <span className="aegis-console-alert-meta">
              <SeverityBadge severity={alert.severity} />
              <time
                className="aegis-console-alert-time mono"
                dateTime={alert.lastSeen}
                title={new Date(alert.lastSeen).toUTCString()}
              >
                {formatRelativeTime(
                  Date.parse(alert.lastSeen),
                  now === undefined ? Date.now() : +now,
                  true,
                )}
              </time>
            </span>
          }
          onSelect={() => onOpenAlert(alert)}
        />
      ))}
    </List>
  );
}

export interface ConsoleAlertViewProps {
  alerts: readonly Alert[];
  onOpenAlert: (alert: Alert) => void;
  now?: Date | number;
}
export interface ConsoleOverviewProps extends ConsoleAlertViewProps {
  onShowAlerts?: () => void;
}
export function ConsoleOverview({ alerts, onOpenAlert, onShowAlerts, now }: ConsoleOverviewProps) {
  const active = alerts.filter(isActive);
  const urgent = [...active].sort(byPriority).slice(0, 6);
  const bySource = sources.map((source) => ({
    source,
    active: alerts.filter((alert) => alert.source === source && isActive(alert)).length,
    closed: alerts.filter((alert) => alert.source === source && !isActive(alert)).length,
  }));
  return (
    <div className="aegis-console-view">
      <ViewHeading
        title="Security overview"
        description={`${number(alerts.length)} alerts in the current time range · ${number(active.length)} active alerts`}
        action={
          onShowAlerts && (
            <Button emphasis="ghost" trailingIcon={<ArrowRight size={15} />} onClick={onShowAlerts}>
              Open alert queue
            </Button>
          )
        }
      />
      <div className="aegis-console-view-charts">
        <DonutChart
          title="Severity distribution"
          description="All alerts in the current scope"
          height={220}
          data={severities.map((severity) => ({
            name: severityLabels[severity],
            value: alerts.filter((alert) => alert.severity === severity).length,
            color: severity,
          }))}
          showDataTable
        />
        <BarChart
          title="Workload by source"
          description="Active and closed alert dispositions"
          height={220}
          data={bySource}
          xKey="source"
          series={[
            { key: 'active', label: 'Active', color: 'function' },
            { key: 'closed', label: 'Closed', color: 'chart-3' },
          ]}
          showDataTable
        />
      </div>
      <Card>
        <CardHeader>
          <div className="between">
            <CardTitle>Priority investigation queue</CardTitle>
            <CountBadge count={active.length} label="active alerts" />
          </div>
          <p className="aegis-console-section-note">
            Active alerts ordered by severity, then most recent activity.
          </p>
        </CardHeader>
        <CardContent>
          {urgent.length ? (
            <AlertLinks alerts={urgent} onOpenAlert={onOpenAlert} now={now} />
          ) : (
            <EmptyState
              compact
              preset="no-data"
              icon={<CircleCheck size={24} />}
              title="No active alerts in this scope"
              description="All loaded alerts have a closed disposition, or the current time range is empty."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export type ConsoleIncidentsProps = ConsoleAlertViewProps;
export function ConsoleIncidents({ alerts, onOpenAlert, now }: ConsoleIncidentsProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  const groups = useMemo(() => {
    const grouped = new Map<string, { id: string; entity: Alert['entity']; alerts: Alert[] }>();
    for (const alert of alerts) {
      const id = `${alert.entity.type}:${alert.entity.name}`;
      const group = grouped.get(id) ?? { id, entity: alert.entity, alerts: [] };
      group.alerts.push(alert);
      grouped.set(id, group);
    }
    return [...grouped.values()]
      .map((group) => ({ ...group, alerts: group.alerts.sort(byPriority) }))
      .sort((a, b) => byPriority(a.alerts[0], b.alerts[0]));
  }, [alerts]);
  const matching = groups.filter((group) =>
    `${group.entity.name} ${group.entity.detail} ${group.alerts.map((alert) => alert.title).join(' ')}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  const active = matching.find((group) => group.id === selected) ?? matching[0];
  return (
    <div className="aegis-console-view">
      <ViewHeading
        title="Incident investigations"
        description={`${number(groups.length)} entity groups from ${number(alerts.length)} scoped alerts`}
      />
      <Banner intent="info" title="Grouped by shared entity">
        These groups organize related records for review. Sharing a host, user, or address does not
        establish a single incident.
      </Banner>
      <div className="aegis-console-split">
        <Card className="aegis-console-picker">
          <CardHeader>
            <CardTitle>Alert groups</CardTitle>
            <SearchInput
              aria-label="Search investigation groups"
              placeholder="Find an entity or alert"
              value={query}
              onValueChange={setQuery}
            />
          </CardHeader>
          <CardContent className="aegis-console-picker-body">
            {matching.length ? (
              <List aria-label="Entity investigation groups">
                {matching.map((group) => (
                  <ListItem
                    key={group.id}
                    title={group.entity.name}
                    description={`${group.entity.type} · ${group.alerts.length} alerts · ${group.alerts.filter(isActive).length} active`}
                    icon={<Layers size={16} />}
                    meta={<SeverityBadge severity={group.alerts[0].severity} compact />}
                    selectable
                    selected={active?.id === group.id}
                    onSelect={() => setSelected(group.id)}
                  />
                ))}
              </List>
            ) : (
              <EmptyState
                compact
                title="No entity groups found"
                description="Try another entity name or widen the time range."
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="between">
              <CardTitle>{active?.entity.name ?? 'Investigation evidence'}</CardTitle>
              {active && <CountBadge count={active.alerts.length} label="alerts in group" />}
            </div>
            <p className="aegis-console-section-note">
              {active
                ? `${active.entity.detail} · Review original evidence before linking the records.`
                : 'Select a group to inspect its alerts.'}
            </p>
          </CardHeader>
          <CardContent>
            {active ? (
              <AlertLinks alerts={active.alerts} onOpenAlert={onOpenAlert} now={now} />
            ) : (
              <EmptyState
                compact
                preset="no-data"
                title="No grouped alerts in this scope"
                description="Choose a wider time range to investigate related entities."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export interface ConsoleHuntingProps extends ConsoleAlertViewProps {
  initialQuery?: string;
}
export function ConsoleHunting({
  alerts,
  onOpenAlert,
  initialQuery = '',
  now,
}: ConsoleHuntingProps) {
  const [draft, setDraft] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [source, setSource] = useState('all');
  const [submittedSource, setSubmittedSource] = useState('all');
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const results = terms.length
    ? alerts.filter((alert) => {
        if (submittedSource !== 'all' && alert.source !== submittedSource) return false;
        const searchable = [
          alert.id,
          alert.title,
          alert.source,
          alert.entity.name,
          alert.entity.detail,
          alert.mitre.id,
          alert.mitre.name,
          ...alert.tags,
          JSON.stringify(alert.events),
        ]
          .join(' ')
          .toLocaleLowerCase();
        return terms.every((term) => searchable.includes(term));
      })
    : [];
  const columns = useMemo<ColumnDef<Alert>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Alert',
        size: 340,
        minSize: 220,
        cell: ({ row }) => (
          <span className="aegis-console-hunt-title">
            <strong>{row.original.title}</strong>
            <span>
              {row.original.id} · {row.original.mitre.id}
            </span>
          </span>
        ),
      },
      {
        accessorKey: 'severity',
        header: 'Severity',
        size: 112,
        sortingFn: (a, b) => severityRank(a.original.severity) - severityRank(b.original.severity),
        cell: ({ row }) => <SeverityBadge severity={row.original.severity} />,
      },
      {
        id: 'entity',
        accessorFn: (alert) => alert.entity.name,
        header: 'Entity',
        size: 180,
        cell: ({ row }) => <EntityCell entity={row.original.entity} />,
      },
      { accessorKey: 'source', header: 'Source', size: 105 },
      {
        accessorKey: 'eventCount',
        header: 'Events',
        size: 85,
        meta: { align: 'right' },
        cell: ({ row }) => <NumberCell value={row.original.eventCount} />,
      },
      {
        accessorKey: 'lastSeen',
        header: 'Last seen',
        size: 118,
        cell: ({ row }) => <TimeCell value={row.original.lastSeen} now={now} />,
      },
    ],
    [now],
  );
  function clear() {
    setDraft('');
    setQuery('');
    setSource('all');
    setSubmittedSource('all');
  }
  return (
    <div className="aegis-console-view">
      <ViewHeading
        title="Threat hunting"
        description="Search the loaded alert fields and nested event payloads. Every search term must match."
      />
      <Card>
        <CardContent>
          <form
            className="aegis-console-hunt-form"
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(draft.trim());
              setSubmittedSource(source);
            }}
          >
            <SearchInput
              aria-label="Hunt query"
              placeholder="PowerShell, a hostname, IP address, or MITRE technique"
              value={draft}
              onValueChange={setDraft}
            />
            <Select
              aria-label="Hunt telemetry source"
              value={source}
              onValueChange={setSource}
              options={sourceOptions}
            />
            <Button
              type="submit"
              intent="function"
              leadingIcon={<Play size={14} />}
              disabled={!draft.trim()}
            >
              Run hunt
            </Button>
            <Button
              emphasis="ghost"
              onClick={clear}
              disabled={!draft && !query && source === 'all'}
            >
              Clear
            </Button>
          </form>
          <p className="aegis-console-section-note">
            Local evidence only · {number(alerts.length)} alerts ·{' '}
            {number(alerts.reduce((sum, alert) => sum + alert.events.length, 0))} loaded event
            samples
          </p>
        </CardContent>
      </Card>
      {query ? (
        <>
          <div className="aegis-console-results-heading" role="status">
            <strong>
              {number(results.length)} matching {results.length === 1 ? 'alert' : 'alerts'}
            </strong>
            <span>
              Query: <code>{query}</code>
              {submittedSource !== 'all' ? ` · ${submittedSource}` : ''}
            </span>
          </div>
          <DataGrid
            data={results}
            columns={columns}
            getRowId={(alert) => alert.id}
            label="Hunt result alerts"
            rowLabel={(alert) => alert.title}
            onRowClick={onOpenAlert}
            enableSelection={false}
            pageSize={10}
            height={420}
            emptyTitle="No evidence matched this hunt"
            emptyDescription="Try fewer terms, another source, or a wider time range."
          />
        </>
      ) : (
        <EmptyState
          icon={<Search size={25} />}
          title="Start with an investigation lead"
          description="Search a process, entity, address, or technique across the current evidence scope."
          action={
            <Button
              emphasis="secondary"
              onClick={() => {
                setDraft('powershell');
                setQuery('powershell');
                setSource('all');
                setSubmittedSource('all');
              }}
            >
              Hunt for PowerShell
            </Button>
          }
        />
      )}
    </div>
  );
}

export interface ConsoleRulesProps {
  rules: readonly DetectionRule[];
  onCreateRule: () => void;
}
export function ConsoleRules({ rules, onCreateRule }: ConsoleRulesProps) {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('all');
  const [selected, setSelected] = useState('');
  const matching = rules.filter(
    (rule) =>
      (source === 'all' || rule.source === source) &&
      `${rule.id} ${rule.name} ${rule.description} ${rule.technique}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  );
  const active = matching.find((rule) => rule.id === selected) ?? matching[0];
  return (
    <div className="aegis-console-view">
      <ViewHeading
        title="Detection rules"
        description={`${number(rules.length)} available Sigma-style rules · Review the YAML before enabling a change`}
        action={
          <Button intent="function" leadingIcon={<Plus size={15} />} onClick={onCreateRule}>
            Create detection rule
          </Button>
        }
      />
      <div className="aegis-console-rule-filters">
        <SearchInput
          aria-label="Search detection rules"
          placeholder="Find a rule or technique"
          value={query}
          onValueChange={setQuery}
        />
        <Select
          aria-label="Rule telemetry source"
          value={source}
          onValueChange={setSource}
          options={sourceOptions}
        />
      </div>
      <div className="aegis-console-split">
        <Card className="aegis-console-picker">
          <CardHeader>
            <div className="between">
              <CardTitle>Rule library</CardTitle>
              <CountBadge count={matching.length} label="matching detection rules" />
            </div>
          </CardHeader>
          <CardContent className="aegis-console-picker-body">
            {matching.length ? (
              <List aria-label="Detection rule library">
                {matching.map((rule) => (
                  <ListItem
                    key={rule.id}
                    title={rule.name}
                    description={`${rule.id} · ${rule.technique}`}
                    icon={<FileCode2 size={16} />}
                    meta={<Tag size="sm">{rule.source}</Tag>}
                    selectable
                    selected={active?.id === rule.id}
                    onSelect={() => setSelected(rule.id)}
                  />
                ))}
              </List>
            ) : (
              <EmptyState
                compact
                title="No detection rules found"
                description="Try another search term or source."
              />
            )}
          </CardContent>
        </Card>
        {active ? (
          <section className="aegis-console-rule-preview" aria-label="Selected detection rule">
            <Card>
              <CardHeader>
                <CardTitle>{active.name}</CardTitle>
                <p className="aegis-console-section-note">{active.description}</p>
              </CardHeader>
              <CardContent>
                <div className="row">
                  <Tag>{active.id}</Tag>
                  <Tag>{active.source}</Tag>
                  <Tag>{active.technique}</Tag>
                </div>
              </CardContent>
            </Card>
            <YamlPresenter
              key={active.id}
              value={active.yaml}
              filename={`${active.id.toLowerCase()}.yaml`}
              minHeight={280}
              maxHeight={510}
            />
          </section>
        ) : (
          <Card>
            <EmptyState
              compact
              preset="no-data"
              title="Choose a rule to review"
              description="Its detection logic, metadata, and copyable YAML will appear here."
            />
          </Card>
        )}
      </div>
    </div>
  );
}

export interface ConsoleReportsProps {
  alerts: readonly Alert[];
  scopeLabel?: string;
}
type ReportGrouping = 'severity' | 'source' | 'status';
export function ConsoleReports({ alerts, scopeLabel = 'Current time range' }: ConsoleReportsProps) {
  const [grouping, setGrouping] = useState<ReportGrouping>('severity');
  const [exportedCount, setExportedCount] = useState<number>();
  const closed = alerts.filter((alert) => !isActive(alert)).length;
  const groups: { key: string; label: string; color: ChartColor }[] =
    grouping === 'severity'
      ? severities.map((value) => ({ key: value, label: severityLabels[value], color: value }))
      : grouping === 'source'
        ? sources.map((value, index) => ({
            key: value,
            label: value,
            color: `chart-${index + 1}` as ChartColor,
          }))
        : Object.entries(statusLabels).map(([key, label], index) => ({
            key,
            label,
            color: `chart-${index + 1}` as ChartColor,
          }));
  const rows = groups.map((group) => {
    const matches = alerts.filter((alert) => alert[grouping] === group.key);
    return {
      ...group,
      alerts: matches.length,
      events: matches.reduce((total, alert) => total + alert.eventCount, 0),
      active: matches.filter(isActive).length,
    };
  });
  function download() {
    const cell = (value: string | number) => {
      const text = String(value);
      const safe = /^[=+@-]/.test(text) ? `'${text}` : text;
      return `"${safe.replaceAll('"', '""')}"`;
    };
    const values = [
      [
        'Alert ID',
        'Title',
        'Severity',
        'Status',
        'Source',
        'Entity',
        'MITRE technique',
        'Events',
        'First seen (UTC)',
        'Last seen (UTC)',
        'Assignee',
      ],
      ...alerts.map((alert) => [
        alert.id,
        alert.title,
        alert.severity,
        statusLabels[alert.status],
        alert.source,
        alert.entity.name,
        alert.mitre.id,
        alert.eventCount,
        alert.firstSeen,
        alert.lastSeen,
        alert.assignee?.name ?? 'Unassigned',
      ]),
    ];
    const blob = new Blob(['\uFEFF' + values.map((row) => row.map(cell).join(',')).join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'aegis-alert-report.csv';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExportedCount(alerts.length);
  }
  return (
    <div className="aegis-console-view">
      <ViewHeading
        title="Security reports"
        description={`${scopeLabel} · A snapshot of the currently loaded alerts`}
        action={
          <Button
            intent="function"
            leadingIcon={<Download size={15} />}
            onClick={download}
            disabled={!alerts.length}
          >
            Export alert CSV
          </Button>
        }
      />
      <div className="aegis-console-report-metrics">
        <MetricCard label="Alerts in scope" value={alerts.length} />
        <MetricCard label="Active alerts" value={alerts.length - closed} />
        <MetricCard label="Closed alerts" value={closed} />
        <MetricCard
          label="Associated events"
          value={alerts.reduce((sum, alert) => sum + alert.eventCount, 0)}
        />
      </div>
      <div className="aegis-console-results-heading">
        <h3>Distribution report</h3>
        <ButtonGroup aria-label="Group report by">
          {(['severity', 'source', 'status'] as const).map((value) => (
            <Button
              key={value}
              size="sm"
              emphasis={grouping === value ? 'secondary' : 'ghost'}
              intent={grouping === value ? 'function' : 'default'}
              aria-pressed={grouping === value}
              onClick={() => setGrouping(value)}
            >
              {value[0].toUpperCase() + value.slice(1)}
            </Button>
          ))}
        </ButtonGroup>
      </div>
      <div className="aegis-console-view-charts">
        <DonutChart
          title={`Alerts by ${grouping}`}
          height={235}
          data={rows.map((row) => ({ name: row.label, value: row.alerts, color: row.color }))}
        />
        <Card>
          <CardHeader>
            <CardTitle>Report breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="aegis-console-report-table-wrap"
              role="region"
              aria-label="Report breakdown"
              tabIndex={0}
            >
              <table className="aegis-console-report-table">
                <thead>
                  <tr>
                    <th scope="col">{grouping[0].toUpperCase() + grouping.slice(1)}</th>
                    <th scope="col">Alerts</th>
                    <th scope="col">Active</th>
                    <th scope="col">Events</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key}>
                      <th scope="row">{row.label}</th>
                      <td>{number(row.alerts)}</td>
                      <td>{number(row.active)}</td>
                      <td>{number(row.events)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">Total</th>
                    <td>{number(alerts.length)}</td>
                    <td>{number(alerts.length - closed)}</td>
                    <td>{number(alerts.reduce((sum, alert) => sum + alert.eventCount, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      {exportedCount !== undefined && (
        <p className="aegis-console-export-note" role="status">
          Exported {number(exportedCount)} alert records to CSV.
        </p>
      )}
    </div>
  );
}

export interface ConsoleSettingsProps {
  theme: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
  layoutTheme?: LayoutTheme;
  onLayoutThemeChange?: (theme: LayoutTheme) => void;
  density: GridDensity;
  onDensityChange: (density: GridDensity) => void;
}
export function ConsoleSettings({
  theme,
  onThemeChange,
  layoutTheme = 'floating',
  onLayoutThemeChange,
  density,
  onDensityChange,
}: ConsoleSettingsProps) {
  return (
    <div className="aegis-console-view">
      <ViewHeading
        title="Workspace settings"
        description="Display preferences apply immediately to the current workspace."
      />
      <div className="aegis-console-settings-grid">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="stack">
            {onThemeChange ? (
              <RadioGroup
                label="Workspace theme"
                value={theme}
                onValueChange={(value) => onThemeChange(value as 'light' | 'dark')}
                options={[
                  {
                    value: 'light',
                    label: 'Light',
                    description: 'Neutral surfaces with crisp borders.',
                  },
                  {
                    value: 'dark',
                    label: 'Dark',
                    description: 'Muted surfaces for a low-light workspace.',
                  },
                ]}
              />
            ) : (
              <div className="aegis-console-readonly-setting">
                <span>Workspace theme</span>
                <Tag>{theme === 'dark' ? 'Dark' : 'Light'}</Tag>
                <p>Theme follows the current preview preference.</p>
              </div>
            )}
            <Separator emphasis="light" />
            {onLayoutThemeChange ? (
              <RadioGroup
                label="Layout theme"
                value={layoutTheme}
                onValueChange={(value) => onLayoutThemeChange(value as LayoutTheme)}
                options={[
                  {
                    value: 'floating',
                    label: 'Floating',
                    description: 'Inset navigation and assistant panels with softer corners.',
                  },
                  {
                    value: 'fixed',
                    label: 'Fixed',
                    description: 'Full-height navigation and assistant panels at the edges.',
                  },
                ]}
              />
            ) : (
              <div className="aegis-console-readonly-setting">
                <span>Layout theme</span>
                <Tag>{layoutTheme === 'fixed' ? 'Fixed' : 'Floating'}</Tag>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Alert density</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              label="Default grid density"
              value={density}
              onValueChange={(value) => onDensityChange(value as GridDensity)}
              options={[
                {
                  value: 'compact',
                  label: 'Compact',
                  description: '36px rows for scanning more records.',
                },
                {
                  value: 'default',
                  label: 'Default',
                  description: '48px rows balance context and density.',
                },
                {
                  value: 'comfortable',
                  label: 'Comfortable',
                  description: '60px rows give investigation details more room.',
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Demo workspace</CardTitle>
          <p className="aegis-console-section-note">
            Aegis uses local sample evidence. Actions in this workspace do not connect to security
            infrastructure.
          </p>
        </CardHeader>
        <CardContent>
          <div className="aegis-console-setting-details">
            <div>
              <span>Telemetry sources</span>
              <strong>EDR, Identity, Firewall, DNS</strong>
            </div>
            <div>
              <span>Assistant responses</span>
              <strong>Local, deterministic streaming</strong>
            </div>
            <div>
              <span>Display times</span>
              <strong>UTC · relative timestamps on alert rows</strong>
            </div>
            <div>
              <span>Session changes</span>
              <strong>Kept until the page reloads</strong>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
