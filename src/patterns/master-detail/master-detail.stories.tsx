import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Button } from '@/components/button';
import { DescriptionList } from '@/components/description-list';
import { MasterDetail, type MasterDetailProps } from './master-detail';
const meta = {
  title: 'Patterns/MasterDetail',
  component: MasterDetail,
  tags: ['autodocs'],
  args: { open: false, onClose: () => {}, list: null },
} satisfies Meta<typeof MasterDetail>;
export default meta;
function CustomerWorkspaceExample(args: MasterDetailProps) {
  const [selected, setSelected] = useState<string>();
  return (
    <MasterDetail
      {...args}
      open={!!selected}
      detailTitle={selected}
      onClose={() => setSelected(undefined)}
      list={
        <div className="stack" style={{ padding: 16 }}>
          {['Atlas Commerce', 'Meridian Health', 'Northwind Studio'].map((name) => (
            <Button
              key={name}
              emphasis={selected === name ? 'secondary' : 'ghost'}
              aria-pressed={selected === name}
              onClick={() => setSelected(name)}
            >
              {name}
            </Button>
          ))}
        </div>
      }
      detail={
        <DescriptionList
          items={[
            { id: 'plan', label: 'Plan', value: 'Business' },
            { id: 'owner', label: 'Account owner', value: 'Maya Chen' },
            { id: 'status', label: 'Status', value: 'Active' },
          ]}
        />
      }
    />
  );
}
export const CustomerWorkspace: StoryObj<typeof meta> = {
  render: (args) => <CustomerWorkspaceExample {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Atlas Commerce' });
    await userEvent.click(trigger);
    await expect(canvas.getByRole('heading', { name: 'Atlas Commerce' })).toHaveFocus();
    await userEvent.click(canvas.getByRole('button', { name: 'Close record details' }));
    await expect(trigger).toHaveFocus();
  },
};

export const NarrowContainer: StoryObj<typeof meta> = {
  render: (args) => (
    <div style={{ width: 340, maxWidth: '100%' }}>
      <CustomerWorkspaceExample {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Atlas Commerce' });
    await userEvent.click(trigger);
    await expect(trigger).not.toBeVisible();
    await expect(canvas.getByRole('heading', { name: 'Atlas Commerce' })).toHaveFocus();
    const panel = canvasElement.querySelector('.aegis-master-detail')!;
    const close = canvas.getByRole('button', { name: 'Close record details' });
    await expect(close.getBoundingClientRect().right).toBeLessThanOrEqual(
      panel.getBoundingClientRect().right,
    );
    await expect(panel.scrollWidth).toBeLessThanOrEqual(panel.clientWidth);
    await userEvent.click(close);
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveFocus();
  },
};
