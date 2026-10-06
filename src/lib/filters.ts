import type { Alert, AlertSource } from '@/sample-data';
import type { Severity } from '@/components/severity-badge';
import type { AlertStatus } from '@/components/status-badge';
import { resolveTimeRange, type TimeRange } from '@/lib/time-range';

export const filterSeverities: readonly Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
export const filterStatuses: readonly AlertStatus[] = [
  'new',
  'triaged',
  'in-progress',
  'resolved',
  'false-positive',
];
export const filterSources: readonly AlertSource[] = ['EDR', 'Firewall', 'Identity', 'DNS'];
export const UNASSIGNED = 'unassigned';
export type FilterField =
  'title' | 'severity' | 'status' | 'source' | 'entity' | 'mitre' | 'assignee' | 'tags';
export type FilterOperator = 'is' | 'is-not' | 'contains' | 'not-contains';
export interface FilterRule {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: string;
}
export interface AlertFilterState {
  query: string;
  severities: Severity[];
  statuses: AlertStatus[];
  sources: AlertSource[];
  /** Analyst IDs; use UNASSIGNED for alerts without an owner. */
  assignees: string[];
  rules: FilterRule[];
  timeRange: TimeRange;
  savedViewId?: string;
}
export interface SavedAlertView {
  id: string;
  label: string;
  filters: AlertFilterState;
}
export type FilterFacet = 'severities' | 'statuses' | 'sources' | 'assignees';
export type FilterDensity = 'compact' | 'default' | 'comfortable';
export interface FilterColumn {
  id: string;
  label: string;
  visible: boolean;
  hideable?: boolean;
}

export function createDefaultFilters(): AlertFilterState {
  return {
    query: '',
    severities: [],
    statuses: [],
    sources: [],
    assignees: [],
    rules: [],
    timeRange: { mode: 'relative', preset: '24h' },
    savedViewId: 'all-alerts',
  };
}

export const defaultSavedViews: readonly SavedAlertView[] = [
  { id: 'all-alerts', label: 'All alerts', filters: createDefaultFilters() },
  {
    id: 'high-priority',
    label: 'High priority',
    filters: {
      ...createDefaultFilters(),
      severities: ['critical', 'high'],
      statuses: ['new', 'triaged', 'in-progress'],
    },
  },
  {
    id: 'unassigned',
    label: 'Unassigned queue',
    filters: { ...createDefaultFilters(), statuses: ['new', 'triaged'], assignees: [UNASSIGNED] },
  },
];

export type AlertFilterAction =
  | { type: 'patch'; patch: Partial<Omit<AlertFilterState, 'savedViewId'>> }
  | { type: 'toggle-facet'; facet: 'severities'; value: Severity }
  | { type: 'toggle-facet'; facet: 'statuses'; value: AlertStatus }
  | { type: 'toggle-facet'; facet: 'sources'; value: AlertSource }
  | { type: 'toggle-facet'; facet: 'assignees'; value: string }
  | { type: 'add-rule'; rule: FilterRule }
  | { type: 'remove-rule'; id: string }
  | { type: 'reset' }
  | { type: 'apply-view'; view: SavedAlertView };

function toggle<T>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

/** Shared by the horizontal bar and panel; each user edit clears saved-view identity. */
export function alertFilterReducer(
  state: AlertFilterState,
  action: AlertFilterAction,
): AlertFilterState {
  switch (action.type) {
    case 'reset':
      return createDefaultFilters();
    case 'apply-view':
      return {
        ...action.view.filters,
        severities: [...action.view.filters.severities],
        statuses: [...action.view.filters.statuses],
        sources: [...action.view.filters.sources],
        assignees: [...action.view.filters.assignees],
        rules: action.view.filters.rules.map((rule) => ({ ...rule })),
        timeRange: { ...action.view.filters.timeRange },
        savedViewId: action.view.id,
      };
    case 'patch':
      return { ...state, ...action.patch, savedViewId: undefined };
    case 'add-rule':
      return {
        ...state,
        rules: [
          ...state.rules.filter((rule) => rule.id !== action.rule.id),
          { ...action.rule, value: action.rule.value.trim() },
        ],
        savedViewId: undefined,
      };
    case 'remove-rule':
      return {
        ...state,
        rules: state.rules.filter((rule) => rule.id !== action.id),
        savedViewId: undefined,
      };
    case 'toggle-facet': {
      switch (action.facet) {
        case 'severities':
          return {
            ...state,
            severities: toggle(state.severities, action.value),
            savedViewId: undefined,
          };
        case 'statuses':
          return {
            ...state,
            statuses: toggle(state.statuses, action.value),
            savedViewId: undefined,
          };
        case 'sources':
          return { ...state, sources: toggle(state.sources, action.value), savedViewId: undefined };
        case 'assignees':
          return {
            ...state,
            assignees: toggle(state.assignees, action.value),
            savedViewId: undefined,
          };
      }
    }
  }
}

