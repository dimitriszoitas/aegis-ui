import { useId, useState, type HTMLAttributes, type ReactNode } from 'react';
import { Activity, CircleDot, RadioTower, ShieldAlert, UserRound, X } from '@/components/icon';
import type { Alert, Analyst } from '@/sample-data';
import { Accordion, type AccordionItem } from '@/components/accordion';
import { Button } from '@/components/button';
import { Checkbox } from '@/components/checkbox';
import { CountBadge } from '@/components/count-badge';
import { IconButton } from '@/components/icon-button';
import { SearchInput } from '@/components/search-input';
import { SeverityBadge, severityLabels } from '@/components/severity-badge';
import { statusLabels } from '@/components/status-badge';
import { cn } from '@/lib/utils';
import { formatTimeRange } from '@/lib/time-range';
import {
  alertFilterReducer,
  applyAlertFilters,
  filterSeverities,
  filterSources,
  filterStatuses,
  getAlertFacetCounts,
  getAlertHistogram,
  getAppliedFilterCount,
  UNASSIGNED,
  type AlertFilterAction,
  type AlertFilterState,
} from '@/lib/filters';
import './filter-panel.css';

export interface FilterPanelProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onChange' | 'defaultValue'
> {
  value: AlertFilterState;
  onValueChange: (value: AlertFilterState) => void;
  alerts: readonly Alert[];
  analysts?: readonly Analyst[];
  now?: Date | number;
  onClose?: () => void;
  disabled?: boolean;
  defaultSearch?: string;
}

