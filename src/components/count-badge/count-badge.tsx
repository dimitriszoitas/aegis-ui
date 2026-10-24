import '@/components/tag/tag.css';
import './count-badge.css';
export interface CountBadgeProps {
  count: number;
  max?: number;
  label?: string;
  variant?: 'default' | 'inverted';
}
export function CountBadge({ count, max = 99, label, variant = 'default' }: CountBadgeProps) {
  return (
    <span className="count-badge" data-variant={variant} title={String(count)}>
      <span aria-hidden={label ? true : undefined}>
        {count > max ? `${max}+` : Math.max(0, count)}
      </span>
      {label && <span className="sr-only">{`${count} ${label}`}</span>}
    </span>
  );
}
