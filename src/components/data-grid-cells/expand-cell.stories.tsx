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
    <div className="surface stack" style={{ maxWidth: 540 }}>
      <div className="row">
        <ExpandCell
          expanded={expanded}
          onExpandedChange={setExpanded}
          count={3}
          aria-controls="sample-nested-events"
        />
        <span>Encoded PowerShell on WS-ATH-114</span>
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
          <code>11:57:02 UTC · WINWORD.EXE launched powershell.exe</code>
          <code>11:57:03 UTC · Encoded command decoded by EDR</code>
          <code>11:57:04 UTC · Outbound connection to 203.0.113.42</code>
        </div>
      )}
    </div>
  );
}
export const NestedEvents: StoryObj = { render: () => <ExpandDemo /> };
