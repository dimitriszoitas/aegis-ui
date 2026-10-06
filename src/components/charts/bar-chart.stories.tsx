import type { Meta, StoryObj } from '@storybook/react-vite';
import { BarChart } from './charts';
import { alerts, timeSeries } from '@/sample-data';
const sources = ['EDR', 'Identity', 'Firewall', 'DNS'].map((source) => ({
  label: source,
  open: alerts.filter(
    (alert) => alert.source === source && !['resolved', 'false-positive'].includes(alert.status),
  ).length,
  resolved: alerts.filter(
    (alert) => alert.source === source && ['resolved', 'false-positive'].includes(alert.status),
  ).length,
}));
const meta = {
  title: 'Components/Charts/Bar chart',
  component: BarChart,
  tags: ['autodocs'],
  args: {
    title: 'Alert workload by source',
    description: 'Open and completed investigations',
    data: sources,
    series: [
      { key: 'open', label: 'Open alerts', color: 'function' },
      { key: 'resolved', label: 'Completed', color: 'success' },
    ],
  },
} satisfies Meta<typeof BarChart>;
export default meta;
export const GroupedSources: StoryObj<typeof meta> = {};
export const StackedSeverity: StoryObj<typeof meta> = {
  args: {
    title: 'Severity stacks',
    description: 'Event activity by half-hour bucket',
    data: timeSeries,
    series: [
      { key: 'info', label: 'Info', color: 'info' },
      { key: 'low', label: 'Low', color: 'low' },
      { key: 'medium', label: 'Medium', color: 'medium' },
      { key: 'high', label: 'High', color: 'high' },
      { key: 'critical', label: 'Critical', color: 'critical' },
    ],
    stacked: true,
  },
};
