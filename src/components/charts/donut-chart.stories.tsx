import type { Meta, StoryObj } from '@storybook/react-vite';
import { DonutChart } from './charts';
import { alerts } from '@/sample-data';
const data = (['critical', 'high', 'medium', 'low', 'info'] as const).map((severity) => ({
  name: severity[0].toUpperCase() + severity.slice(1),
  value: alerts.filter((alert) => alert.severity === severity).length,
  color: severity,
}));
const meta = {
  title: 'Components/Charts/Donut chart',
  component: DonutChart,
  tags: ['autodocs'],
  args: {
    title: 'Alert severity distribution',
    description: '150 alerts · Last 24 hours',
    data,
    showDataTable: true,
  },
} satisfies Meta<typeof DonutChart>;
export default meta;
export const SeverityDistribution: StoryObj<typeof meta> = {};
export const Sources: StoryObj<typeof meta> = {
  args: {
    title: 'Alert sources',
    data: ['EDR', 'Identity', 'Firewall', 'DNS'].map((source) => ({
      name: source,
      value: alerts.filter((alert) => alert.source === source).length,
    })),
  },
};
export const CategoricalPalette: StoryObj<typeof meta> = {
  args: {
    title: 'Events by source',
    description: 'Six categorical colors with readable labels and matching legend markers',
    totalLabel: 'Total events',
    data: [
      { name: 'Endpoint', value: 320 },
      { name: 'Identity', value: 250 },
      { name: 'Network', value: 190 },
      { name: 'Cloud', value: 160 },
      { name: 'Email', value: 120 },
      { name: 'Application', value: 90 },
    ],
  },
};
export const States: StoryObj<typeof meta> = {
  render: (args) => (
    <div className="story-grid">
      <DonutChart {...args} loading />
      <DonutChart {...args} data={[]} />
    </div>
  ),
};
