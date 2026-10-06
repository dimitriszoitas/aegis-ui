import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { rules } from '@/sample-data';
import { YamlPresenter } from './yaml-presenter';

const meta = {
  title: 'Components/Code/YamlPresenter',
  component: YamlPresenter,
  args: { value: rules[2].yaml, filename: 'encoded-powershell.yml', maxHeight: 440, onCopy: fn() },
} satisfies Meta<typeof YamlPresenter>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const HighlightedRule: Story = {
  args: {
    highlightedLines: [
      { from: 10, to: 14 },
      { from: 18, to: 19 },
    ],
  },
};
export const LongFilename: Story = {
  args: {
    filename:
      'detections/windows/production/encoded-powershell-execution-and-network-correlation.yml',
    maxHeight: 280,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 480 }}>
        <Story />
      </div>
    ),
  ],
};
export const Empty: Story = { args: { value: '', filename: 'new-rule.yml', minHeight: 120 } };
export const FoldingAndReadOnly: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Fold all YAML sections' }));
    const folded = await canvas.findAllByRole('button', { name: 'Expand folded code' });
    await userEvent.click(folded[0]);
    await expect(
      canvas.getByRole('textbox', { name: 'encoded-powershell.yml source' }),
    ).toHaveFocus();
    await userEvent.click(canvas.getByRole('button', { name: 'Unfold all YAML sections' }));
    await waitFor(() =>
      expect(canvas.queryAllByRole('button', { name: 'Expand folded code' })).toHaveLength(0),
    );
    const editor = canvas.getByRole('textbox', { name: 'encoded-powershell.yml source' });
    await userEvent.click(editor);
    await userEvent.keyboard('accidental edit');
    await expect(editor).not.toHaveTextContent('accidental edit');
  },
};
