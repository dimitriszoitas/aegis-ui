import type { Meta, StoryObj } from '@storybook/react-vite';
import { SeverityCell } from './data-grid-cells';
export default {
  title: 'Components/Data grid/Severity cell',
  component: SeverityCell,
  tags: ['autodocs'],
  args: { severity: 'critical' },
} satisfies Meta<typeof SeverityCell>;
export const Matrix: StoryObj<typeof SeverityCell> = {
  render: () => (
    <div className="stack">
      {[false, true].map((compact) => (
        <div className="row" key={String(compact)}>
          {(['critical', 'high', 'medium', 'low', 'info'] as const).map((severity) => (
            <SeverityCell severity={severity} compact={compact} key={severity} />
          ))}
        </div>
      ))}
    </div>
  ),
};
