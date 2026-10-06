import type { Meta, StoryObj } from '@storybook/react-vite';
import { SparklineCell } from './data-grid-cells';
const series = [
  1, 0, 2, 1, 4, 3, 5, 7, 4, 6, 11, 8, 15, 12, 18, 23, 19, 16, 12, 22, 28, 24, 30, 26,
];
export default {
  title: 'Components/Data grid/Sparkline cell',
  component: SparklineCell,
  tags: ['autodocs'],
  args: { data: series },
} satisfies Meta<typeof SparklineCell>;
export const Matrix: StoryObj<typeof SparklineCell> = {
  render: () => (
    <div className="surface stack" style={{ maxWidth: 400 }}>
      {(['line', 'area', 'bar'] as const).map((variant) => (
        <div className="between" key={variant}>
          <span className="muted">24-hour event activity · {variant}</span>
          <SparklineCell data={series} variant={variant} />
        </div>
      ))}
    </div>
  ),
};
export const EdgeCases: StoryObj<typeof SparklineCell> = {
  render: () => (
    <div className="row" style={{ gap: 'var(--space-6)' }}>
      <SparklineCell data={[]} />
      <SparklineCell data={[8]} />
      <SparklineCell data={[4, 4, 4, 4]} intent="ai" />
      <SparklineCell data={[0, 0, 0, 0]} variant="bar" />
    </div>
  ),
};
