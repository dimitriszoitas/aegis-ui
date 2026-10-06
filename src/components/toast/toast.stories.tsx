import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toast, Toaster, showToast, type ToastIntent } from './toast';

const meta = {
  title: 'Components/Feedback/Toast',
  component: Toast,
  subcomponents: { Toaster },
  parameters: {
    docs: {
      description: {
        component:
          "Mount one `Toaster` per application shell and call `showToast` to display an Aegis notification. `ToasterProps` inherits the Sonner host API; `toastOptions.unstyled` and the Aegis toast class remain enabled.\n\n| Toaster prop | Type | Aegis default / behavior |\n| --- | --- | --- |\n| position | `'top-left'`, `'top-center'`, `'top-right'`, `'bottom-left'`, `'bottom-center'`, `'bottom-right'` | `'bottom-right'` |\n| offset | `number`, `string` or side-offset object | `12` |\n| gap | `number` | `12` |\n| visibleToasts | `number` | `4` |\n| duration | `number` | Inherited Sonner timeout in milliseconds |\n| theme | `'light'`, `'dark'`, `'system'` | Optional host appearance; Aegis content uses semantic theme tokens |\n| expand / closeButton | `boolean` | Expand stacked notifications / show a close control |\n| hotkey | `string[]` | Keyboard shortcut that focuses the notification region |\n| containerAriaLabel | `string` | Accessible name for the notification region |\n| toastOptions | `ToastOptions` | Shared toast settings |\n| className / style | `string` / `CSSProperties` | Host presentation props |\n",
      },
    },
  },
  tags: ['autodocs'],
  args: {
    title: 'Alert assigned to Maya Chen',
    description: 'ALR-00842 is ready for investigation.',
    intent: 'success',
  },
} satisfies Meta<typeof Toast>;
export default meta;
type Story = StoryObj<typeof meta>;
const examples: { intent: ToastIntent; title: string; description: string }[] = [
  {
    intent: 'info',
    title: 'New evidence is available',
    description: '6 endpoint events were added to ALR-00842.',
  },
  {
    intent: 'success',
    title: 'Detection rule enabled',
    description: 'Encoded PowerShell detection is now monitoring 482 hosts.',
  },
  {
    intent: 'warning',
    title: 'Telemetry is delayed',
    description: 'Identity events are arriving 8 minutes behind schedule.',
  },
  {
    intent: 'destroy',
    title: 'Rule validation failed',
    description: 'Add a condition before enabling this detection.',
  },
  {
    intent: 'ai',
    title: 'AI summary is ready',
    description: 'Review the supporting evidence before taking action.',
  },
  {
    intent: 'loading',
    title: 'Correlating event sources',
    description: 'Matching identity and endpoint signals for this investigation.',
  },
];
export const IntentMatrix: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-4)',
        maxWidth: 850,
      }}
    >
      {examples.map((example) => (
        <Toast key={example.intent} {...example} />
      ))}
    </div>
  ),
};
function InteractiveNotifications() {
  const [feedback, setFeedback] = useState('Notifications appear in the lower-right corner.');
  return (
    <div>
      <Toaster id="toast-demo" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        {examples
          .filter((example) => example.intent !== 'loading')
          .map((example) => (
            <button
              key={example.intent}
              className="aegis-toast-demo-trigger"
              onClick={() =>
                showToast({
                  ...example,
                  toasterId: 'toast-demo',
                  action: {
                    label: 'Open investigation',
                    onClick: () => setFeedback('Investigation ALR-00842 opened.'),
                  },
                })
              }
            >
              {example.intent === 'destroy'
                ? 'Validation error'
                : example.intent === 'ai'
                  ? 'AI summary'
                  : example.intent}
            </button>
          ))}
      </div>
      <p
        role="status"
        style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}
      >
        {feedback}
      </p>
    </div>
  );
}
export const Interactive: Story = { render: () => <InteractiveNotifications /> };
export const WithAction: Story = {
  args: {
    title: 'Alert marked as resolved',
    description: 'The resolution is saved in the investigation history.',
    action: {
      label: 'Undo resolution',
      onClick: () =>
        showToast({
          title: 'Alert reopened',
          description: 'ALR-00842 is ready for review.',
          intent: 'info',
        }),
    },
  },
  decorators: [
    (Story) => (
      <>
        <Toaster />
        <div style={{ maxWidth: 400 }}>
          <Story />
        </div>
      </>
    ),
  ],
};
