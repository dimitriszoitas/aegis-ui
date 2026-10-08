import type { Meta, StoryObj } from '@storybook/react-vite';
import { MetricCard } from './metric-card';
import { alerts, timeSeries } from '@/sample-data';
const meta = {
  title: 'Components/Charts/Metric card',
  component: MetricCard,
  tags: ['autodocs'],
  args: { label: 'Open alerts', value: 86 },
} satisfies Meta<typeof MetricCard>;
export default meta;
export const ConsoleMetrics: StoryObj<typeof meta> = {
  render: () => (
    <div className="story-grid" style={{ maxWidth: 1400 }}>
      <MetricCard
        label="Open alerts"
        value={
          alerts.filter((alert) => !['resolved', 'false-positive'].includes(alert.status)).length
        }
        delta={12.4}
        trendIsPositive={false}
        sparkline={timeSeries.slice(-24).map((bucket) => bucket.total)}
      />
      <MetricCard
        label="Critical alerts"
        intent="destroy"
        value={alerts.filter((alert) => alert.severity === 'critical').length}
        delta={-8.3}
        trendIsPositive
        sparkline={timeSeries.slice(-24).map((bucket) => bucket.critical)}
      />
      <MetricCard
        label="Mean time to resolution"
        intent="success"
        value={24}
        unit="min"
        delta={-18.2}
        trendIsPositive
        sparkline={[52, 48, 46, 49, 41, 38, 42, 37, 33, 35, 31, 28, 26, 24]}
      />
      <MetricCard
        label="Events per second"
        value={8421}
        delta={4.8}
        trendIsPositive
        sparkline={timeSeries.slice(-24).map((bucket) => bucket.total)}
      />
    </div>
  ),
};
export const States: StoryObj<typeof meta> = {
  render: () => (
    <div className="story-grid">
      <MetricCard label="Open alerts" value={0} delta={0} />
      <MetricCard
        label="Detection coverage"
        value={0.984}
        format={{ style: 'percent', maximumFractionDigits: 1 }}
        delta={2.1}
      />
      <MetricCard label="Events awaiting review" value={1284} />
      <MetricCard label="Critical alerts" value={0} loading />
    </div>
  ),
};
