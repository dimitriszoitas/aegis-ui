import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { rules, alerts } from '@/sample-data';
import { Button } from '@/components/button';
import { CodeEditor, type CodeEditorHandle, type CodeEditorProps } from './code-editor';

const meta = {
  title: 'Components/Code/CodeEditor',
  component: CodeEditor,
  args: {
    defaultValue: rules[2].yaml,
    language: 'yaml',
    label: 'Detection rule editor',
    onValueChange: fn(),
    minHeight: 160,
    maxHeight: 420,
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CodeEditor>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Json: Story = {
  args: {
    language: 'json',
    label: 'Event JSON editor',
    defaultValue: JSON.stringify(alerts[0].events[0].payload, null, 2),
  },
};
export const ReadOnly: Story = { args: { readOnly: true, label: 'Read-only detection rule' } };
export const Empty: Story = {
  args: { defaultValue: '', placeholder: '# Write a detection rule…' },
};
export const HighlightedLines: Story = {
  args: { readOnly: true, highlightedLines: [{ from: 9, to: 15 }] },
};
export const WrappedAndMinimal: Story = {
  args: {
    wrapLines: true,
    folding: false,
    lineNumbers: false,
    statusBar: false,
    defaultValue:
      'description: Detects suspicious command execution across monitored endpoints and correlates process ancestry with network activity and identity signals to help analysts prioritize their investigation.',
    minHeight: 100,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 440 }}>
        <Story />
      </div>
    ),
  ],
};
export const CustomStatus: Story = { args: { statusBar: <span>DET-0114 · Unsaved changes</span> } };

function EditableExample(args: CodeEditorProps) {
  const [value, setValue] = useState('title: Encoded PowerShell execution\nlevel: high\n');
  return (
    <div className="stack">
      <CodeEditor
        {...args}
        value={value}
        label="Editable YAML"
        onValueChange={(next) => {
          setValue(next);
          args.onValueChange?.(next);
        }}
      />
      <Button>Save rule</Button>
      <output className="sr-only" aria-label="Current rule">
        {value}
      </output>
    </div>
  );
}
export const KeyboardEditing: Story = {
  render: (args) => <EditableExample {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('textbox', { name: 'Editable YAML' }));
    await userEvent.keyboard('{End}{Enter}# Reviewed');
    await waitFor(() =>
      expect(args.onValueChange).toHaveBeenCalledWith(expect.stringContaining('# Reviewed')),
    );
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Save rule' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(canvas.getByRole('textbox', { name: 'Editable YAML' })).toHaveFocus();
  },
};
function FoldingExample(args: CodeEditorProps) {
  const editor = useRef<CodeEditorHandle>(null);
  return (
    <div className="stack">
      <div className="row">
        <Button onClick={() => editor.current?.foldAll()}>Fold sections</Button>
        <Button onClick={() => editor.current?.unfoldAll()}>Expand sections</Button>
      </div>
      <CodeEditor {...args} ref={editor} readOnly />
    </div>
  );
}
export const Folding: Story = {
  render: (args) => <FoldingExample {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Fold sections' }));
    await expect(
      await canvas.findAllByRole('button', { name: 'Expand folded code' }),
    ).not.toHaveLength(0);
    await userEvent.click(canvas.getByRole('button', { name: 'Expand sections' }));
    await waitFor(() =>
      expect(canvas.queryAllByRole('button', { name: 'Expand folded code' })).toHaveLength(0),
    );
  },
};
