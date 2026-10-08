import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { DetectionRuleWizard } from './detection-rule-wizard';
const meta = {
  title: 'Patterns/Detection rule wizard',
  component: DetectionRuleWizard,
  tags: ['autodocs'],
  args: { onCreate: fn(), onCancel: fn() },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 1040 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DetectionRuleWizard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Horizontal: Story = {};
export const Vertical: Story = { args: { orientation: 'vertical' } };
export const Logic: Story = { args: { defaultStep: 1 } };
export const VerticalLogic: Story = { args: { defaultStep: 1, orientation: 'vertical' } };
export const TestReplay: Story = {
  args: { defaultStep: 2 },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Run sample replay' }));
    await waitFor(() =>
      expect(c.getByRole('status')).toHaveTextContent('Replay complete: 5 matches'),
    );
  },
};
export const Review: Story = {
  args: { defaultStep: 2 },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Run sample replay' }));
    await waitFor(() => expect(c.getByRole('status')).toHaveTextContent('Replay complete'));
    await userEvent.click(c.getByRole('button', { name: 'Continue' }));
    await expect(c.getByRole('heading', { name: 'Review and enable' })).toBeVisible();
  },
};
export const ValidationGate: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.clear(c.getByRole('textbox', { name: /Rule name/ }));
    await userEvent.click(c.getByRole('button', { name: 'Continue' }));
    await expect(c.getByRole('heading', { name: 'Define' })).toBeVisible();
    await expect(c.getByText('Use at least 8 characters.')).toBeVisible();
  },
};
export const CompleteVerticalFlow: Story = {
  args: { orientation: 'vertical' },
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Continue' }));
    await userEvent.click(c.getByRole('button', { name: 'Suggest Office parent filter' }));
    await userEvent.click(await c.findByRole('button', { name: 'Approve changes' }));
    await waitFor(() => expect(c.getByText(/Approved by Elena Vasquez/)).toBeVisible());
    await userEvent.click(c.getByRole('button', { name: 'Continue' }));
    await userEvent.click(c.getByRole('button', { name: 'Run sample replay' }));
    await waitFor(() =>
      expect(c.getByRole('status')).toHaveTextContent('Replay complete: 3 matches'),
    );
    await userEvent.click(c.getByRole('button', { name: 'Continue' }));
    await userEvent.click(c.getByRole('button', { name: 'Create and enable rule' }));
    await expect(
      c.getByText('Confirm that you reviewed the rule and replay results.'),
    ).toBeVisible();
    await userEvent.click(
      c.getByRole('checkbox', { name: 'I reviewed the detection logic and sample replay results' }),
    );
    await userEvent.click(c.getByRole('button', { name: 'Create and enable rule' }));
    await waitFor(() =>
      expect(args.onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          yaml: expect.stringContaining('selection_parent:'),
        }),
      ),
    );
    await expect(c.getByRole('heading', { name: 'Detection rule enabled' })).toBeVisible();
  },
};
export const FinishFailure: Story = {
  args: {
    defaultStep: 2,
    onCreate: fn(async () => {
      throw new Error('The local workspace could not save this rule. Try again.');
    }),
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Run sample replay' }));
    await waitFor(() => expect(c.getByRole('status')).toHaveTextContent('Replay complete'));
    await userEvent.click(c.getByRole('button', { name: 'Continue' }));
    await userEvent.click(
      c.getByRole('checkbox', { name: 'I reviewed the detection logic and sample replay results' }),
    );
    await userEvent.click(c.getByRole('button', { name: 'Create and enable rule' }));
    await expect(
      await c.findByText('The local workspace could not save this rule. Try again.'),
    ).toBeVisible();
  },
};