function fieldValues(alert: Alert, field: FilterField): string[] {
  switch (field) {
    case 'title':
      return [alert.title];
    case 'severity':
      return [alert.severity];
    case 'status':
      return [alert.status, alert.status.replaceAll('-', ' ')];
    case 'source':
      return [alert.source];
    case 'entity':
      return [alert.entity.name, alert.entity.detail, alert.entity.type];
    case 'mitre':
      return [alert.mitre.id, alert.mitre.name];
    case 'assignee':
      return alert.assignee ? [alert.assignee.id, alert.assignee.name] : [UNASSIGNED];
    case 'tags':
      return alert.tags;
  }
}

function matchesRule(alert: Alert, rule: FilterRule): boolean {
  const expected = rule.value.trim().toLocaleLowerCase();
  const values = fieldValues(alert, rule.field).map((value) => value.toLocaleLowerCase());
  const positive =
    rule.operator === 'contains' || rule.operator === 'not-contains'
      ? values.some((value) => value.includes(expected))
      : values.some((value) => value === expected);
  return rule.operator === 'is-not' || rule.operator === 'not-contains' ? !positive : positive;
}

/** Facets are OR within a group and AND across groups; rules are ANDed. Uses lastSeen. */
export function applyAlertFilters<T extends Alert>(
  alerts: readonly T[],
  state: AlertFilterState,
  now: Date | number = Date.now(),
): T[] {
  const { from, to } = resolveTimeRange(state.timeRange, now);
  const query = state.query.trim().toLocaleLowerCase();
  return alerts.filter((alert) => {
    const timestamp = Date.parse(alert.lastSeen);
    if (!Number.isFinite(timestamp) || timestamp < +from || timestamp > +to) return false;
    if (state.severities.length && !state.severities.includes(alert.severity)) return false;
    if (state.statuses.length && !state.statuses.includes(alert.status)) return false;
    if (state.sources.length && !state.sources.includes(alert.source)) return false;
    if (state.assignees.length && !state.assignees.includes(alert.assignee?.id ?? UNASSIGNED))
      return false;
    if (query) {
      const searchable = [
        alert.id,
        alert.title,
        alert.severity,
        alert.status,
        alert.source,
        alert.entity.name,
        alert.entity.detail,
        alert.mitre.id,
        alert.mitre.name,
        alert.assignee?.name ?? UNASSIGNED,
        ...alert.tags,
      ]
        .join(' ')
        .toLocaleLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return state.rules.every((rule) => matchesRule(alert, rule));
  });
}

/** Disjunctive counts exclude the current facet, while respecting every other filter. */
export function getAlertFacetCounts(
  alerts: readonly Alert[],
  state: AlertFilterState,
  facet: FilterFacet,
  now: Date | number = Date.now(),
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const alert of applyAlertFilters(alerts, { ...state, [facet]: [] }, now)) {
    const key =
      facet === 'severities'
        ? alert.severity
        : facet === 'statuses'
          ? alert.status
          : facet === 'sources'
            ? alert.source
            : (alert.assignee?.id ?? UNASSIGNED);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function hasCustomTimeRange(state: AlertFilterState): boolean {
  return state.timeRange.mode !== 'relative' || state.timeRange.preset !== '24h';
}
export function getAppliedFilterCount(state: AlertFilterState): number {
  return (
    Number(Boolean(state.query.trim())) +
    state.severities.length +
    state.statuses.length +
    state.sources.length +
    state.assignees.length +
    state.rules.length +
    Number(hasCustomTimeRange(state))
  );
}

export interface AlertHistogramBin {
  from: number;
  to: number;
  count: number;
}
export function getAlertHistogram(
  alerts: readonly Alert[],
  state: AlertFilterState,
  now: Date | number = Date.now(),
  binCount = 24,
): AlertHistogramBin[] {
  const { from, to } = resolveTimeRange(state.timeRange, now);
  const count = Math.max(1, Math.floor(binCount));
  const duration = Math.max(1, +to - +from);
  const bins = Array.from({ length: count }, (_, index) => ({
    from: +from + (duration * index) / count,
    to: +from + (duration * (index + 1)) / count,
    count: 0,
  }));
  for (const alert of applyAlertFilters(alerts, state, now)) {
    const index = Math.min(
      count - 1,
      Math.floor(((Date.parse(alert.lastSeen) - +from) / duration) * count),
    );
    bins[index].count += 1;
  }
  return bins;
}
