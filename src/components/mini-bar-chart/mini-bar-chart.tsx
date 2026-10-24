import { Sparkline, type SparklineProps } from '@/components/sparkline';

export type MiniBarChartProps = Omit<SparklineProps, 'variant'>;

/** Compact, zero-based bars for metrics and table cells. Shares Sparkline's
 * semantic colors, accessible summary, loading state, and non-interactive SVG. */
export function MiniBarChart({ width = 120, height = 32, ...props }: MiniBarChartProps) {
  return <Sparkline {...props} variant="bar" width={width} height={height} />;
}
