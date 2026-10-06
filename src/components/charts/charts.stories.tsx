import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChartContainer, ChartLegend, ChartTooltip, ChartDataTable } from './charts';
import { Button } from '@/components/button';
const meta = {
  title: 'Components/Charts/Chart container',
  component: ChartContainer,
  subcomponents: { ChartTooltip, ChartLegend, ChartDataTable },
  tags: ['autodocs'],
  args: {
    title: 'Authentication events',
    description: 'Identity telemetry over the last 24 hours',
  },
} satisfies Meta<typeof ChartContainer>;
export default meta;
function FailureExample() {
  const [error, setError] = useState('The identity telemetry source did not respond.');
  return (
    <ChartContainer
      title="Identity event history"
      error={error}
      empty={!error}
      onRetry={() => setError('')}
    />
  );
}
export const States: StoryObj<typeof meta> = {
  render: () => (
    <div className="story-grid">
      <ChartContainer title="Loading endpoint events" loading />
      <ChartContainer title="No matching identity events" empty />
      <FailureExample />
    </div>
  ),
};
export const TooltipAndLegend: StoryObj<typeof meta> = {
  render: () => (
    <ChartContainer
      title="Event volume"
      description="Floating tooltip and tokenized legend"
      height={170}
      action={
        <Button
          size="sm"
          emphasis="ghost"
          onClick={() =>
            navigator.clipboard?.writeText('08:00 UTC: 42 endpoint, 28 identity events')
          }
        >
          Copy values
        </Button>
      }
      legend={
        <ChartLegend
          series={[
            { key: 'endpoint', label: 'Endpoint', color: 'function' },
            { key: 'identity', label: 'Identity', color: 'ai' },
          ]}
        />
      }
    >
      <div style={{ padding: 'var(--space-6)', width: 280 }}>
        <ChartTooltip
          active
          label="08:00 UTC"
          payload={[
            { name: 'Endpoint', value: 42, color: 'var(--color-chart-function)' },
            { name: 'Identity', value: 28, color: 'var(--color-chart-ai)' },
          ]}
        />
      </div>
    </ChartContainer>
  ),
};
