import { useId, useState, type ComponentProps, type ReactNode } from 'react';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  AreaChart as RechartsAreaChart,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  Line,
  Area,
  Bar,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Brush,
} from 'recharts';
import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { Skeleton } from '@/components/skeleton';
import type { Severity } from '@/components/severity-badge';
import { cn } from '@/lib/utils';
import './charts.css';

// Coalesce measurements during the sidebar's 120ms width transition.
const chartResizeDelay = 140;

export type ChartColor =
  | 'function'
  | 'ai'
  | 'success'
  | 'warning'
  | 'destroy'
  | Severity
  | 'chart-1'
  | 'chart-2'
  | 'chart-3'
  | 'chart-4'
  | 'chart-5'
  | 'chart-6';
export interface ChartSeries {
  key: string;
  label: string;
  color?: ChartColor;
}
export const chartPalette: readonly ChartColor[] = [
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'chart-6',
];
export function chartColor(color: ChartColor = 'chart-1'): string {
  if (['critical', 'high', 'medium', 'low', 'info'].includes(color))
    return `var(--color-chart-severity-${color})`;
  return color.startsWith('chart-') ? `var(--color-${color})` : `var(--color-chart-${color})`;
}
export interface ChartContainerProps extends Omit<ComponentProps<'figure'>, 'title'> {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  height?: number;
  loading?: boolean;
  empty?: boolean;
  emptyTitle?: string;
  error?: string;
  onRetry?: () => void;
  legend?: ReactNode;
  footer?: ReactNode;
  compact?: boolean;
}
export function ChartContainer({
  title,
  description,
  action,
  height = 260,
  loading = false,
  empty = false,
  emptyTitle = 'No events in this time range',
  error,
  onRetry,
  legend,
  footer,
  compact = false,
  className,
  children,
  ...props
}: ChartContainerProps) {
  const titleId = useId();
  return (
    <figure
      {...props}
      className={cn('aegis-chart-container', className)}
      data-compact={compact}
      aria-labelledby={titleId}
    >
      <figcaption className="aegis-chart-header">
        <div>
          <h3 id={titleId}>{title}</h3>
          {description && <div className="aegis-chart-description">{description}</div>}
        </div>
        {action && <div className="aegis-chart-action">{action}</div>}
      </figcaption>
      <div className="aegis-chart-plot" style={{ height }} aria-busy={loading || undefined}>
        {loading ? (
          <div
            className="aegis-chart-loading"
            role="status"
            aria-label={`Loading ${title.toLowerCase()}`}
          >
            <Skeleton variant="block" height="100%" />
          </div>
        ) : error ? (
          <EmptyState
            preset="error"
            compact
            title="Chart unavailable"
            description={error}
            action={
              onRetry && (
                <Button size="sm" onClick={onRetry}>
                  Retry loading
                </Button>
              )
            }
          />
        ) : empty ? (
          <EmptyState
            compact
            title={emptyTitle}
            description="Choose a wider time range or adjust the active filters to see event activity."
          />
        ) : (
          children
        )}
      </div>
      {!loading && !error && !empty && legend && (
        <div className="aegis-chart-legend-wrap">{legend}</div>
      )}
      {footer && <div className="aegis-chart-footer">{footer}</div>}
    </figure>
  );
}

