import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkles, SlidersHorizontal, Trash2 } from '@/components/icon';
import { IconButton } from './icon-button';
export default { title: 'Components/Actions/IconButton', component: IconButton } satisfies Meta<
  typeof IconButton
>;
export const Matrix: StoryObj<typeof IconButton> = {
  render: () => (
    <div className="stack">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div className="row" key={size}>
          {(['primary', 'secondary', 'tertiary', 'ghost'] as const).flatMap((emphasis) =>
            (['default', 'function', 'destroy', 'ai'] as const).map((intent) => (
              <IconButton
                key={emphasis + intent}
                size={size}
                emphasis={emphasis}
                intent={intent}
                aria-label={
                  intent === 'ai'
                    ? 'Explain selected alert'
                    : intent === 'destroy'
                      ? 'Delete rule'
                      : 'Configure columns'
                }
              >
                {intent === 'ai' ? (
                  <Sparkles size={16} />
                ) : intent === 'destroy' ? (
                  <Trash2 size={16} />
                ) : (
                  <SlidersHorizontal size={16} />
                )}
              </IconButton>
            )),
          )}
        </div>
      ))}
    </div>
  ),
};
export const States: StoryObj<typeof IconButton> = {
  render: () => (
    <div className="row">
      <IconButton aria-label="Configure columns" disabled>
        <SlidersHorizontal size={16} />
      </IconButton>
      <IconButton aria-label="Analyzing alerts" loading intent="ai">
        <Sparkles size={16} />
      </IconButton>
    </div>
  ),
};
