import type { Meta, StoryObj } from '@storybook/react-vite';
import { Timeline } from './timeline';
import { referenceTime } from '@/sample-data';
import { Tag } from '@/components/tag';
const meta = {
  title: 'Components/Data/Timeline',
  component: Timeline,
  tags: ['autodocs'],
  args: {
    now: referenceTime,
    items: [
      {
        id: 'resolved',
        type: 'status',
        title: 'Alert marked as triaged',
        actor: 'Elena Vasquez',
        timestamp: referenceTime - 60000,
        description: 'The host was isolated after the encoded command was confirmed.',
      },
      {
        id: 'note',
        type: 'note',
        title: 'Analyst note added',
        actor: 'Marcus Chen',
        timestamp: referenceTime - 180000,
        description:
          'The command was launched by WINWORD.EXE from an email attachment. Compare the parent process with the mail gateway evidence.',
      },
      {
        id: 'ai',
        type: 'ai',
        title: 'Investigation summary generated',
        actor: 'Aegis assistant',
        timestamp: referenceTime - 240000,
        description:
          'The execution chain suggests a document-triggered payload. The proposed verdict requires analyst review.',
        actions: <Tag intent="ai">Evidence · ALR-1049</Tag>,
      },
      {
        id: 'assigned',
        type: 'assignment',
        title: 'Assigned to Elena Vasquez',
        actor: 'Marcus Chen',
        timestamp: referenceTime - 300000,
      },
      {
        id: 'detected',
        type: 'detection',
        title: 'Encoded PowerShell detected',
        timestamp: referenceTime - 360000,
        description: 'DET-0114 matched six events on WS-LON-082.',
      },
    ],
  },
} satisfies Meta<typeof Timeline>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Investigation: Story = {
  decorators: [
    (Story) => (
      <div className="surface" style={{ maxWidth: 640 }}>
        <Story />
      </div>
    ),
  ],
};
export const Empty: Story = { args: { items: [] } };
export const SingleEvent: Story = { args: { items: [meta.args.items[4]] } };
