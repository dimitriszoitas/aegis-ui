import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConfidenceBadge } from './confidence-badge';
const meta = {
  title: 'Components/AI/ConfidenceBadge',
  component: ConfidenceBadge,
  tags: ['autodocs'],
  args: { confidence: 'high' },
} satisfies Meta<typeof ConfidenceBadge>;
export default meta;
export const Levels: StoryObj<typeof meta> = {
  render: () => (
    <div className="stack" style={{ maxWidth: 560 }}>
      {(['high', 'medium', 'low'] as const).map((confidence, index) => (
        <div className="between" key={confidence}>
          <span>
            {
              [
                'Office parent and encoded command observed',
                'Sign-in location requires verification',
                'Insufficient network context',
              ][index]
            }
          </span>
          <ConfidenceBadge confidence={confidence} />
        </div>
      ))}
    </div>
  ),
};
