import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressBar } from './progress-bar';
const meta = {
  title: 'Components/Feedback/Progress bar',
  component: ProgressBar,
  tags: ['autodocs'],
  args: { label: 'Evidence collection', value: 68, showValue: true },
} satisfies Meta<typeof ProgressBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Intents: Story = {
  render: () => (
    <div className="surface stack" style={{ width: 480 }}>
      {(['function', 'success', 'warning', 'destroy', 'ai'] as const).map((intent, index) => (
        <ProgressBar
          key={intent}
          label={
            [
              'Collecting event evidence',
              'Endpoint scan complete',
              'Log storage capacity',
              'Source connection failures',
              'Correlating related alerts',
            ][index]
          }
          value={[68, 100, 82, 26, 54][index]}
          intent={intent}
          showValue
        />
      ))}
    </div>
  ),
};
export const States: Story = {
  render: () => (
    <div className="surface stack" style={{ width: 480 }}>
      <ProgressBar label="Queued for analysis" value={0} showValue />
      <ProgressBar label="Rule validation complete" value={100} intent="success" showValue />
      <ProgressBar label="Querying event sources" showValue />
      <ProgressBar label="Indexing telemetry" value={45} size="sm" showValue />
    </div>
  ),
};
function CollectionDemo() {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (value >= 100) return;
    const timer = setTimeout(() => setValue((current) => Math.min(100, current + 5)), 450);
    return () => clearTimeout(timer);
  }, [value]);
  return (
    <div className="surface stack" style={{ width: 480 }}>
      <ProgressBar
        label={
          value === 100 ? 'Evidence collection complete' : 'Collecting evidence from WS-ATH-114'
        }
        value={value}
        intent={value === 100 ? 'success' : 'function'}
        showValue
      />
      <span className="muted">
        {Math.round(value * 12.84).toLocaleString()} of 1,284 events collected
      </span>
    </div>
  );
}
export const LiveCollection: Story = { render: () => <CollectionDemo /> };
