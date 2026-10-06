import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AiCard, AiLabel, AiFeedback, type AiFeedbackValue } from './ai-card';
import { StreamingSkeleton } from '@/components/streaming-skeleton';
const meta = {
  title: 'Components/AI/AiCard',
  component: AiCard,
  subcomponents: { AiLabel, AiFeedback },
  tags: ['autodocs'],
} satisfies Meta<typeof AiCard>;
export default meta;
function ReviewCard() {
  const [feedback, setFeedback] = useState<AiFeedbackValue>(null);
  const [revision, setRevision] = useState(1);
  return (
    <div className="stack" style={{ maxWidth: 640 }}>
      <AiCard
        title="Review the parent process before closing this alert"
        confidence="high"
        provenance={`ALR-1049 · EDR process evidence · Summary ${revision}`}
        feedback={feedback}
        onFeedback={setFeedback}
        onRegenerate={() => {
          setRevision((value) => value + 1);
          setFeedback(null);
        }}
      >
        <p>
          The encoded PowerShell process has an Office parent. Verify the command line and the
          originating document before deciding whether this activity is expected.
        </p>
        <p>
          <strong>Suggested next step:</strong> preserve the process timeline and assign an endpoint
          investigation.
        </p>
      </AiCard>
      <p role="status" className="muted">
        {feedback === null
          ? 'No analyst feedback yet.'
          : feedback === 'positive'
            ? 'Marked as helpful.'
            : 'Marked as unhelpful.'}
      </p>
    </div>
  );
}
export const AnalystReview: StoryObj<typeof meta> = {
  render: () => <ReviewCard />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Helpful response' }));
    await expect(canvas.getByRole('button', { name: 'Helpful response' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Regenerate response' }));
    await expect(canvas.getByText(/Summary 2/)).toBeVisible();
  },
};
export const Pending: StoryObj<typeof meta> = {
  render: () => (
    <AiCard title="Preparing a triage summary" loading provenance="2 selected alerts · Last 24h">
      <StreamingSkeleton lines={4} />
    </AiCard>
  ),
};
export const ConfidenceLevels: StoryObj<typeof meta> = {
  render: () => (
    <div className="story-grid">
      {(['high', 'medium', 'low'] as const).map((confidence, index) => (
        <AiCard
          key={confidence}
          title={
            ['Process chain confirmed', 'Location needs verification', 'More telemetry is needed'][
              index
            ]
          }
          confidence={confidence}
          provenance={
            [
              'EDR event payload · ALR-1049',
              'Identity sign-in record · ALR-1048',
              'Firewall connection record',
            ][index]
          }
        >
          {
            [
              'The process payload includes an Office parent and an encoded PowerShell command. Confirm whether the execution was approved.',
              'The sign-in location differs from the expected pattern. VPN use and travel remain unverified.',
              'The connection record does not establish intent. Correlate host activity before assigning a verdict.',
            ][index]
          }
        </AiCard>
      ))}
    </div>
  ),
};
