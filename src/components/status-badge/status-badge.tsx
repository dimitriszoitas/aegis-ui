import type { CSSProperties } from 'react';
import '@/components/tag/tag.css';
export type RecordStatus = 'new' | 'in-review' | 'in-progress' | 'completed' | 'cancelled';
export const statusLabels: Record<RecordStatus, string> = {
  new: 'New',
  'in-review': 'In review',
  'in-progress': 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
const statusIntent: Record<RecordStatus, string> = {
  new: 'function',
  'in-review': 'ai',
  'in-progress': 'warning',
  completed: 'success',
  cancelled: 'default',
};
export interface StatusDotProps {
  status: RecordStatus;
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
          status === 'in-review'
            ? 'var(--color-status-review-fg)'
            : intent === 'default'
              ? 'var(--color-text-tertiary)'
              : `var(--color-${intent}-fg)`,
      }}
    />
  );
}
export interface StatusBadgeProps {
  status: RecordStatus;
}
export function StatusBadge({ status }: StatusBadgeProps) {
  const intent = statusIntent[status];
  return (
    <span
      className="status-badge"
      style={
        {
          '--status-fg':
            status === 'in-review'
              ? 'var(--color-status-review-fg)'
              : intent === 'default'
                ? 'var(--color-text-secondary)'
                : `var(--color-${intent}-fg)`,
        } as CSSProperties
      }
    >
      <StatusDot status={status} label={false} />
      {statusLabels[status]}
    </span>
  );
}
