import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiVerdictCell } from './data-grid-cells';
export default {
  title: 'Components/Data grid/AI verdict cell',
  component: AiVerdictCell,
  tags: ['autodocs'],
  args: { verdict: 'Likely malicious', confidence: 0.96 },
} satisfies Meta<typeof AiVerdictCell>;
export const ConfidenceLevels: StoryObj<typeof AiVerdictCell> = {
  render: () => (
    <div className="stack" style={{ alignItems: 'flex-start' }}>
      <AiVerdictCell verdict="Likely malicious" confidence={0.96} />
      <AiVerdictCell verdict="Needs context" confidence={0.67} />
      <AiVerdictCell verdict="Insufficient evidence" confidence={0.32} />
    </div>
  ),
};
