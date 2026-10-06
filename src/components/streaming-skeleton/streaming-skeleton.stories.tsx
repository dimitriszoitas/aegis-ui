import type { Meta, StoryObj } from '@storybook/react-vite';
import { StreamingSkeleton } from './streaming-skeleton';
const meta = {
  title: 'Components/AI/StreamingSkeleton',
  component: StreamingSkeleton,
  tags: ['autodocs'],
} satisfies Meta<typeof StreamingSkeleton>;
export default meta;
export const PendingBlocks: StoryObj<typeof meta> = {
  render: () => (
    <div className="story-grid">
      <div className="stack">
        <h3>Investigation summary</h3>
        <StreamingSkeleton lines={4} />
      </div>
      <StreamingSkeleton variant="card" lines={5} label="Preparing a detection review" />
    </div>
  ),
};
