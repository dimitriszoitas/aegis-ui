import { useRef, useState, type HTMLAttributes } from 'react';
import { Columns3, Funnel, Plus, Rows2, Rows3, Rows4 } from 'lucide-react';
import type { Analyst } from '@/sample-data';
import { Button } from '@/components/button';
import { ButtonGroup } from '@/components/button-group';
import { IconButton } from '@/components/icon-button';
import { Checkbox } from '@/components/checkbox';
import { Popover } from '@/components/popover';
import { SearchInput } from '@/components/search-input';
import { Select, type SelectOption } from '@/components/select';
import { TextInput } from '@/components/text-input';
import { TimeRangePicker } from '@/components/time-range-picker';
import { Tag } from '@/components/tag';
import { severityLabels } from '@/components/severity-badge';
import { statusLabels } from '@/components/status-badge';
import { cn } from '@/lib/utils';
import { formatTimeRange } from '@/lib/time-range';
import {
  alertFilterReducer,
  defaultSavedViews,
  filterSeverities,
  filterStatuses,
  filterSources,
  getAppliedFilterCount,
  hasCustomTimeRange,
  UNASSIGNED,
  type AlertFilterAction,
  type AlertFilterState,
  type FilterColumn,
  type FilterDensity,
  type FilterField,
  type FilterOperator,
  type SavedAlertView,
} from '@/lib/filters';
import './filter-bar.css';

export type { FilterColumn, FilterDensity, SavedAlertView } from '@/lib/filters';
export interface FilterBarProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  value: AlertFilterState;
  onValueChange: (value: AlertFilterState) => void;
  analysts?: readonly Analyst[];
  savedViews?: readonly SavedAlertView[];
  now?: Date | number;
  density?: FilterDensity;
  onDensityChange?: (density: FilterDensity) => void;
  columns?: readonly FilterColumn[];
  onColumnVisibilityChange?: (id: string, visible: boolean) => void;
  onTogglePanel?: () => void;
  filterPanelOpen?: boolean;
  panelId?: string;
  disabled?: boolean;
  /** Useful for documenting the builder without a simulated click. */
  defaultBuilderOpen?: boolean;
}

const fieldLabels: Record<FilterField, string> = {
  title: 'Alert title',
  severity: 'Severity',
  status: 'Status',
  source: 'Source',
  entity: 'Entity',
  mitre: 'MITRE technique',
  assignee: 'Assignee',
  tags: 'Tag',
};
const operatorLabels: Record<FilterOperator, string> = {
  is: 'is',
  'is-not': 'is not',
  contains: 'contains',
  'not-contains': 'does not contain',
};
const fieldOptions: SelectOption[] = (Object.entries(fieldLabels) as [FilterField, string][]).map(
  ([value, label]) => ({ value, label }),
);
const operatorOptions: SelectOption[] = (
  Object.entries(operatorLabels) as [FilterOperator, string][]
).map(([value, label]) => ({ value, label }));

