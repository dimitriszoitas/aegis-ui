import { useId, type ComponentProps } from 'react';
import { Skeleton } from '@/components/skeleton';
import { cn } from '@/lib/utils';
import './sparkline.css';

export interface SparklineProps extends Omit<
  ComponentProps<'svg'>,
  'children' | 'width' | 'height'
> {
  data: readonly number[];
  variant?: 'line' | 'area' | 'bar';
  intent?: 'function' | 'ai' | 'success' | 'warning' | 'destroy';
  width?: number;
  height?: number;
  label?: string;
  loading?: boolean;
}
/** Lightweight SVG series for dense tables and metrics. It never animates or captures focus. */
export function Sparkline({
  data,
  variant = 'line',
  intent = 'function',
  width = 100,
  height = 28,
  label,
  loading = false,
  className,
  style,
  ...props
}: SparklineProps) {
  const id = useId().replaceAll(':', '');
  const values = data.map((value) => (Number.isFinite(value) ? Math.max(0, value) : 0));
  const w = Number.isFinite(width) ? Math.max(24, width) : 100,
    h = Number.isFinite(height) ? Math.max(12, height) : 28;
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
  const paint = intent === 'ai' ? `url(#${id}-sparkline-ai)` : 'currentColor';
  if (loading)
    return (
      <span role="status" aria-label={`Loading ${label ?? 'activity trend'}`}>
        <Skeleton variant="block" width={w} height={h} />
      </span>
    );
  if (!values.length)
    return (
      <span
        className="aegis-sparkline-empty"
        style={{ width: w, height: h }}
        role="img"
        aria-label={label ?? 'No activity data'}
      >
        —
      </span>
    );
  return (
    <svg
      {...props}
      role="img"
      aria-label={
        label ??
        `Activity across ${values.length} time buckets: latest ${values.at(-1)} events, peak ${Math.max(...values)}`
      }
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={cn('aegis-sparkline', className)}
      style={{ color: `var(--color-chart-${intent})`, ...style }}
    >
      {intent === 'ai' && (
        <defs>
          <linearGradient id={`${id}-sparkline-ai`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-ai-bg)" />
            <stop offset="50%" stopColor="var(--color-ai-pink-bg)" />
            <stop offset="100%" stopColor="var(--color-ai-blue-bg)" />
          </linearGradient>
        </defs>
      )}
      {variant === 'bar' ? (
        values.map((value, index) => (
          <rect
            key={index}
            x={(index * w) / values.length + 1}
            y={h - (value / peak) * (h - 2)}
            width={Math.max(1, w / values.length - 2)}
            height={(value / peak) * (h - 2)}
            rx="1"
            fill={paint}
          />
        ))
      ) : (
        <>
          {variant === 'area' && <path d={area} fill={paint} opacity=".12" />}
          {values.length === 1 ? (
            <circle cx={w / 2} cy={h / 2} r="2" fill={paint} />
          ) : (
            <path
              d={line}
              fill="none"
              stroke={paint}
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