export interface ChartTooltipEntry {
  name?: string | number;
  value?: string | number | readonly (string | number)[];
  color?: string;
  dataKey?: unknown;
}
export interface ChartTooltipProps {
  active?: boolean;
  label?: ReactNode;
  payload?: readonly ChartTooltipEntry[];
  valueFormat?: (value: number) => string;
}
export function ChartTooltip({
  active,
  label,
  payload,
  valueFormat = (value) => value.toLocaleString('en-GB'),
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="aegis-chart-tooltip">
      {label !== undefined && <div className="aegis-chart-tooltip-label">{label}</div>}
      {payload.map((entry, index) => (
        <div className="aegis-chart-tooltip-row" key={`${entry.name}-${index}`}>
          <span className="aegis-chart-tooltip-name">
            <span
              className="aegis-chart-swatch"
              style={{
                background: entry.color ?? chartColor(chartPalette[index % chartPalette.length]),
              }}
            />
            <span>{entry.name}</span>
          </span>
          <strong>
            {typeof entry.value === 'number'
              ? valueFormat(entry.value)
              : Array.isArray(entry.value)
                ? entry.value.join(' – ')
                : entry.value}
          </strong>
        </div>
      ))}
    </div>
  );
}
export interface ChartLegendProps {
  series: readonly ChartSeries[];
  hidden?: readonly string[];
  onToggle?: (key: string) => void;
}
export function ChartLegend({ series, hidden = [], onToggle }: ChartLegendProps) {
  return (
    <div className="aegis-chart-legend" aria-label="Chart series">
      {series.map((series, index) => {
        const content = (
          <>
            <span
              className="aegis-chart-swatch"
              style={{
                background: chartColor(series.color ?? chartPalette[index % chartPalette.length]),
              }}
            />
            <span>{series.label}</span>
          </>
        );
        return onToggle ? (
          <button
            key={series.key}
            type="button"
            aria-pressed={!hidden.includes(series.key)}
            data-hidden={hidden.includes(series.key)}
            onClick={() => onToggle(series.key)}
          >
            {content}
          </button>
        ) : (
          <span className="aegis-chart-legend-item" key={series.key}>
            {content}
          </span>
        );
      })}
    </div>
  );
}
export interface ChartDataTableProps {
  data: readonly object[];
  series: readonly ChartSeries[];
  xKey: string;
  title: string;
}
export function ChartDataTable({ data, series, xKey, title }: ChartDataTableProps) {
  return (
    <details className="aegis-chart-data">
      <summary>View chart data</summary>
      <div
        className="aegis-chart-data-scroll"
        tabIndex={0}
        role="region"
        aria-label={`${title} data`}
      >
        <table>
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              <th scope="col">Time or category</th>
              {series.map((item) => (
                <th scope="col" key={item.key}>
                  {item.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <th scope="row">{String((row as Record<string, unknown>)[xKey] ?? index + 1)}</th>
                {series.map((item) => (
                  <td key={item.key}>
                    {String((row as Record<string, unknown>)[item.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
export interface ChartBrushRange {
  startIndex: number;
  endIndex: number;
}
export interface CartesianChartProps extends Omit<
  ChartContainerProps,
  'children' | 'empty' | 'legend' | 'footer'
> {
  data: readonly object[];
  series: readonly ChartSeries[];
  xKey?: string;
  stacked?: boolean;
  showLegend?: boolean;
  showDataTable?: boolean;
  xFormatter?: (value: string | number) => string;
  valueFormatter?: (value: number) => string;
  brush?: boolean;
  brushRange?: ChartBrushRange;
  onBrushChange?: (range: ChartBrushRange) => void;
}
interface CartesianPlotProps extends CartesianChartProps {
  kind: 'line' | 'area' | 'bar';
}
function CartesianPlot({
  kind,
  title,
  data,
  series,
  xKey = 'label',
  stacked = false,
  showLegend = true,
  showDataTable = false,
  xFormatter,
  valueFormatter,
  brush = false,
  brushRange,
  onBrushChange,
  height = 260,
  ...container
}: CartesianPlotProps) {
  const [hidden, setHidden] = useState<string[]>([]);
  const id = useId().replaceAll(':', '');
  const Chart =
    kind === 'line' ? RechartsLineChart : kind === 'area' ? RechartsAreaChart : RechartsBarChart;
  const values = [...data];
  return (
    <ChartContainer
      {...container}
      title={title}
      height={height}
      empty={!data.length || !series.length}
      legend={
        showLegend && (
          <ChartLegend
            series={series}
            hidden={hidden}
            onToggle={(key) =>
              setHidden((current) =>
                current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
              )
            }
          />
        )
      }
      footer={
        showDataTable && data.length > 0 ? (
          <ChartDataTable data={data} series={series} xKey={xKey} title={title} />
        ) : undefined
      }
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        debounce={chartResizeDelay}
        initialDimension={{ width: 600, height }}
      >
        <Chart
          data={values}
          accessibilityLayer
          aria-label={`${title}. Use left and right arrows to inspect values.`}
          margin={{ top: 10, right: 8, bottom: 0, left: -18 }}
        >
          <defs>
            {series.map((item, index) => (
              <linearGradient key={item.key} id={`${id}-area-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={chartColor(item.color ?? chartPalette[index % chartPalette.length])}
                  stopOpacity=".3"
                />
                <stop
                  offset="100%"
                  stopColor={chartColor(item.color ?? chartPalette[index % chartPalette.length])}
                  stopOpacity=".025"
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--color-border-subtle)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey={xKey}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
            minTickGap={30}
            tickMargin={10}
            tickFormatter={xFormatter}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
            width={62}
            tickFormatter={
              valueFormatter ??
              ((value) => Number(value).toLocaleString('en-GB', { notation: 'compact' }))
            }
            allowDecimals={false}
          />
          <Tooltip
            content={<ChartTooltip valueFormat={valueFormatter} />}
            cursor={
              kind === 'bar'
                ? { fill: 'var(--color-bg-hover)', fillOpacity: 0.75 }
                : { stroke: 'var(--color-border-strong)', strokeDasharray: '3 3' }
            }
            isAnimationActive={false}
          />
          {series.map((item, index) => {
            const color = chartColor(item.color ?? chartPalette[index % chartPalette.length]);
            const common = {
              dataKey: item.key,
              name: item.label,
              hide: hidden.includes(item.key),
              isAnimationActive: false,
            };
            return kind === 'line' ? (
              <Line
                key={item.key}
                {...common}
                type="monotone"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: 'var(--color-bg-surface)', strokeWidth: 2 }}
                connectNulls={false}
              />
            ) : kind === 'area' ? (
              <Area
                key={item.key}
                {...common}
                type="monotone"
                stroke={color}
                strokeWidth={2}
                fill={stacked ? color : `url(#${id}-area-${index})`}
                fillOpacity={stacked ? 0.18 : 1}
                stackId={stacked ? 'series' : undefined}
                connectNulls={false}
              />
            ) : (
              <Bar
                key={item.key}
                {...common}
                fill={color}
                stackId={stacked ? 'series' : undefined}
                radius={stacked ? 0 : [3, 3, 0, 0]}
                maxBarSize={42}
              />
            );
          })}
          {brush && data.length > 1 && (
            <Brush
              dataKey={xKey}
              height={24}
              travellerWidth={8}
              fill="var(--color-bg-surface)"
              stroke="var(--color-border-strong)"
              startIndex={brushRange?.startIndex}
              endIndex={brushRange?.endIndex}
              onChange={onBrushChange}
              ariaLabel={`${title} time range`}
              tickFormatter={xFormatter}
            />
          )}
        </Chart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
export type LineChartProps = CartesianChartProps;
export function LineChart(props: LineChartProps) {
  return <CartesianPlot {...props} kind="line" />;
}
export type AreaChartProps = CartesianChartProps;
export function AreaChart(props: AreaChartProps) {
  return <CartesianPlot {...props} kind="area" />;
}
export type BarChartProps = CartesianChartProps;
export function BarChart(props: BarChartProps) {
  return <CartesianPlot {...props} kind="bar" />;
}

export interface DonutDatum {
  name: string;
  value: number;
  color?: ChartColor;
}
export interface DonutChartProps extends Omit<
  ChartContainerProps,
  'children' | 'empty' | 'legend' | 'footer'
> {
  data: readonly DonutDatum[];
  showLegend?: boolean;
  showDataTable?: boolean;
  totalLabel?: string;
}
export function DonutChart({
  title,
  data,
  height = 260,
  showLegend = true,
  showDataTable = false,
  totalLabel = 'Total alerts',
  ...props
}: DonutChartProps) {
  const values = data.map((item) => ({
    ...item,
    value: Number.isFinite(item.value) ? Math.max(0, item.value) : 0,
  }));
  const total = values.reduce((sum, item) => sum + item.value, 0);
  return (
    <ChartContainer
      {...props}
      title={title}
      height={height}
      empty={!total}
      legend={
        showLegend && (
          <ChartLegend
            series={values.map((item, index) => ({
              key: item.name,
              label: `${item.name} · ${item.value.toLocaleString()}`,
              color: item.color ?? chartPalette[index % chartPalette.length],
            }))}
          />
        )
      }
      footer={
        showDataTable && values.length > 0 ? (
          <ChartDataTable
            data={values}
            series={[{ key: 'value', label: 'Alerts' }]}
            xKey="name"
            title={title}
          />
        ) : undefined
      }
    >
      <div className="aegis-donut-plot">
        <ResponsiveContainer
          width="100%"
          height="100%"
          debounce={chartResizeDelay}
          initialDimension={{ width: 500, height }}
        >
          <RechartsPieChart
            accessibilityLayer
            aria-label={`${title}. Use arrow keys to inspect categories.`}
          >
            <Pie
              data={values}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={2}
              stroke="var(--color-bg-surface)"
              strokeWidth={3}
              isAnimationActive={false}
            >
              {values.map((item, index) => (
                <Cell
                  key={item.name}
                  fill={chartColor(item.color ?? chartPalette[index % chartPalette.length])}
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} isAnimationActive={false} />
          </RechartsPieChart>
        </ResponsiveContainer>
        <div className="aegis-donut-total" aria-hidden="true">
          <strong>{total.toLocaleString('en-GB')}</strong>
          <span>{totalLabel}</span>
        </div>
      </div>
    </ChartContainer>
  );
}
