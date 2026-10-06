import {
  useEffect,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { ChevronDown, ChevronRight, Globe2, MoreHorizontal, Server, Sparkles } from 'lucide-react';
import { Avatar } from '@/components/avatar';
import { DropdownMenu } from '@/components/dropdown-menu';
import { IconButton } from '@/components/icon-button';
import type { Intent } from '@/components/button';
import { SeverityBadge, type Severity } from '@/components/severity-badge';
import { StatusBadge, type AlertStatus } from '@/components/status-badge';
import { Tag } from '@/components/tag';
import { Tooltip } from '@/components/tooltip';
import { cn } from '@/lib/utils';
import './data-grid-cells.css';

export interface SeverityCellProps {
  severity: Severity;
  compact?: boolean;
}
export function SeverityCell({ severity, compact }: SeverityCellProps) {
  return <SeverityBadge severity={severity} compact={compact} />;
}

export interface GridEntity {
  type: 'user' | 'host' | 'ip';
  name: string;
  detail?: string;
}
export interface EntityCellProps extends ComponentProps<'div'> {
  entity: GridEntity;
  avatar?: ReactNode;
}
export function EntityCell({ entity, avatar, className, ...props }: EntityCellProps) {
  return (
    <div className={cn('aegis-entity-cell', className)} {...props}>
      {avatar ??
        (entity.type === 'user' ? (
          <Avatar name={entity.name} size="sm" />
        ) : (
          <span className="aegis-entity-cell-icon" aria-hidden="true">
            {entity.type === 'host' ? <Server size={14} /> : <Globe2 size={14} />}
          </span>
        ))}
      <span className="aegis-entity-cell-copy">
        <span className={cn('aegis-entity-cell-name', entity.type !== 'user' && 'mono')}>
          {entity.name}
        </span>
        {entity.detail && <span className="aegis-entity-cell-detail">{entity.detail}</span>}
      </span>
    </div>
  );
}

export interface TimeCellProps extends Omit<ComponentProps<'time'>, 'children' | 'dateTime'> {
  value: string | Date;
  /** Supply a reference time for deterministic historical displays and stories. */
  now?: Date | number;
  timeZone?: string;
}
function relativeTimestamp(timestamp: number, reference: number) {
  const seconds = Math.round((timestamp - reference) / 1000);
  const magnitude = Math.abs(seconds);
  if (magnitude < 10) return 'just now';
  const unit = magnitude < 60 ? 's' : magnitude < 3600 ? 'm' : magnitude < 86400 ? 'h' : 'd';
  const divisor = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
  const amount = Math.max(1, Math.floor(magnitude / divisor));
  return seconds > 0 ? `in ${amount}${unit}` : `${amount}${unit} ago`;
}
export function TimeCell({
  value,
  now,
  timeZone = 'UTC',
  className,
  tabIndex = 0,
  ...props
}: TimeCellProps) {
  const [clock, setClock] = useState(Date.now);
  useEffect(() => {
    if (now !== undefined) return;
    const timer = setInterval(() => setClock(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [now]);
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(+date)) return <span className="aegis-time-cell muted">Unavailable</span>;
  const absolute = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone,
    timeZoneName: 'short',
  }).format(date);
  return (
    <Tooltip content={absolute}>
      <time
        {...props}
        dateTime={date.toISOString()}
        tabIndex={tabIndex}
        title={absolute}
        className={cn('aegis-time-cell', className)}
      >
        {relativeTimestamp(+date, now === undefined ? clock : +now)}
      </time>
    </Tooltip>
  );
}

export interface TagsCellProps extends ComponentProps<'div'> {
  tags: readonly string[];
  maxVisible?: number;
}
export function TagsCell({ tags, maxVisible = 2, className, ...props }: TagsCellProps) {
  const maximum = Number.isFinite(maxVisible) ? Math.max(0, Math.floor(maxVisible)) : 2;
  const hidden = tags.slice(maximum);
  return (
    <div className={cn('aegis-tags-cell', className)} {...props}>
      {tags.length ? (
        <>
          {tags.slice(0, maximum).map((tag) => (
            <Tag key={tag} size="sm">
              {tag}
            </Tag>
          ))}
          {hidden.length > 0 && (
            <Tooltip content={<span>{hidden.join(' · ')}</span>}>
              <span
                className="aegis-tags-cell-overflow"
                tabIndex={0}
                aria-label={`${hidden.length} more tags: ${hidden.join(', ')}`}
              >
                +{hidden.length}
              </span>
            </Tooltip>
          )}
        </>
      ) : (
        <span className="aegis-cell-empty" aria-label="No tags">
          —
        </span>
      )}
    </div>
  );
}

export interface SparklineCellProps {
  data: readonly number[];
  variant?: 'line' | 'area' | 'bar';
  intent?: 'function' | 'ai' | 'success' | 'warning' | 'destroy';
  width?: number;
  height?: number;
  label?: string;
  className?: string;
}
/** A small semantic SVG series, usable before loading the full chart kit. */
export function SparklineCell({
  data,
  variant = 'line',
  intent = 'function',
  width = 100,
  height = 28,
  label,
  className,
}: SparklineCellProps) {
  const values = data.map((value) => (Number.isFinite(value) ? Math.max(0, value) : 0));
  const w = Math.max(24, width),
    h = Math.max(12, height);
  const peak = Math.max(1, ...values),
    low = Math.min(...values),
    spread = peak - low;
  const points = values.map((value, index) => [
    values.length === 1 ? w / 2 : 2 + (index / (values.length - 1)) * (w - 4),
    spread === 0 ? h / 2 : h - 2 - ((value - low) / spread) * (h - 4),
  ]);
  const line = points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');
  const area = `${line} L${points.at(-1)?.[0] ?? 0},${h - 1} L${points[0]?.[0] ?? 0},${h - 1} Z`;
  if (!values.length)
    return (
      <span className="aegis-cell-empty" aria-label="No activity data">
        —
      </span>
    );
  return (
    <svg
      role="img"
      aria-label={
        label ??
        `Activity across ${values.length} time buckets: latest ${values.at(-1)} events, peak ${Math.max(...values)}`
      }
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={cn('aegis-sparkline-cell', className)}
      style={{ '--sparkline-color': `var(--color-${intent}-fg)` } as CSSProperties}
    >
      {variant === 'bar' ? (
        values.map((value, index) => (
          <rect
            key={index}
            x={(index * w) / values.length + 1}
            y={h - (value / peak) * (h - 2)}
            width={Math.max(1, w / values.length - 2)}
            height={(value / peak) * (h - 2)}
            rx="1"
            fill="currentColor"
          />
        ))
      ) : (
        <>
          {variant === 'area' && <path d={area} fill="currentColor" opacity=".12" />}
          {values.length === 1 ? (
            <circle cx={w / 2} cy={h / 2} r="2" fill="currentColor" />
          ) : (
            <path
              d={line}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </>
      )}
    </svg>
  );
}

export interface StatusCellProps {
  status: AlertStatus;
}
export function StatusCell({ status }: StatusCellProps) {
  return <StatusBadge status={status} />;
}

export interface NumberCellProps extends Omit<ComponentProps<'span'>, 'children'> {
  value: number;
  format?: Intl.NumberFormatOptions;
  locale?: string;
}
export function NumberCell({
  value,
  format,
  locale = 'en-GB',
  className,
  ...props
}: NumberCellProps) {
  return (
    <span className={cn('aegis-number-cell', className)} {...props}>
      {Number.isFinite(value) ? new Intl.NumberFormat(locale, format).format(value) : '—'}
    </span>
  );
}

export interface GridCellAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  intent?: Intent;
}
export interface ActionsCellProps extends ComponentProps<'div'> {
  actions: readonly GridCellAction[];
  maxVisible?: number;
  label?: string;
}
export function ActionsCell({
  actions,
  maxVisible = 2,
  label = 'Alert actions',
  className,
  onClick,
  onKeyDown,
  ...props
}: ActionsCellProps) {
  const maximum = Number.isFinite(maxVisible) ? Math.max(0, Math.floor(maxVisible)) : 2;
  const visible = actions.slice(0, maximum),
    overflow = actions.slice(maximum);
  return (
    <div
      {...props}
      className={cn('aegis-actions-cell', className)}
      role="group"
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
        onKeyDown?.(event);
      }}
    >
      <div className="aegis-actions-cell-primary">
        {visible.map((action) => (
          <IconButton
            key={action.id}
            size="sm"
            emphasis="ghost"
            intent={action.intent}
            aria-label={action.label}
            disabled={action.disabled}
            onClick={action.onClick}
          >
            {action.icon ?? <MoreHorizontal size={15} />}
          </IconButton>
        ))}
      </div>
      {overflow.length > 0 && (
        <DropdownMenu
          label={label}
          trigger={
            <IconButton
              tooltip={false}
              size="sm"
              emphasis="ghost"
              aria-label={`More ${label.toLowerCase()}`}
            >
              <MoreHorizontal size={16} />
            </IconButton>
          }
          items={overflow.map((action) => ({
            id: action.id,
            label: action.label,
            icon: action.icon,
            disabled: action.disabled,
            intent: action.intent === 'destroy' ? 'destroy' : 'default',
            onSelect: action.onClick,
          }))}
        />
      )}
    </div>
  );
}

