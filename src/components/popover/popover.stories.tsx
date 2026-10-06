import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Popover, PopoverClose } from './popover';

const meta = {
  title: 'Components/Overlays/Popover',
  component: Popover,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    trigger: <button className="aegis-popover-demo-trigger">Evidence details</button>,
    title: 'Identity correlation',
    description: 'Signals observed during the selected investigation window.',
    children: (
      <p>37 failed sign-ins were followed by a successful authentication from a new network.</p>
    ),
    showClose: true,
  },
} satisfies Meta<typeof Popover>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const OpenEvidence: Story = { args: { defaultOpen: true } };
export const PlacementMatrix: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <Popover
          key={side}
          {...args}
          side={side}
          trigger={<button className="aegis-popover-demo-trigger">{side} evidence</button>}
        />
      ))}
    </div>
  ),
};
function ControlledExample() {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('Confirm whether the new device belongs to k.nakamura.');
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={<button className="aegis-popover-demo-trigger">Add investigation note</button>}
      title="Investigation note"
      showClose
    >
      <label htmlFor="popover-note">Analyst note</label>
      <textarea
        id="popover-note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        style={{
          width: '100%',
          marginBlock: 'var(--space-3)',
          background: 'var(--color-bg-surface)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-2)',
        }}
      />
      <PopoverClose className="aegis-popover-demo-trigger">Save note</PopoverClose>
    </Popover>
  );
}
export const ControlledForm: Story = { render: () => <ControlledExample /> };
