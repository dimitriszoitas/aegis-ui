import '@/components/tag/tag.css';
export interface CountBadgeProps {
  count: number;
  max?: number;
  label?: string;
}
export function CountBadge({ count, max = 99, label }: CountBadgeProps) {
  return (
    <span className="count-badge" title={String(count)}>
      <span aria-hidden={label ? true : undefined}>
        {count > max ? `${max}+` : Math.max(0, count)}
      </span>
      {label && <span className="sr-only">{`${count} ${label}`}</span>}
    </span>
  );
}
