import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkles, Plus, ArrowRight } from 'lucide-react';
import { Button } from './button';
const meta = {
  title: 'Components/Actions/Button',
  component: Button,
  args: { children: 'Create detection', intent: 'function' },
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
          {(['filled', 'soft', 'ghost'] as const).map((emphasis) => (
            <div className="row" key={emphasis}>
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
    <div className="row">
      <Button intent="function" leadingIcon={<Plus />}>
        Create rule
      </Button>
      <Button intent="function" disabled>
        Create rule
      </Button>
      <Button intent="function" loading>
        Create rule
      </Button>
      <Button intent="ai" loading leadingIcon={<Sparkles />}>
        Analyzing alerts
      </Button>
      <Button emphasis="soft" trailingIcon={<ArrowRight />}>
        Review findings
      </Button>
    </div>
  ),
};
export const Playground: Story = {};
