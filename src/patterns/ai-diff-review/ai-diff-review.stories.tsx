import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '@/components/button';
import { referenceTime, rules } from '@/sample-data';
import { AiDiffReview, type AiDiffReviewProps } from './ai-diff-review';

const original = rules[2].yaml;
const proposed = original.replace(
  "    ParentImage|endswith: '\\NorthstarAgent.exe'",
  "    ParentImage|endswith:\n      - '\\NorthstarAgent.exe'\n      - '\\ApprovedRunner.exe'",
);
const meta = {
  title: 'Patterns/AI/AiDiffReview',
  component: AiDiffReview,
  args: {
    original,
    proposed,
    ruleName: 'Encoded PowerShell execution',
    summary:
      'Exclude the approved deployment runner from the parent-process condition. Encoded commands launched by other processes remain in scope.',
    provenance: 'Based on DET-0114 and 28 matching events in the last 24 hours.',
    reviewer: 'Maya Chen',
    confidence: 'high',
    now: referenceTime,
    onApprove: fn(),
    onReject: fn(),
    onStatusChange: fn(),
    maxHeight: 360,
  },
} satisfies Meta<typeof AiDiffReview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Pending: Story = {};
export const Unified: Story = { args: { defaultMode: 'unified' } };
export const Approved: Story = { args: { status: 'approved', reviewedAt: referenceTime } };
export const Rejected: Story = { args: { status: 'rejected', reviewedAt: referenceTime } };
export const NoChanges: Story = { args: { proposed: original } };
export const Disabled: Story = { args: { disabled: true } };
export const ApproveExplicitly: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(args.onApprove).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Approve changes' }));
    await expect(args.onApprove).toHaveBeenCalledTimes(1);
    await expect(args.onApprove).toHaveBeenCalledWith(
      proposed,
      expect.objectContaining({ original, proposed }),
    );
    const audit = await canvas.findByText(/Approved by Maya Chen/);
    await expect(audit).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Approve changes' })).not.toBeInTheDocument();
  },
};
export const RejectExplicitly: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Reject' }));
    await expect(args.onReject).toHaveBeenCalledTimes(1);
    await expect(args.onApprove).not.toHaveBeenCalled();
    await expect(await canvas.findByText('The current rule was kept unchanged.')).toBeVisible();
  },
};
export const ApprovalFailure: Story = {
  args: {
    onApprove: fn(async () => {
      throw new Error('The rule service is temporarily unavailable.');
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Approve changes' }));
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'Couldn’t approve this proposal',
    );
    await expect(canvas.getByRole('button', { name: 'Approve changes' })).toBeEnabled();
    await expect(canvas.queryByText(/Approved by/)).not.toBeInTheDocument();
  },
};
export const RejectionFailure: Story = {
  args: {
    onReject: fn(async () => {
      throw new Error('Your review could not be saved.');
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Reject' }));
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'Couldn’t reject this proposal',
    );
    await expect(canvas.getByRole('button', { name: 'Reject' })).toBeEnabled();
  },
};
function RevisionExample(args: AiDiffReviewProps) {
  const [value, setValue] = useState(args.proposed);
  return (
    <div className="stack">
      <Button
        onClick={() =>
          setValue((previous) =>
            previous === args.proposed ? `${args.proposed}\n# New proposal` : args.proposed,
          )
        }
      >
        Change proposal
      </Button>
      <AiDiffReview {...args} proposed={value} />
    </div>
  );
}
export const RevisionInvalidatesApproval: Story = {
  args: { status: 'approved' },
  render: (args) => <RevisionExample {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Approved by Maya Chen/)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Change proposal' }));
    await expect(canvas.queryByText(/Approved by Maya Chen/)).not.toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Approve changes' })).toBeEnabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Change proposal' }));
    await expect(canvas.queryByText(/Approved by Maya Chen/)).not.toBeInTheDocument();
  },
};
function PendingExample(args: AiDiffReviewProps) {
  const [value, setValue] = useState(args.proposed);
  const finish = useRef<(() => void) | null>(null);
  return (
    <div className="stack">
      <div className="row">
        <Button onClick={() => setValue(`${args.proposed}\n# Revised proposal`)}>
          Replace proposal
        </Button>
        <Button onClick={() => finish.current?.()}>Complete review request</Button>
      </div>
      <AiDiffReview
        {...args}
        proposed={value}
        onApprove={async (yaml, context) => {
          args.onApprove?.(yaml, context);
          await new Promise<void>((resolve) => {
            finish.current = resolve;
          });
        }}
      />
    </div>
  );
}
export const PendingAndStaleResponse: Story = {
  render: (args) => <PendingExample {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.dblClick(canvas.getByRole('button', { name: 'Approve changes' }));
    await expect(args.onApprove).toHaveBeenCalledTimes(1);
    await expect(canvas.getByRole('button', { name: 'Approving…' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Reject' })).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Replace proposal' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Complete review request' }));
    await expect(canvas.queryByText(/Approved by/)).not.toBeInTheDocument();
    await expect(args.onStatusChange).not.toHaveBeenCalledWith('approved');
    await userEvent.click(canvas.getByRole('button', { name: 'Approve changes' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Complete review request' }));
    await waitFor(() => expect(canvas.getByText(/Approved by Maya Chen/)).toBeVisible());
  },
};
