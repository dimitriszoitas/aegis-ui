import '@/components/tag/tag.css';
export interface CountBadgeProps {
  count: number;
  max?: number;
  label?: string;
}
export function CountBadge({ count, max = 99, label }: CountBadgeProps) {
  return (
    <span
      className="count-badge"
      aria-label={label ? `${count} ${label}` : undefined}
      title={String(count)}
    >
      {count > max ? `${max}+` : Math.max(0, count)}
    </span>
  );
}
