import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckCheck, ExternalLink, Sparkles, UserRoundCheck } from '@/components/icon';
import { ActionsCell } from './data-grid-cells';
export default {
  title: 'Components/Data grid/Actions cell',
  component: ActionsCell,
  tags: ['autodocs'],
} satisfies Meta<typeof ActionsCell>;
function ActionsDemo() {
  const [message, setMessage] = useState('Ready for review');
  return (
    <div className="story-layout stack" style={{ maxWidth: 560 }}>
      <div className="between">
        <span>Project delivery review</span>
        <ActionsCell
          actions={[
            {
              id: 'open',
              label: 'Open record details',
              icon: <ExternalLink size={15} />,
              onClick: () => setMessage('Record detail opened for REC-2026-0842'),
            },
            {
              id: 'ai',
              label: 'Explain this record with AI',
              icon: <Sparkles size={15} />,
              intent: 'ai',
              onClick: () => setMessage('AI is summarizing 18 updates for Customer portal'),
            },
            {
              id: 'assign',
              label: 'Assign to me',
              icon: <UserRoundCheck size={15} />,
              onClick: () => setMessage('Assigned to Eleni Papadopoulos'),
            },
            {
              id: 'resolve',
              label: 'Mark completed',
              icon: <CheckCheck size={15} />,
              onClick: () => setMessage('Record marked completed'),
            },
          ]}
        />
      </div>
      <p className="muted" role="status" style={{ margin: 0 }}>
        {message}
      </p>
    </div>
  );
}
export const Interactive: StoryObj = { render: () => <ActionsDemo /> };
