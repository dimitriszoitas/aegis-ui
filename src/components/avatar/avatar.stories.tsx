import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar, AvatarGroup } from './avatar';
const analysts = [
  { name: 'Eleni Papadopoulos', status: 'online' as const },
  { name: 'Marcus Chen', status: 'busy' as const },
  { name: 'Aisha Okafor', status: 'away' as const },
  { name: 'Kenji Nakamura', status: 'offline' as const },
  { name: 'Sofia Rossi' },
  { name: 'Noah Williams' },
];
const meta = {
  title: 'Components/People/Avatar',
  component: Avatar,
  subcomponents: { AvatarGroup },
  tags: ['autodocs'],
  args: { name: 'Eleni Papadopoulos' },
} satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SizesAndPresence: Story = {
  render: () => (
    <div className="stack">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div className="row" key={size} style={{ gap: 'var(--space-6)' }}>
          {analysts.slice(0, 4).map((analyst) => (
            <div className="row" key={analyst.name}>
              <Avatar {...analyst} size={size} />
              <span className="muted">{analyst.status}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
};
export const Groups: Story = {
  render: () => (
    <div className="surface stack" style={{ maxWidth: 460 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div className="between" key={size}>
          <span>Identity response team</span>
          <AvatarGroup avatars={analysts} max={3} size={size} />
        </div>
      ))}
    </div>
  ),
};
export const InitialsFallback: Story = {
  render: () => (
    <div className="row" style={{ gap: 'var(--space-4)' }}>
      <Avatar name="Eleni Papadopoulos" size="lg" />
      <div>
        <strong>Eleni Papadopoulos</strong>
        <p className="muted" style={{ margin: 0 }}>
          Senior detection engineer · SOC Athens
        </p>
      </div>
    </div>
  ),
};
