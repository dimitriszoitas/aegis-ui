import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Field } from '@/components/field';
import { Button } from '@/components/button';
import { AiInlineSuggestion, type AiInlineSuggestionProps } from './ai-inline-suggestion';

const fullName = 'Encoded PowerShell execution from untrusted parents';
function Demo(args: AiInlineSuggestionProps) {
  const [value, setValue] = useState(args.defaultValue ?? 'Encoded PowerShell');
  return (
    <div className="stack" style={{ maxWidth: 700 }}>
      <AiInlineSuggestion
        {...args}
        value={value}
        onValueChange={(next) => {
          setValue(next);
          args.onValueChange?.(next);
        }}
      />
      <Button>Next step</Button>
    </div>
  );
}
const meta = {
  title: 'Components/AI/AiInlineSuggestion',
  component: AiInlineSuggestion,
  args: {
    label: 'Rule name',
    defaultValue: 'Encoded PowerShell',
    suggestion: fullName,
    onValueChange: fn(),
    onAccept: fn(),
    onDismiss: fn(),
  },
  render: (args) => <Demo {...args} />,
} satisfies Meta<typeof AiInlineSuggestion>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const TextareaSuggestion: Story = {
  args: {
    as: 'textarea',
    label: 'Rule description',
    defaultValue: 'Detects encoded PowerShell ',
    suggestion:
      'Detects encoded PowerShell commands launched by untrusted parent processes, excluding approved endpoint automation.',
    rows: 3,
  },
};
export const Matrix: Story = {
  render: () => (
    <div className="story-grid">
      <AiInlineSuggestion
        label="Short rule name"
        size="sm"
        defaultValue="Encoded "
        suggestion={fullName}
      />
      <Field
        label="Required description"
        required
        helpText="Describe the behavior this rule detects."
      >
        <AiInlineSuggestion
          as="textarea"
          defaultValue="Detects "
          suggestion="Detects suspicious encoded PowerShell commands outside approved automation."
        />
      </Field>
      <Field
        label="Rule name needs review"
        error="Choose a name that identifies the observed behavior."
      >
        <AiInlineSuggestion defaultValue="Encoded " suggestion={fullName} />
      </Field>
      <AiInlineSuggestion
        label="Read-only rule"
        readOnly
        defaultValue="Encoded PowerShell"
        suggestion={fullName}
      />
      <Field label="Disabled rule name" disabled>
        <AiInlineSuggestion defaultValue="Encoded PowerShell" suggestion={fullName} />
      </Field>
      <AiInlineSuggestion
        label="Unrelated edit"
        defaultValue="Impossible travel"
        suggestion={fullName}
      />
    </div>
  ),
};
export const EmptyPrefix: Story = {
  args: { defaultValue: '', placeholder: 'Name this detection rule' },
};
export const LengthLimit: Story = { args: { maxLength: 24 } };
export const KeyboardAccept: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement),
      input = canvas.getByRole('textbox', { name: 'Rule name' });
    await userEvent.click(input);
    await userEvent.keyboard('{End}{Tab}');
    await expect(input).toHaveValue(fullName);
    await expect(args.onAccept).toHaveBeenCalledWith(fullName);
    await expect(input).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Next step' })).toHaveFocus();
  },
};
export const ButtonAccept: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Accept suggestion' }));
    await expect(canvas.getByRole('textbox', { name: 'Rule name' })).toHaveValue(fullName);
    await expect(args.onAccept).toHaveBeenCalledTimes(1);
  },
};
export const DismissAndKeepTyping: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement),
      input = canvas.getByRole('textbox', { name: 'Rule name' });
    await userEvent.click(input);
    await userEvent.keyboard('{End}{Escape}');
    await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    await expect(input).toHaveValue('Encoded PowerShell');
    await expect(
      canvas.queryByRole('button', { name: 'Accept suggestion' }),
    ).not.toBeInTheDocument();
    await userEvent.keyboard(' rule');
    await expect(input).toHaveValue('Encoded PowerShell rule');
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Next step' })).toHaveFocus();
  },
};
