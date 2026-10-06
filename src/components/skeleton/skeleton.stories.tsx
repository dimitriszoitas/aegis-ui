import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './skeleton';
const meta = {
  title: 'Components/Feedback/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Presets: Story = {
  render: () => (
    <div className="story-grid" role="status" aria-label="Loading alert details">
      <section className="surface stack">
        <h3>Text</h3>
        <Skeleton />
        <Skeleton width="85%" />
        <Skeleton width="65%" />
      </section>
      <section className="surface stack">
        <h3>Block</h3>
        <Skeleton variant="block" />
      </section>
      <section className="surface stack">
        <h3>Avatar</h3>
        <div className="row">
          <Skeleton variant="avatar" />
          <div className="stack" style={{ flex: 1, gap: 'var(--space-2)' }}>
            <Skeleton width="65%" />
            <Skeleton width="40%" />
          </div>
        </div>
      </section>
    </div>
  ),
};
export const AlertTable: Story = {
  render: () => (
    <div
      className="surface"
      role="status"
      aria-label="Loading alerts"
      style={{ padding: 0, maxWidth: 920, overflow: 'hidden' }}
    >
      <div className="between" style={{ padding: 'var(--space-4)' }}>
        <h3 style={{ margin: 0 }}>Recent alerts</h3>
        <span className="muted">Fetching the last 24 hours</span>
      </div>
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} variant="table-row" columns={5} />
      ))}
    </div>
  ),
};
export const WithoutMotion: Story = {
  args: { variant: 'block', animate: false, width: 320, height: 120 },
};
