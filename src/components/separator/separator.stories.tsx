import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator } from './separator';
const meta = {
  title: 'Components/Surfaces/Separator',
  component: Separator,
  tags: ['autodocs'],
} satisfies Meta<typeof Separator>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Orientations: Story = {
  render: () => (
    <div className="surface stack" style={{ maxWidth: 580 }}>
      <div>
        <h3>Authentication activity</h3>
        <p className="muted" style={{ margin: 0 }}>
          Identity telemetry from Microsoft Entra ID
        </p>
      </div>
      <Separator decorative={false} />
      <div className="row" style={{ gap: 'var(--space-4)' }}>
        <span>24 alerts</span>
        <Separator orientation="vertical" decorative={false} />
        <span>6 identities</span>
        <Separator orientation="vertical" decorative={false} />
        <span className="muted">Last 24 hours</span>
      </div>
    </div>
  ),
};
export const InToolbar: Story = {
  render: () => (
    <div className="surface row">
      <span>All alerts</span>
      <Separator orientation="vertical" />
      <span className="muted">Updated 30 seconds ago</span>
    </div>
  ),
};
