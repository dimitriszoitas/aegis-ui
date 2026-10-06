import { useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '@/components/button';
import { SiemConsole } from '@/patterns/siem-console';
import { BottomSheet, type BottomSheetProps } from './bottom-sheet';

function Workspace({ children, ...args }: BottomSheetProps) {
  const [open, setOpen] = useState(true);
  return (
    <div className="aegis-bottom-sheet-demo">
      <main className="aegis-bottom-sheet-demo-content">
        <h2>Investigation workspace</h2>
        <p>The panel occupies the workspace column and preserves room above it.</p>
        <Button onClick={() => setOpen(true)}>Open bottom panel</Button>
      </main>
      <BottomSheet {...args} open={open} onOpenChange={setOpen}>
        {children}
      </BottomSheet>
    </div>
  );
}
const meta = {
  title: 'Components/Overlays/BottomSheet',
  component: BottomSheet,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, height: 600 },
      description: {
        component:
          'A nonmodal, vertically resizable panel inside a bounded flex-column workspace. It fills the area between navigation and the AI rail. Floating uses an inset and rounded corners; Fixed sits flush. Drag the top edge, or focus it and use Up/Down (Shift for larger steps), Home and End. Optional header actions and footer stay visible while the body scrolls. Escape closes without trapping workspace focus.',
      },
    },
  },
  args: {
    title: 'Evidence events',
    description: 'ALR-1082 · Unusual cloud storage upload',
    defaultOpen: true,
    children: (
      <div className="stack">
        {Array.from({ length: 16 }, (_, i) => (
          <p key={i}>
            <code>10:42:{String(i * 3).padStart(2, '0')}</code> · Outbound connection · SRV-PROD-09
          </p>
        ))}
      </div>
    ),
  },
  render: (args) => <Workspace {...args} />,
} satisfies Meta<typeof BottomSheet>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const HeaderAndFooterActions: Story = {
  args: {
    headerActions: (
      <Button emphasis="tertiary" size="sm">
        Export
      </Button>
    ),
    footer: (
      <>
        <Button emphasis="ghost" size="sm">
          Copy query
        </Button>
        <Button intent="function" size="sm">
          Open investigation
        </Button>
      </>
    ),
  },
};
export const FixedWorkspace: Story = {
  render: () => (
    <div style={{ '--console-height': '600px' } as CSSProperties}>
      <SiemConsole layoutTheme="fixed" defaultBottomOpen defaultNavCollapsed />
    </div>
  ),
};
export const FloatingWithAi: Story = {
  render: () => (
    <div style={{ '--console-height': '680px' } as CSSProperties}>
      <SiemConsole layoutTheme="floating" defaultBottomOpen defaultNavCollapsed defaultAiOpen />
    </div>
  ),
  parameters: { docs: { story: { height: 680 } } },
};
export const KeyboardResize: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const edge = canvas.getByRole('separator', { name: 'Resize bottom panel' });
    await waitFor(() => expect(edge).toHaveAttribute('aria-valuenow', '280'));
    edge.focus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(edge).toHaveAttribute('aria-valuenow', '300');
    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}');
    await expect(edge).toHaveAttribute('aria-valuenow', '260');
    await userEvent.keyboard('{Home}');
    await expect(edge).toHaveAttribute('aria-valuenow', '160');
    await userEvent.keyboard('{End}');
    await expect(edge).toHaveAttribute('aria-valuenow', edge.getAttribute('aria-valuemax'));
    await userEvent.keyboard('{Escape}');
    await expect(
      canvas.queryByRole('separator', { name: 'Resize bottom panel' }),
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Open bottom panel' }));
    await expect(canvas.getByRole('separator', { name: 'Resize bottom panel' })).toBeVisible();
    canvas.getByRole('separator', { name: 'Resize bottom panel' }).focus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Open bottom panel' })).toHaveFocus(),
    );
  },
};