/** A 300px in-flow panel. The containing grid shell owns its push/collapse transition. */
export function FilterPanel({
  value,
  onValueChange,
  alerts,
  analysts,
  now,
  onClose,
  disabled = false,
  defaultSearch = '',
  className,
  ...props
}: FilterPanelProps) {
  const [search, setSearch] = useState(defaultSearch);
  const [expanded, setExpanded] = useState(['severity', 'status', 'source', 'assignee']);
  const titleId = useId();
  const chartTitleId = useId();
  const anchor = now ?? Date.now();
  const query = search.trim().toLocaleLowerCase();
  const dispatch = (action: AlertFilterAction) => onValueChange(alertFilterReducer(value, action));
  const count = getAppliedFilterCount(value);
  const matching = applyAlertFilters(alerts, value, anchor).length;
  const severityCounts = getAlertFacetCounts(alerts, value, 'severities', anchor);
  const statusCounts = getAlertFacetCounts(alerts, value, 'statuses', anchor);
  const sourceCounts = getAlertFacetCounts(alerts, value, 'sources', anchor);
  const assigneeCounts = getAlertFacetCounts(alerts, value, 'assignees', anchor);
  const owners = analysts ?? [
    ...new Map(
      alerts.flatMap((alert) =>
        alert.assignee ? [[alert.assignee.id, alert.assignee] as const] : [],
      ),
    ).values(),
  ];
  const assignees = [{ id: UNASSIGNED, name: 'Unassigned' }, ...owners];
  // Keep selected IDs removable even when their owner is no longer in the loaded records.
  for (const id of value.assignees)
    if (!assignees.some((owner) => owner.id === id)) assignees.push({ id, name: id });
  const visible = (group: string, label: string) =>
    !query || `${group} ${label}`.toLocaleLowerCase().includes(query);
  const facetLabel = (label: ReactNode, count: number) => (
    <span className="aegis-filter-facet-label">
      <span>{label}</span>
      <span className="aegis-filter-facet-count">
        <span className="sr-only">{count} matching alerts</span>
        <span aria-hidden="true">{count}</span>
      </span>
    </span>
  );
  const groups: AccordionItem[] = [];
  const severities = filterSeverities.filter((severity) =>
    visible('severity', severityLabels[severity]),
  );
  const statuses = filterStatuses.filter((status) => visible('status', statusLabels[status]));
  const sources = filterSources.filter((source) => visible('source', source));
  const visibleAssignees = assignees.filter((owner) => visible('assignee', owner.name));
  if (severities.length)
    groups.push({
      value: 'severity',
      title: 'Severity',
      icon: <ShieldAlert size={15} />,
      count: value.severities.length || undefined,
      content: (
        <div className="aegis-filter-facets">
          {severities.map((severity) => (
            <Checkbox
              size="sm"
              key={severity}
              checked={value.severities.includes(severity)}
              disabled={disabled}
              label={facetLabel(
                <SeverityBadge severity={severity} />,
                severityCounts[severity] ?? 0,
              )}
              onCheckedChange={() =>
                dispatch({ type: 'toggle-facet', facet: 'severities', value: severity })
              }
            />
          ))}
        </div>
      ),
    });
  if (statuses.length)
    groups.push({
      value: 'status',
      title: 'Status',
      icon: <CircleDot size={15} />,
      count: value.statuses.length || undefined,
      content: (
        <div className="aegis-filter-facets">
          {statuses.map((status) => (
            <Checkbox
              size="sm"
              key={status}
              checked={value.statuses.includes(status)}
              disabled={disabled}
              label={facetLabel(statusLabels[status], statusCounts[status] ?? 0)}
              onCheckedChange={() =>
                dispatch({ type: 'toggle-facet', facet: 'statuses', value: status })
              }
            />
          ))}
        </div>
      ),
    });
  if (sources.length)
    groups.push({
      value: 'source',
      title: 'Source',
      icon: <RadioTower size={15} />,
      count: value.sources.length || undefined,
      content: (
        <div className="aegis-filter-facets">
          {sources.map((source) => (
            <Checkbox
              size="sm"
              key={source}
              checked={value.sources.includes(source)}
              disabled={disabled}
              label={facetLabel(source, sourceCounts[source] ?? 0)}
              onCheckedChange={() =>
                dispatch({ type: 'toggle-facet', facet: 'sources', value: source })
              }
            />
          ))}
        </div>
      ),
    });
  if (visibleAssignees.length)
    groups.push({
      value: 'assignee',
      title: 'Assignee',
      icon: <UserRound size={15} />,
      count: value.assignees.length || undefined,
      content: (
        <div className="aegis-filter-facets">
          {visibleAssignees.map((owner) => (
            <Checkbox
              size="sm"
              key={owner.id}
              checked={value.assignees.includes(owner.id)}
              disabled={disabled}
              label={facetLabel(owner.name, assigneeCounts[owner.id] ?? 0)}
              onCheckedChange={() =>
                dispatch({ type: 'toggle-facet', facet: 'assignees', value: owner.id })
              }
            />
          ))}
        </div>
      ),
    });
  const bins = getAlertHistogram(alerts, value, anchor);
  const maximum = Math.max(1, ...bins.map((bin) => bin.count));
  const timeLabel = (timestamp: number) =>
    new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(timestamp);
  return (
    <aside
      {...props}
      className={cn('aegis-filter-panel', className)}
      aria-labelledby={props['aria-labelledby'] ?? titleId}
    >
      <div className="aegis-filter-panel-heading">
        <h2 id={titleId}>
          Filters <CountBadge count={count} label="applied filters" />
        </h2>
        <div className="aegis-filter-panel-actions">
          <Button
            emphasis="ghost"
            size="sm"
            disabled={disabled || count === 0}
            onClick={() => dispatch({ type: 'reset' })}
          >
            Clear all
          </Button>
          {onClose && (
            <IconButton
              aria-label="Close filter panel"
              emphasis="ghost"
              size="sm"
              onClick={onClose}
            >
              <X size={14} />
            </IconButton>
          )}
        </div>
      </div>
      <SearchInput
        aria-label="Search filter options"
        placeholder="Find a filter…"
        value={search}
        onValueChange={setSearch}
        disabled={disabled}
        clearLabel="Clear filter option search"
      />
      <div className="aegis-filter-panel-result" role="status" aria-live="polite">
        {matching.toLocaleString()} matching {matching === 1 ? 'alert' : 'alerts'}
      </div>
      <div
        className="aegis-filter-panel-scroll"
        tabIndex={0}
        role="region"
        aria-label="Filter options"
      >
        {groups.length ? (
          <Accordion
            type="multiple"
            value={query ? groups.map((group) => group.value) : expanded}
            onValueChange={(next) => {
              if (!query) setExpanded(next);
            }}
            items={groups}
          />
        ) : (
          <p className="aegis-filter-panel-empty" role="status">
            No filter options match “{search}”.
          </p>
        )}
        <figure className="aegis-filter-mini-chart">
          <figcaption>
            <span>
              <Activity size={15} aria-hidden="true" />
              Alert activity
            </span>
            <span>{formatTimeRange(value.timeRange)}</span>
          </figcaption>
          <svg viewBox="0 0 260 76" role="img" aria-labelledby={chartTitleId}>
            <title id={chartTitleId}>
              {matching} alerts by last seen, across {bins.length} time intervals.{' '}
              {formatTimeRange(value.timeRange)}.
            </title>
            {bins.map((bin, index) => {
              const height = (bin.count / maximum) * 64;
              return (
                <rect
                  key={index}
                  x={(index * 260) / bins.length + 1}
                  y={72 - height}
                  width={260 / bins.length - 3}
                  height={Math.max(1, height)}
                  rx={2}
                  className={bin.count ? 'aegis-filter-mini-bar' : 'aegis-filter-mini-bar-empty'}
                >
                  <title>
                    {timeLabel(bin.from)}–{timeLabel(bin.to)} UTC: {bin.count} alerts
                  </title>
                </rect>
              );
            })}
          </svg>
          <div className="aegis-filter-mini-axis" aria-hidden="true">
            <span>{timeLabel(bins[0].from)} UTC</span>
            <span>{timeLabel(bins[bins.length - 1].to)} UTC</span>
          </div>
        </figure>
      </div>
    </aside>
  );
}
