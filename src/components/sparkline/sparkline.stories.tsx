import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkline } from './sparkline';
import { alerts } from '@/sample-data';
const meta = {
  title: 'Components/Charts/Sparkline',
  component: Sparkline,
  tags: ['autodocs'],
  args: { data: alerts[1].sparkline, label: 'Encoded PowerShell events over the last 24 hours' },
} satisfies Meta<typeof Sparkline>;
export default meta;
export const VariantsAndIntents: StoryObj<typeof meta> = {
  render: (args) => (
    <div className="surface stack" style={{ maxWidth: 540 }}>
      {(['line', 'area', 'bar'] as const).map((variant) => (
        <div className="between" key={variant}>
          <span className="muted">{variant}</span>
          {(['function', 'ai', 'success', 'warning', 'destroy'] as const).map((intent) => (
            <Sparkline {...args} key={intent} variant={variant} intent={intent} width={72} />
          ))}
        </div>
      ))}
    </div>
  ),
};
export const States: StoryObj<typeof meta> = {
  render: (args) => (
    <div className="surface row" style={{ gap: 'var(--space-6)' }}>
      <Sparkline {...args} loading />
      <Sparkline data={[]} />
      <Sparkline data={[12]} />
      <Sparkline data={[4, 4, 4, 4]} />
      <Sparkline data={[0, 0, 0, 0]} variant="bar" />
    </div>
  ),
};