export interface AiVerdictCellProps extends ComponentProps<'span'> {
  verdict: string;
  /** Normalized score from 0 to 1. */ confidence: number;
}
export function AiVerdictCell({ verdict, confidence, className, ...props }: AiVerdictCellProps) {
  const score = Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0;
  const label = score >= 0.8 ? 'High' : score >= 0.5 ? 'Medium' : 'Low';
  return (
    <Tooltip
      content={
        <>
          <strong>AI suggested verdict</strong>
          <br />
          {label} confidence · {Math.round(score * 100)}%. Review the evidence before applying this
          verdict.
        </>
      }
    >
      <span
        {...props}
        tabIndex={0}
        className={cn('aegis-ai-verdict-cell', className)}
        aria-label={`AI suggestion: ${verdict}. ${label.toLowerCase()} confidence, ${Math.round(score * 100)} percent.`}
      >
        <Sparkles size={12} aria-hidden="true" />
        <span className="aegis-ai-verdict-label">{verdict}</span>
        <span className="aegis-ai-verdict-confidence">{Math.round(score * 100)}%</span>
      </span>
    </Tooltip>
  );
}

export interface ExpandCellProps extends Omit<ComponentProps<'button'>, 'children' | 'onChange'> {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  label?: string;
  count?: number;
}
export function ExpandCell({
  expanded,
  onExpandedChange,
  label = 'nested events',
  count,
  disabled,
  className,
  onClick,
  onKeyDown,
  ...props
}: ExpandCellProps) {
  return (
    <button
      {...props}
      type="button"
      className={cn('aegis-expand-cell', className)}
      disabled={disabled}
      aria-expanded={expanded}
      aria-label={`${expanded ? 'Collapse' : 'Expand'} ${count === undefined ? '' : `${count} `}${label}`}
      onClick={(event) => {
        event.stopPropagation();
        onExpandedChange(!expanded);
        onClick?.(event);
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
        onKeyDown?.(event);
      }}
    >
      {expanded ? (
        <ChevronDown size={15} aria-hidden="true" />
      ) : (
        <ChevronRight size={15} aria-hidden="true" />
      )}
      {count !== undefined && <span aria-hidden="true">{count}</span>}
    </button>
  );
}
