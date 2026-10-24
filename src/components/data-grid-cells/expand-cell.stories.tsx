import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExpandCell } from './data-grid-cells';
export default {
  title: 'Components/Data grid/Expand cell',
  component: ExpandCell,
  tags: ['autodocs'],
} satisfies Meta<typeof ExpandCell>;
function ExpandDemo() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="story-layout stack" style={{ maxWidth: 540 }}>
      <div className="row">
        <ExpandCell
          expanded={expanded}
          onExpandedChange={setExpanded}
          count={3}
          aria-controls="sample-nested-events"
        />
        <span>Project delivery review</span>
      </div>
      {expanded && (
        <div
          id="sample-nested-events"
          className="stack"
          style={{
            paddingLeft: 'var(--space-8)',
            gap: 'var(--space-2)',
            fontSize: 'var(--text-xs)',
          }}
        >
          <code>11:57:02 UTC · Record created by Elena Vasquez</code>
          <code>11:57:03 UTC · Project assigned to Marcus Chen</code>
          <code>11:57:04 UTC · Review requested for the next milestone</code>
        </div>
      )}
    </div>
  );
}
export const NestedEvents: StoryObj = { render: () => <ExpandDemo /> };
