import { type ReactNode, type ComponentProps } from 'react';
import {
  CheckCheck,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  UserRoundCheck,
  Activity,
} from 'lucide-react';
import { RelativeTime } from '@/components/relative-time';
import { EmptyState } from '@/components/empty-state';
import { cn } from '@/lib/utils';
import './timeline.css';
export type TimelineEventType = 'detection' | 'assignment' | 'status' | 'note' | 'ai' | 'event';
export interface TimelineEntry {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  timestamp: string | Date | number;
  type?: TimelineEventType;
  actor?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}
export interface TimelineProps extends Omit<ComponentProps<'ol'>, 'children'> {
  items: readonly TimelineEntry[];
  now?: Date | number;
  timeZone?: string;
  label?: string;
}
const icons = {
  detection: ShieldAlert,
  assignment: UserRoundCheck,
  status: CheckCheck,
  note: MessageSquare,
  ai: Sparkles,
  event: Activity,
};
export function Timeline({
  items,
  now,
  timeZone = 'UTC',
  label = 'Investigation timeline',
  className,
  ...props
}: TimelineProps) {
  if (!items.length)
    return (
      <EmptyState
        title="No investigation activity yet"
        description="Analyst notes and triage changes will appear here."
      />
    );
  return (
    <ol {...props} className={cn('aegis-timeline', className)} aria-label={label}>
      {items.map((item) => {
        const type = item.type ?? 'event',
          Icon = icons[type];
        return (
          <li className="aegis-timeline-entry" key={item.id} data-type={type}>
            <span className="aegis-timeline-marker" aria-hidden="true">
              {item.icon ?? <Icon size={14} />}
            </span>
            <div className="aegis-timeline-content">
              <div className="aegis-timeline-heading">
                <strong>{item.title}</strong>
                <RelativeTime value={item.timestamp} now={now} timeZone={timeZone} compact />
              </div>
              {item.actor && (
                <span className="aegis-timeline-actor">
                  {item.actor}
                  {type === 'ai' ? ' · AI generated' : ''}
                </span>
              )}
              {type === 'ai' && !item.actor && (
                <span className="aegis-timeline-actor">AI generated</span>
              )}
              {item.description && (
                <div className="aegis-timeline-description">{item.description}</div>
              )}
              {item.actions && <div className="aegis-timeline-actions">{item.actions}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
