import { useId, type ComponentProps, type ReactNode } from 'react';
import { Database, SearchX, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import './empty-state.css';

export interface EmptyStateProps extends Omit<ComponentProps<'section'>, 'title'> {
  preset?: 'no-results' | 'no-data' | 'error';
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  compact?: boolean;
}
const presets = {
  'no-results': {
    icon: SearchX,
    title: 'No alerts match your filters',
    description: 'Try a wider time range or clear a filter to see more activity.',
  },
  'no-data': {
    icon: Database,
    title: 'Your first events will appear here',
    description: 'Connect a log source to start monitoring your environment and detecting threats.',
  },
  error: {
    icon: ShieldAlert,
    title: 'We couldn’t load these alerts',
    description: 'Your investigation is safe. Check the connection and try loading alerts again.',
  },
};
export function EmptyState({
  preset = 'no-results',
  icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className,
  children,
  ...props
}: EmptyStateProps) {
  const titleId = useId();
  const descriptionId = useId();
  const defaults = presets[preset];
  const Icon = defaults.icon;
  return (
    <section
      className={cn('aegis-empty-state', className)}
      data-preset={preset}
      data-compact={compact}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      {...props}
    >
      <div className="aegis-empty-state-icon" aria-hidden="true">
        {icon ?? <Icon size={25} strokeWidth={1.6} />}
      </div>
      <div className="aegis-empty-state-copy">
        <h3 id={titleId}>{title ?? defaults.title}</h3>
        <p id={descriptionId}>{description ?? defaults.description}</p>
      </div>
      {(action || secondaryAction) && (
        <div className="aegis-empty-state-actions">
          {action}
          {secondaryAction}
        </div>
      )}
      {children}
    </section>
  );
}
