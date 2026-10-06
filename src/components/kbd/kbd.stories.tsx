import type { Meta, StoryObj } from '@storybook/react-vite';
import { Kbd } from './kbd';
const meta = {
  title: 'Components/Tags/Kbd',
  component: Kbd,
  tags: ['autodocs'],
  args: { children: '⌘ K' },
} satisfies Meta<typeof Kbd>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Sizes: Story = {
  render: () => (
    <div className="stack">
      <div className="row">
        <span className="muted">Search commands</span>
        <Kbd aria-label="Command K">⌘ K</Kbd>
      </div>
      <div className="row">
        <span className="muted">Open investigation</span>
        <Kbd size="md" aria-label="Enter">
          ↵
        </Kbd>
      </div>
    </div>
  ),
};
export const AnalystShortcuts: Story = {
  render: () => (
    <div className="surface stack" style={{ maxWidth: 400 }}>
      {[
        ['Search alerts', '/'],
        ['Next alert', 'J'],
        ['Previous alert', 'K'],
        ['Assign to me', 'A'],
        ['Close detail', 'Esc'],
      ].map(([label, shortcut]) => (
        <div className="between" key={label}>
          <span>{label}</span>
          <Kbd>{shortcut}</Kbd>
        </div>
      ))}
    </div>
  ),
};
