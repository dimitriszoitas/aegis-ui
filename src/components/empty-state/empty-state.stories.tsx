import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ShieldCheck, Plus, RotateCcw, X } from '@/components/icon';
import { EmptyState } from './empty-state';
import { Button } from '@/components/button';
import { Banner } from '@/components/banner';
const meta = {
  title: 'Components/Feedback/Empty state',
  component: EmptyState,
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;
function PresetDemo({ preset }: { preset: 'no-results' | 'no-data' | 'error' }) {
  const [resolved, setResolved] = useState(false);
  if (resolved)
    return (
      <div className="surface">
        <Banner
          intent="success"
          title={
            preset === 'no-results'
              ? 'Filters cleared'
              : preset === 'error'
                ? 'Connection restored'
                : 'Source setup started'
          }
        >
          {preset === 'no-results'
            ? 'Showing all 150 alerts from the last 24 hours.'
            : preset === 'error'
              ? 'Your alert queue is available again.'
              : 'Select Microsoft Entra ID, CrowdStrike, or your firewall to begin ingestion.'}
        </Banner>
        <Button
          emphasis="ghost"
          size="sm"
          onClick={() => setResolved(false)}
          style={{ marginTop: 'var(--space-3)' }}
        >
          Reset example
        </Button>
      </div>
    );
  return (
    <div className="surface">
      <EmptyState
        preset={preset}
        action={
          <Button intent="function" onClick={() => setResolved(true)}>
            {preset === 'no-results' ? (
              <>
                <X size={15} />
                Clear filters
              </>
            ) : preset === 'error' ? (
              <>
                <RotateCcw size={15} />
                Retry loading
              </>
            ) : (
              <>
                <Plus size={15} />
                Connect a source
              </>
            )}
          </Button>
        }
      />
    </div>
  );
}
export const Presets: Story = {
  render: () => (
    <div
      className="story-grid"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
    >
      {(['no-results', 'no-data', 'error'] as const).map((preset) => (
        <PresetDemo preset={preset} key={preset} />
      ))}
    </div>
  ),
};
export const Compact: Story = {
  render: () => (
    <div className="surface" style={{ maxWidth: 420 }}>
      <EmptyState
        compact
        icon={<ShieldCheck size={24} />}
        title="No critical alerts"
        description="No critical threats were detected in the selected time range. Keep monitoring as new events arrive."
      />
    </div>
  ),
};
export const CustomInvestigation: Story = {
  render: () => (
    <EmptyState
      icon={<ShieldCheck size={25} />}
      title="All caught up"
      description="You’ve reviewed every alert assigned to you. Your team is monitoring 3 connected event sources."
    />
  ),
};
