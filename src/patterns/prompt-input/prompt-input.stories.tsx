import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { alerts } from '@/sample-data';
import type { AiContextItem } from '@/lib/ai';
import { PromptInput } from './prompt-input';
const context: AiContextItem[] = alerts
  .slice(0, 3)
  .map((alert) => ({ id: alert.id, label: alert.id, description: alert.title, kind: 'alert' }));
function Demo({ fail = false }: { fail?: boolean }) {
  const [sent, setSent] = useState('');
  return (
    <div style={{ maxWidth: 560 }}>
      <PromptInput
        availableContext={context}
        onSend={(prompt, attached) => {
          if (fail)
            throw new Error('The assistant is temporarily unavailable. Your draft is preserved.');
          setSent(`${prompt} · ${attached.length} records attached`);
        }}
      />
      <p role="status">{sent}</p>
    </div>
  );
}
const meta = {
  title: 'Patterns/AI/PromptInput',
  component: PromptInput,
  tags: ['autodocs'],
  args: { availableContext: context, onSend: () => {} },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560, padding: 'var(--space-4)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PromptInput>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { render: () => <Demo /> };
export const AttachedContext: Story = {
  args: { context, defaultValue: 'Summarize these alerts and suggest what to inspect next.' },
};
export const Generating: Story = {
  args: {
    generating: true,
    onStop: () => {},
    context,
    defaultValue: 'Draft a follow-up while the response streams…',
  },
};
export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Waiting for investigation permissions.' },
};
export const FailedSend: Story = { render: () => <Demo fail /> };
export const KeyboardComposer: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Message to Aegis AI' });
    await userEvent.click(input);
    await userEvent.keyboard('/');
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.type(page.getByRole('combobox', { name: 'Prompt commands' }), 'summarize');
    await userEvent.keyboard('{Enter}');
    await expect(input).toHaveValue('Summarize the attached alerts for an analyst handoff.');
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}Include record identifiers.');
    await expect(input).toHaveValue(
      'Summarize the attached alerts for an analyst handoff.\nInclude record identifiers.',
    );
    await userEvent.keyboard('{Enter}');
    await expect(input).toHaveValue('');
    await expect(canvas.getByRole('status')).toHaveTextContent('Include record identifiers.');
  },
};
export const OpenCommands: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Prompt commands' }));
  },
};
export const OpenAttachments: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Attach context' }));
  },
};
