import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResizablePanels, ResizablePanel, ResizeHandle } from './resizable-panels';
import { SeverityBadge } from '@/components/severity-badge';
const meta = {
  title: 'Components/Layout/ResizablePanels',
  component: ResizablePanels,
  tags: ['autodocs'],
  args: { orientation: 'horizontal' },
  render: (args) => (
    <ResizablePanels {...args} style={{ height: 420 }}>
      <ResizablePanel id="alerts" defaultSize="65%" minSize="25%">
        <div className="surface" style={{ height: '100%' }}>
          <h3>Alert queue</h3>
          <p className="muted">
            Drag the divider or focus it and use the arrow keys to resize the investigation
            workspace.
          </p>
          <div className="row">
            <SeverityBadge severity="high" />
            Encoded PowerShell on WS-ATH-114
          </div>
        </div>
      </ResizablePanel>
      <ResizeHandle label="Resize alert queue and evidence" />
      <ResizablePanel id="evidence" defaultSize="35%" minSize="20%">
        <div className="surface" style={{ height: '100%' }}>
          <h3>Evidence</h3>
          <p className="muted">Six related process events</p>
          <code>WINWORD.EXE → powershell.exe</code>
        </div>
      </ResizablePanel>
    </ResizablePanels>
  ),
} satisfies Meta<typeof ResizablePanels>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Horizontal: Story = {};
export const Vertical: Story = { args: { orientation: 'vertical' } };
export const Disabled: Story = { args: { disabled: true } };
export const Collapsible: Story = {
  render: () => (
    <ResizablePanels style={{ height: 320 }}>
      <ResizablePanel id="assistant" defaultSize="30%" minSize="20%" collapsible collapsedSize="0%">
        <div className="surface" style={{ height: '100%' }}>
          <h3>Aegis assistant</h3>
          <p className="muted">Review the selected alert evidence.</p>
        </div>
      </ResizablePanel>
      <ResizeHandle label="Resize or collapse assistant" />
      <ResizablePanel id="main" defaultSize="70%" minSize="30%">
        <div className="surface" style={{ height: '100%' }}>
          <h3>Investigation</h3>
          <p>Press Enter on the divider to collapse or restore the assistant.</p>
        </div>
      </ResizablePanel>
    </ResizablePanels>
  ),
};
