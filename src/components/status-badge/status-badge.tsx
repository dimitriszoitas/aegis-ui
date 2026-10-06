import type { CSSProperties } from 'react';
import '@/components/tag/tag.css';
export type AlertStatus = 'new' | 'triaged' | 'in-progress' | 'resolved' | 'false-positive';
export const statusLabels: Record<AlertStatus, string> = {
  new: 'New',
  triaged: 'Triaged',
  'in-progress': 'In progress',
  resolved: 'Resolved',
  'false-positive': 'False positive',
};
const statusIntent: Record<AlertStatus, string> = {
  new: 'function',
  triaged: 'ai',
  'in-progress': 'warning',
  resolved: 'success',
  'false-positive': 'default',
};
export interface StatusDotProps {
  status: AlertStatus;
  label?: boolean;
}
export function StatusDot({ status, label = true }: StatusDotProps) {
  const intent = statusIntent[status];
  return (
    <span
      className="status-dot"
      role={label ? 'img' : undefined}
      aria-label={label ? statusLabels[status] : undefined}
      aria-hidden={!label || undefined}
      style={{
        color:
          status === 'triaged'
            ? 'var(--color-status-triaged-fg)'
            : intent === 'default'
              ? 'var(--color-text-tertiary)'
              : `var(--color-${intent}-fg)`,
      }}
    />
  );
}
export interface StatusBadgeProps {
  status: AlertStatus;
}
export function StatusBadge({ status }: StatusBadgeProps) {
  const intent = statusIntent[status];
  return (
    <span
      className="status-badge"
      style={
        {
          '--status-fg':
            status === 'triaged'
              ? 'var(--color-status-triaged-fg)'
              : intent === 'default'
                ? 'var(--color-text-secondary)'
                : `var(--color-${intent}-fg)`,
          '--status-bg':
            intent === 'default' ? 'var(--color-bg-hover)' : `var(--color-${intent}-soft)`,
        } as CSSProperties
      }
    >
      <StatusDot status={status} label={false} />
      {statusLabels[status]}
    </span>
  );
}
