import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { rules } from '@/sample-data';
import { Button } from '@/components/button';
import { DiffView, type DiffViewProps } from './diff-view';

const original = rules[2].yaml;
const proposed = original
  .replace('status: stable', 'status: test')
  .replace('level: high', 'level: critical')
  .replace(
    '  condition: all of selection_* and not filter_automation',
    '  filter_trusted_runner:\n    ParentImage|endswith: \\trusted-runner.exe\n  condition: all of selection_* and not (filter_automation or filter_trusted_runner)',
  );
const meta = {
  title: 'Components/Code/DiffView',
  component: DiffView,
  args: {
    original,
    modified: proposed,
    language: 'yaml',
    label: 'Encoded PowerShell rule changes',
    originalLabel: 'Current rule',
    modifiedLabel: 'Proposed rule',
    maxHeight: 440,
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DiffView>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Split: Story = {};
export const Unified: Story = { args: { defaultMode: 'unified' } };
export const NoChanges: Story = { args: { modified: original } };
export const Empty: Story = { args: { original: '', modified: '', minHeight: 120 } };
export const AddedFile: Story = {
  args: { original: '', defaultMode: 'unified', originalLabel: 'No previous rule' },
};
export const RemovedFile: Story = {
  args: { modified: '', defaultMode: 'unified', modifiedLabel: 'Rule removed' },
};
export const CollapsedContext: Story = {
  args: {
    collapseUnchanged: true,
    defaultMode: 'unified',
    modified: original.replace('level: high', 'level: critical'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const collapsed = await canvas.findAllByRole('button', { name: /Expand .* unchanged lines/ });
    const first = collapsed[0];
    first.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(first).not.toBeInTheDocument());
    await expect(canvas.getByRole('textbox', { name: /unified comparison/ })).toHaveFocus();
  },
};
export const Json: Story = {
  args: {
    language: 'json',
    original: '{\n  "severity": "high",\n  "enabled": true,\n  "threshold": 5\n}',
    modified:
      '{\n  "severity": "critical",\n  "enabled": true,\n  "threshold": 3,\n  "window": "15m"\n}',
    label: 'Detection configuration changes',
    minHeight: 180,
  },
};
export const LayoutAndNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Unified view' }));
    await expect(canvas.getByRole('button', { name: 'Unified view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Next change' }));
    await expect(canvas.getByRole('textbox', { name: /unified comparison/ })).toHaveFocus();
    await userEvent.click(canvas.getByRole('button', { name: 'Split view' }));
    await expect(canvas.getByRole('textbox', { name: /Current rule$/ })).toBeVisible();
    await expect(canvas.getByRole('textbox', { name: /Proposed rule$/ })).toBeVisible();
  },
};
function EditingExample(args: DiffViewProps) {
  const [value, setValue] = useState(args.modified);
  return (
    <div className="stack">
      <DiffView
        {...args}
        modified={value}
        onModifiedChange={(next) => {
          setValue(next);
          args.onModifiedChange?.(next);
        }}
      />
      <Button>Save proposed rule</Button>
    </div>
  );
}
export const EditableProposal: Story = {
  args: {
    readOnly: false,
    onModifiedChange: fn(),
    original: 'level: high\n',
    modified: 'level: critical\n',
    minHeight: 140,
  },
  render: (args) => <EditingExample {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('textbox', { name: /Proposed rule$/ }));
    await userEvent.keyboard('{End}{Enter}# Reviewed');
    await waitFor(() =>
      expect(args.onModifiedChange).toHaveBeenCalledWith(expect.stringContaining('# Reviewed')),
    );
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Save proposed rule' })).toHaveFocus();
  },
};
