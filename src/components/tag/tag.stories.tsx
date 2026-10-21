import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Tag, Chip } from './tag';
export default {
  title: 'Components/Tags/Tag',
  component: Tag,
  subcomponents: { Chip },
} satisfies Meta<typeof Tag>;
function Tags() {
  const [selected, setSelected] = useState(false);
  const [removed, setRemoved] = useState(false);
  return (
    <div className="stack">
      {(['sm', 'md'] as const).map((size) => (
        <div className="row" key={size}>
          {(['default', 'function', 'destroy', 'ai', 'success', 'warning'] as const).map(
            (intent) => (
              <Tag size={size} intent={intent} key={intent}>
                {intent === 'ai' ? 'AI suggested' : 'Credential access'}
              </Tag>
            ),
          )}
        </div>
      ))}
      <div className="row">
        <Tag variant="interactive" selected={selected} onSelectedChange={setSelected}>
          Assigned to me
        </Tag>
        <Tag variant="counter" count={24}>
          Identity
        </Tag>
        {!removed && (
          <Tag
            variant="removable"
            removeLabel="Remove PowerShell filter"
            onRemove={() => setRemoved(true)}
          >
            PowerShell
          </Tag>
        )}
      </div>
    </div>
  );
}
export const Matrix: StoryObj<typeof Tag> = { render: () => <Tags /> };

export const Status: StoryObj<typeof Tag> = {
  parameters: {
    docs: {
      description: {
        story:
          'Status tags use a colored dot, quiet pill background, and primary text. Medium tags are 24px tall; small tags are 20px. Use intent for semantic colors or dotColor with a workflow color token, such as the separate purple Triaged token. Status tags are labels, not live announcements or controls.',
      },
    },
  },
  render: () => (
    <div className="stack">
      {(['md', 'sm'] as const).map((size) => (
        <div
          className="row"
          key={size}
          aria-label={`${size === 'md' ? 'Medium' : 'Small'} status tags`}
          role="group"
        >
          <Tag variant="status" size={size} intent="function">
            New
          </Tag>
          <Tag variant="status" size={size} intent="function">
            Open
          </Tag>
          <Tag variant="status" size={size} dotColor="var(--color-status-triaged-fg)">
            Triaged
          </Tag>
          <Tag variant="status" size={size} intent="warning">
            In progress
          </Tag>
          <Tag variant="status" size={size} intent="success">
            Closed
          </Tag>
          <Tag variant="status" size={size} intent="destroy">
            Blocked
          </Tag>
          <Tag variant="status" size={size}>
            Queued
          </Tag>
        </div>
      ))}
    </div>
  ),
};
