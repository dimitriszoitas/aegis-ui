import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { analysts } from '@/sample-data';
import { siemExampleAlerts, siemExampleRules, siemExampleTime } from '@/sample-data/siem-example';
import { AlertDetailPage, type AlertDetailComment } from './alert-detail';
import type { Alert } from '@/sample-data/types';

const initialComments: AlertDetailComment[] = [
  {
    id: 'comment-1',
    author: analysts[0],
    body: 'The transfer occurred outside the scheduled backup window. Checking the destination against approved third-party services.',
    createdAt: new Date(siemExampleTime - 12 * 60_000).toISOString(),
  },
  {
    id: 'comment-2',
    author: analysts[1],
    body: 'Both signals involve the same user and external endpoint. Keep the alert open until the resource owner confirms the activity.',
    createdAt: new Date(siemExampleTime - 6 * 60_000).toISOString(),
  },
];
function DetailDemo({
  defaultTab = 'overview',
  failSave = false,
}: {
  defaultTab?: 'overview' | 'signals';
  failSave?: boolean;
}) {
  const [alert, setAlert] = useState<Alert>(siemExampleAlerts[0]);
  const [action, setAction] = useState('');
  return (
    <main style={{ padding: 'clamp(16px, 3vw, 40px)', maxWidth: 1600, marginInline: 'auto' }}>
      <AlertDetailPage
        alert={alert}
        analysts={analysts}
        rules={siemExampleRules}
        now={siemExampleTime}
        comments={initialComments}
        currentAnalyst={analysts[0]}
        defaultTab={defaultTab}
        context={{
          classification: 'Exfiltration',
          runAs: 'Detection service',
          description:
            'A user transferred data to an external endpoint outside the approved backup window. Two related signals share the same user and destination. Review the affected resources and confirm whether this transfer was authorized.',
        }}
        onBack={() => setAction('Returned to Alerts.')}
        onUpdate={(next) => {
          if (failSave) throw new Error('The update could not be saved. Try again.');
          setAlert(next);
        }}
        onTriage={(selected) => setAction(`Genie triage opened for ${selected.id}.`)}
      />
      <p role="status" className="sr-only">
        {action}
      </p>
    </main>
  );
}
const meta = {
  title: 'Patterns/SIEM/AlertDetail',
  component: AlertDetailPage,
  args: { alert: siemExampleAlerts[0], analysts, onBack: () => {} },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A full-page alert investigation with compact triage controls, comments, searchable signals, and an inline evidence inspector. Signals derive from the alert’s actual events or can be supplied explicitly. Optional callbacks persist analyst changes; without them, changes remain local to this mounted view. AlertDetailSheet remains the compatible overlay alternative.',
      },
    },
  },
  render: () => <DetailDemo />,
} satisfies Meta<typeof AlertDetailPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};
export const Signals: Story = { render: () => <DetailDemo defaultTab="signals" /> };
export const SignalDetails: Story = {
  render: () => <DetailDemo defaultTab="signals" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getAllByRole('button', { name: /Potential data exfiltration.*sig-/ })[0],
    );
    await expect(canvas.getByRole('complementary', { name: 'Signal details' })).toBeVisible();
  },
};
export const InvestigationFlow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('combobox', { name: 'Status' }));
    await userEvent.click(await page.findByRole('option', { name: 'In progress' }));
    await expect(canvas.getByRole('combobox', { name: 'Status' })).toHaveTextContent('In progress');
    const draft = canvas.getByRole('textbox', { name: 'Add a comment' });
    await userEvent.type(draft, 'Confirmed the endpoint is not an approved backup destination.');
    await userEvent.click(canvas.getByRole('button', { name: 'Add comment' }));
    await expect(
      canvas.getByText('Confirmed the endpoint is not an approved backup destination.'),
    ).toBeVisible();
    await waitFor(() => expect(draft).toHaveFocus());
    await expect(draft).toHaveValue('');
    await userEvent.click(canvas.getByRole('button', { name: 'Sort comments: newest first' }));
    await expect(canvas.getByRole('button', { name: 'Sort comments: oldest first' })).toBeVisible();
    await userEvent.click(canvas.getByRole('tab', { name: 'Signals 2' }));
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search signals' }), 'sig-2816-002');
    await expect(canvas.getByText('1 of 2 signals')).toBeVisible();
    const signal = canvas.getByRole('button', {
      name: /Potential data exfiltration.*sig-2816-002/,
    });
    await userEvent.click(signal);
    await expect(canvas.getByRole('complementary', { name: 'Signal details' })).toBeVisible();
    await expect(canvas.getByText('david.bakker@example.com')).toBeVisible();
    await expect(canvas.getByRole('heading', { name: 'Signal details' })).toHaveFocus();
    await userEvent.click(canvas.getByText('Full record', { selector: 'summary' }));
    await expect(
      canvas.getByRole('tree', { name: 'Full record for sig-2816-002 JSON tree' }),
    ).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(signal).toHaveFocus());
    await expect(canvas.queryByRole('complementary')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Clear search' }));
    await expect(canvas.getByText('2 of 2 signals')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Triage with Genie' }));
    await expect(canvas.getByText('Genie triage opened for SEC-2816.')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('tab', { name: 'Overview' }));
  },
};
export const SaveFailure: Story = {
  render: () => <DetailDemo failSave />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('combobox', { name: 'Status' }));
    await userEvent.click(await page.findByRole('option', { name: 'Closed' }));
    await expect(canvas.getByRole('alert')).toHaveTextContent('The update could not be saved.');
    await expect(canvas.getByRole('combobox', { name: 'Status' })).toHaveTextContent('Open');
  },
};