export function FilterBar({
  value,
  onValueChange,
  analysts = [],
  savedViews = defaultSavedViews,
  now,
  density,
  onDensityChange,
  columns = [],
  onColumnVisibilityChange,
  onTogglePanel,
  filterPanelOpen,
  panelId,
  disabled = false,
  defaultBuilderOpen = false,
  className,
  ...props
}: FilterBarProps) {
  const [builderOpen, setBuilderOpen] = useState(defaultBuilderOpen);
  const [field, setField] = useState<FilterField>('source');
  const [operator, setOperator] = useState<FilterOperator>('is');
  const [ruleValue, setRuleValue] = useState('');
  const [internalDensity, setInternalDensity] = useState<FilterDensity>('default');
  const barRef = useRef<HTMLDivElement>(null);
  const activeDensity = density ?? internalDensity;
  const dispatch = (action: AlertFilterAction) => onValueChange(alertFilterReducer(value, action));
  const removeFilter = (action: AlertFilterAction) => {
    const active = barRef.current?.ownerDocument.activeElement;
    if (active instanceof HTMLButtonElement && active.matches('.tag-remove')) {
      const buttons = Array.from(
        barRef.current?.querySelectorAll<HTMLButtonElement>('.tag-remove') ?? [],
      );
      const index = buttons.indexOf(active);
      (
        buttons[index + 1] ??
        buttons[index - 1] ??
        barRef.current?.querySelector<HTMLButtonElement>('[data-filter-add]')
      )?.focus();
    }
    dispatch(action);
  };
  const count = getAppliedFilterCount(value);
  const assigneeLabel = (id: string) =>
    id === UNASSIGNED ? 'Unassigned' : (analysts.find((analyst) => analyst.id === id)?.name ?? id);
  const choices: SelectOption[] | undefined =
    field === 'severity'
      ? filterSeverities.map((severity) => ({ value: severity, label: severityLabels[severity] }))
      : field === 'status'
        ? filterStatuses.map((status) => ({ value: status, label: statusLabels[status] }))
        : field === 'source'
          ? filterSources.map((source) => ({ value: source, label: source }))
          : field === 'assignee'
            ? [
                { value: UNASSIGNED, label: 'Unassigned' },
                ...analysts.map((analyst) => ({ value: analyst.id, label: analyst.name })),
              ]
            : undefined;
  const useChoices = choices && (operator === 'is' || operator === 'is-not');
  const ruleDisplay = (ruleField: FilterField, selected: string): string => {
    if (ruleField === 'assignee') return assigneeLabel(selected);
    const severity =
      ruleField === 'severity' ? filterSeverities.find((item) => item === selected) : undefined;
    const status =
      ruleField === 'status' ? filterStatuses.find((item) => item === selected) : undefined;
    return severity ? severityLabels[severity] : status ? statusLabels[status] : selected;
  };
  const highPriority =
    value.severities.length === 2 &&
    value.severities.includes('critical') &&
    value.severities.includes('high');
  return (
    <div
      {...props}
      ref={barRef}
      role="region"
      className={cn('aegis-filter-bar', className)}
      aria-label={props['aria-label'] ?? 'Alert filters'}
    >
      <div className="aegis-filter-bar-main">
        {onTogglePanel && (
          <IconButton
            aria-label={filterPanelOpen ? 'Hide filter panel' : 'Show filter panel'}
            aria-expanded={filterPanelOpen}
            aria-controls={panelId}
            emphasis={filterPanelOpen ? 'soft' : 'ghost'}
            intent={filterPanelOpen ? 'function' : 'default'}
            onClick={onTogglePanel}
            disabled={disabled}
          >
            <Funnel size={16} />
          </IconButton>
        )}
        <div className="aegis-filter-view">
          <Select
            aria-label="Saved view"
            options={savedViews.map((view) => ({ value: view.id, label: view.label }))}
            value={value.savedViewId ?? ''}
            placeholder="Custom view"
            disabled={disabled}
            onValueChange={(id) => {
              const view = savedViews.find((item) => item.id === id);
              if (view) dispatch({ type: 'apply-view', view });
            }}
          />
        </div>
        <SearchInput
          aria-label="Search alerts"
          placeholder="Search alerts, entities, techniques…"
          value={value.query}
          onValueChange={(query) => dispatch({ type: 'patch', patch: { query } })}
          disabled={disabled}
          className="aegis-filter-search"
        />
        <TimeRangePicker
          value={value.timeRange}
          onValueChange={(timeRange) => dispatch({ type: 'patch', patch: { timeRange } })}
          now={now}
          disabled={disabled}
        />
        <div className="aegis-filter-bar-tools">
          <ButtonGroup aria-label="Row density">
            {(
              [
                { value: 'compact', label: 'Compact rows', icon: Rows4 },
                { value: 'default', label: 'Default rows', icon: Rows3 },
                { value: 'comfortable', label: 'Comfortable rows', icon: Rows2 },
              ] as const
            ).map(({ value: next, label, icon: Icon }) => (
              <IconButton
                key={next}
                aria-label={label}
                aria-pressed={activeDensity === next}
                emphasis={activeDensity === next ? 'soft' : 'ghost'}
                intent={activeDensity === next ? 'function' : 'default'}
                size="sm"
                disabled={disabled}
                onClick={() => {
                  if (density === undefined) setInternalDensity(next);
                  onDensityChange?.(next);
                }}
              >
                <Icon size={16} />
              </IconButton>
            ))}
          </ButtonGroup>
          {columns.length > 0 && (
            <Popover
              title="Visible columns"
              width={240}
              trigger={
                <IconButton aria-label="Column settings" emphasis="ghost" disabled={disabled}>
                  <Columns3 size={16} />
                </IconButton>
              }
            >
              <div className="aegis-filter-column-options">
                {columns.map((column) => (
                  <Checkbox
                    key={column.id}
                    label={column.label}
                    checked={column.visible}
                    disabled={column.hideable === false || !onColumnVisibilityChange}
                    onCheckedChange={(checked) =>
                      onColumnVisibilityChange?.(column.id, checked === true)
                    }
                  />
                ))}
              </div>
            </Popover>
          )}
        </div>
      </div>
      <div className="aegis-filter-bar-quick" role="group" aria-label="Quick filters">
        <Tag
          variant="interactive"
          selected={highPriority}
          disabled={disabled}
          onSelectedChange={(selected) =>
            dispatch({ type: 'patch', patch: { severities: selected ? ['critical', 'high'] : [] } })
          }
        >
          High priority
        </Tag>
        <Tag
          variant="interactive"
          selected={value.statuses.length === 1 && value.statuses[0] === 'new'}
          disabled={disabled}
          onSelectedChange={(selected) =>
            dispatch({ type: 'patch', patch: { statuses: selected ? ['new'] : [] } })
          }
        >
          Needs review
        </Tag>
        <Tag
          variant="interactive"
          selected={value.assignees.includes(UNASSIGNED)}
          disabled={disabled}
          onSelectedChange={() =>
            dispatch({ type: 'toggle-facet', facet: 'assignees', value: UNASSIGNED })
          }
        >
          Unassigned
        </Tag>
        <Popover
          open={builderOpen}
          onOpenChange={setBuilderOpen}
          title="Add filter"
          width={320}
          trigger={
            <Button
              data-filter-add
              size="sm"
              emphasis="ghost"
              leadingIcon={<Plus size={14} />}
              disabled={disabled}
            >
              Add filter
            </Button>
          }
        >
          <form
            className="aegis-filter-builder"
            onSubmit={(event) => {
              event.preventDefault();
              if (!ruleValue.trim() || disabled) return;
              dispatch({
                type: 'add-rule',
                rule: { id: crypto.randomUUID(), field, operator, value: ruleValue },
              });
              setRuleValue('');
              setBuilderOpen(false);
            }}
          >
            <Select
              label="Field"
              options={fieldOptions}
              value={field}
              onValueChange={(next) => {
                setField(next as FilterField);
                setRuleValue('');
              }}
            />
            <Select
              label="Operator"
              options={operatorOptions}
              value={operator}
              onValueChange={(next) => {
                setOperator(next as FilterOperator);
                setRuleValue('');
              }}
            />
            {useChoices ? (
              <Select
                label="Value"
                placeholder="Choose a value"
                options={choices}
                value={ruleValue}
                onValueChange={setRuleValue}
              />
            ) : (
              <TextInput
                label="Value"
                placeholder={
                  field === 'mitre'
                    ? 'For example, T1059.001'
                    : field === 'entity'
                      ? 'For example, workstation-042'
                      : 'Enter a filter value'
                }
                value={ruleValue}
                onValueChange={setRuleValue}
              />
            )}
            <Button intent="function" type="submit" disabled={!ruleValue.trim() || disabled}>
              Apply filter
            </Button>
          </form>
        </Popover>
      </div>
      {count > 0 && (
        <div className="aegis-filter-bar-applied" role="group" aria-label="Applied filters">
          <span className="aegis-filter-applied-count">{count} applied</span>
          {value.query.trim() && (
            <Tag
              variant="removable"
              removeLabel="Remove search filter"
              disabled={disabled}
              onRemove={() => removeFilter({ type: 'patch', patch: { query: '' } })}
            >
              Search: {value.query}
            </Tag>
          )}
          {value.severities.map((severity) => (
            <Tag
              key={`severity-${severity}`}
              variant="removable"
              removeLabel={`Remove ${severityLabels[severity]} severity filter`}
              disabled={disabled}
              onRemove={() =>
                removeFilter({ type: 'toggle-facet', facet: 'severities', value: severity })
              }
            >
              Severity: {severityLabels[severity]}
            </Tag>
          ))}
          {value.statuses.map((status) => (
            <Tag
              key={`status-${status}`}
              variant="removable"
              removeLabel={`Remove ${statusLabels[status]} status filter`}
              disabled={disabled}
              onRemove={() =>
                removeFilter({ type: 'toggle-facet', facet: 'statuses', value: status })
              }
            >
              Status: {statusLabels[status]}
            </Tag>
          ))}
          {value.sources.map((source) => (
            <Tag
              key={`source-${source}`}
              variant="removable"
              removeLabel={`Remove ${source} source filter`}
              disabled={disabled}
              onRemove={() =>
                removeFilter({ type: 'toggle-facet', facet: 'sources', value: source })
              }
            >
              Source: {source}
            </Tag>
          ))}
          {value.assignees.map((id) => (
            <Tag
              key={`assignee-${id}`}
              variant="removable"
              removeLabel={`Remove ${assigneeLabel(id)} assignee filter`}
              disabled={disabled}
              onRemove={() => removeFilter({ type: 'toggle-facet', facet: 'assignees', value: id })}
            >
              Assignee: {assigneeLabel(id)}
            </Tag>
          ))}
          {value.rules.map((rule) => (
            <Tag
              key={rule.id}
              variant="removable"
              removeLabel={`Remove ${fieldLabels[rule.field]} ${operatorLabels[rule.operator]} ${ruleDisplay(rule.field, rule.value)} filter`}
              disabled={disabled}
              onRemove={() => removeFilter({ type: 'remove-rule', id: rule.id })}
            >
              {fieldLabels[rule.field]} {operatorLabels[rule.operator]}{' '}
              {ruleDisplay(rule.field, rule.value)}
            </Tag>
          ))}
          {hasCustomTimeRange(value) && (
            <Tag
              variant="removable"
              removeLabel="Reset time range to last 24 hours"
              disabled={disabled}
              onRemove={() =>
                removeFilter({
                  type: 'patch',
                  patch: { timeRange: { mode: 'relative', preset: '24h' } },
                })
              }
            >
              {formatTimeRange(value.timeRange)}
            </Tag>
          )}
          <Button
            size="sm"
            emphasis="ghost"
            onClick={() => {
              barRef.current?.querySelector<HTMLButtonElement>('[data-filter-add]')?.focus();
              dispatch({ type: 'reset' });
            }}
            disabled={disabled}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
