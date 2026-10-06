import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConsoleOverview } from './console-views';
import { ConsoleViewStoryFrame } from './console-view-story-helpers';
import { Banner } from '@/components/banner';
import { alerts, referenceTime } from '@/sample-data';
const meta = {
  title: 'Patterns/Console views/Overview',
  component: ConsoleOverview,
  tags: ['autodocs'],
  args: { alerts, now: referenceTime, onOpenAlert: () => undefined },
} satisfies Meta<typeof ConsoleOverview>;
export default meta;
function OverviewDemo() {
  const [queueRequested, setQueueRequested] = useState(false);
  return (
    <ConsoleViewStoryFrame>
      {(open) => (
        <div className="stack">
          <ConsoleOverview
            alerts={alerts}
            now={referenceTime}
            onOpenAlert={open}
            onShowAlerts={() => setQueueRequested(true)}
          />
          {queueRequested && (
            <Banner title="Alert queue selected" onDismiss={() => setQueueRequested(false)}>
              {alerts.length} alert records are available in the main console queue.
            </Banner>
          )}
        </div>
      )}
    </ConsoleViewStoryFrame>
  );
}
export const CurrentScope: StoryObj<typeof meta> = { render: () => <OverviewDemo /> };
export const EmptyScope: StoryObj<typeof meta> = { args: { alerts: [] } };
