import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Popover, PopoverClose } from './popover';

const meta = {
  title: 'Components/Overlays/Popover',
  component: Popover,
  subcomponents: { PopoverClose },
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '`PopoverClose` closes its nearest parent popover and inherits native button props from Radix. It must be rendered inside that parent.\n\n| PopoverClose prop | Type | Behavior |\n| --- | --- | --- |\n| asChild | `boolean` | Uses its single child as the close control instead of adding a button |\n| children | `ReactNode` | Button content or the single child when asChild is enabled |\n| disabled | `boolean` | Disables the close control |\n| onClick | `MouseEventHandler<HTMLButtonElement>` | Runs alongside the close behavior |\n| className / style | `string` / `CSSProperties` | Native presentation props |\n| aria-label | `string` | Accessible name for an icon-only control |\n',
      },
      story: { inline: false, height: 360 },
    },
  },
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
