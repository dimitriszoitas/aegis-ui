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
  const [message, setMessage] = useState('Ready for investigation');
  return (
    <div className="surface stack" style={{ maxWidth: 560 }}>
      <div className="between">
        <span>Encoded PowerShell on WS-ATH-114</span>
        <ActionsCell
          actions={[
            {
              id: 'open',
              label: 'Open alert details',
              icon: <ExternalLink size={15} />,
              onClick: () => setMessage('Alert detail opened for ALT-2026-0842'),
            },
            {
              id: 'ai',
              label: 'Explain this alert with AI',
              icon: <Sparkles size={15} />,
              intent: 'ai',
              onClick: () => setMessage('AI is correlating 18 events for WS-ATH-114'),
            },
            {
              id: 'assign',
              label: 'Assign to me',
              icon: <UserRoundCheck size={15} />,
              onClick: () => setMessage('Assigned to Eleni Papadopoulos'),
            },
            {
              id: 'resolve',
              label: 'Mark resolved',
              icon: <CheckCheck size={15} />,
              onClick: () => setMessage('Alert marked resolved'),
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
