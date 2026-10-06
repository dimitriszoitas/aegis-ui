import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkles, Plus, ArrowRight } from '@/components/icon';
import { Button } from './button';
const meta = {
  title: 'Components/Actions/Button',
  component: Button,
  args: { children: 'Create detection', intent: 'function' },
  parameters: {
    docs: {
      description: {
        component:
          'Primary actions are filled, secondary actions use a soft tint, tertiary actions have an outline, and ghost actions show only their label and icon. All four support neutral, function, destroy, and AI intents. Buttons use 4/5/6px corners at 28/34/40px heights, with optical padding on icon sides. Loading keeps the original button width.',
      },
    },
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Matrix: Story = {
  render: () => (
    <div className="stack">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <section className="surface stack" key={size}>
          <h3>
            {size === 'sm'
              ? 'Compact actions'
              : size === 'md'
                ? 'Default actions'
                : 'Prominent actions'}
          </h3>
          {(['primary', 'secondary', 'tertiary', 'ghost'] as const).map((emphasis) => (
            <div className="row" key={emphasis}>
              <span style={{ width: 72, color: 'var(--color-text-secondary)' }}>{emphasis}</span>
              {(['default', 'function', 'destroy', 'ai'] as const).map((intent) => (
                <Button
                  key={intent}
                  size={size}
                  emphasis={emphasis}
                  intent={intent}
                  leadingIcon={intent === 'ai' ? <Sparkles /> : <Plus />}
                >
                  {intent === 'ai'
                    ? 'Ask Aegis'
                    : intent === 'destroy'
                      ? 'Delete rule'
                      : intent === 'function'
                        ? 'Create detection'
                        : 'View alerts'}
                </Button>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  ),
};
export const States: Story = {
  render: () => (
    <div className="stack">
      {(['primary', 'secondary', 'tertiary', 'ghost'] as const).map((emphasis) => (
        <section className="surface stack" key={emphasis}>
          <h3>{emphasis}</h3>
          <div className="row">
            <Button emphasis={emphasis} intent="function" leadingIcon={<Plus />}>
              Create rule
            </Button>
            <Button emphasis={emphasis} intent="function" disabled leadingIcon={<Plus />}>
              Create rule
            </Button>
            <Button emphasis={emphasis} intent="function" loading leadingIcon={<Plus />}>
              Create rule
            </Button>
            <Button emphasis={emphasis} intent="function" loading>
              Create rule
            </Button>
            <Button emphasis={emphasis} intent="ai" loading leadingIcon={<Sparkles />}>
              Analyze alerts
            </Button>
          </div>
        </section>
      ))}
    </div>
  ),
};
export const IconSpacing: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Text sides keep 8/12/16px padding at small/medium/large sizes. Icon sides use 6/8/12px. Both icon slots reduce their own side; loading preserves those slots and the full button footprint.',
      },
    },
  },
  render: () => (
    <div className="stack">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <section className="surface stack" key={size}>
          <h3>
            {size === 'sm' ? 'Small · 28px' : size === 'md' ? 'Medium · 34px' : 'Large · 40px'}
          </h3>
          <div className="row">
            <Button size={size} emphasis="tertiary">
              Review alerts
            </Button>
            <Button size={size} emphasis="tertiary" leadingIcon={<Plus />}>
              Review alerts
            </Button>
            <Button size={size} emphasis="tertiary" trailingIcon={<ArrowRight />}>
              Review alerts
            </Button>
            <Button
              size={size}
              emphasis="tertiary"
              leadingIcon={<Plus />}
              trailingIcon={<ArrowRight />}
            >
              Review alerts
            </Button>
          </div>
          <div className="row">
            <Button size={size} emphasis="tertiary" loading>
              Review alerts
            </Button>
            <Button size={size} emphasis="tertiary" loading leadingIcon={<Plus />}>
              Review alerts
            </Button>
            <Button size={size} emphasis="tertiary" loading trailingIcon={<ArrowRight />}>
              Review alerts
            </Button>
            <Button
              size={size}
              emphasis="tertiary"
              loading
              leadingIcon={<Plus />}
              trailingIcon={<ArrowRight />}
            >
              Review alerts
            </Button>
          </div>
        </section>
      ))}
    </div>
  ),
};
export const Playground: Story = {};
