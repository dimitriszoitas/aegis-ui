import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Banner, Callout } from './banner';
import { Button } from '@/components/button';
const meta = {
  title: 'Components/Feedback/Banner',
  component: Banner,
  subcomponents: { Callout },
  tags: ['autodocs'],
  args: {
    title: 'New telemetry source connected',
    children: 'Microsoft Entra ID events are now available in your investigations.',
  },
} satisfies Meta<typeof Banner>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Intents: Story = {
  render: () => (
    <div className="stack" style={{ maxWidth: 840 }}>
      <Banner intent="info" title="A new source is ready">
        Microsoft Entra ID events are now searchable. Historical ingestion may take a few minutes.
      </Banner>
      <Banner intent="success" title="Detection rule enabled">
        Impossible travel is now monitoring 4,812 identities across your environment.
      </Banner>
      <Banner intent="warning" title="Event ingestion is delayed">
        The firewall connector is 12 minutes behind. Recent alerts may be incomplete.
      </Banner>
      <Banner intent="destroy" title="Endpoint isolation failed">
        WS-ATH-114 is offline. Reconnect the agent before retrying containment.
      </Banner>
      <Banner intent="ai" title="AI generated investigation summary">
        Review the supporting evidence before changing the alert verdict or isolating an endpoint.
      </Banner>
    </div>
  ),
};
function DismissibleDemo() {
  const [visible, setVisible] = useState(true);
  const [retried, setRetried] = useState(false);
  return (
    <div style={{ maxWidth: 800 }}>
      {visible ? (
        <Banner
          intent={retried ? 'success' : 'warning'}
          title={retried ? 'Connection restored' : 'CrowdStrike connector needs attention'}
          action={
            !retried && (
              <Button size="sm" emphasis="soft" onClick={() => setRetried(true)}>
                Retry connection
              </Button>
            )
          }
          onDismiss={() => setVisible(false)}
        >
          {retried
            ? 'Event ingestion has resumed. The backlog will be processed automatically.'
            : 'The last synchronization failed 8 minutes ago. Existing event data is still available.'}
        </Banner>
      ) : (
        <Button
          emphasis="ghost"
          onClick={() => {
            setVisible(true);
            setRetried(false);
          }}
        >
          Show connector notification
        </Button>
      )}
    </div>
  );
}
export const WithActionsAndDismiss: Story = { render: () => <DismissibleDemo /> };
export const InlineCallout: Story = {
  render: () => (
    <Callout intent="ai" title="Analyst review required" style={{ maxWidth: 620 }}>
      This proposed Sigma rule change reduces false positives for approved automation accounts.
      Verify the exclusions before enabling the rule.
    </Callout>
  ),
};
