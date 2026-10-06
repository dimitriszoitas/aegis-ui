import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '@/components/button';
import { alerts as fixtures, analysts, rules, referenceTime, type Alert } from '@/sample-data';
import { AlertDetailSheet, type AlertDetailTab } from './alert-detail-sheet';
const navigation = fixtures.slice(0, 5);
// Radix registers a portal in its dismissable-layer stack after mounting its controls.
async function readyForPointer(element: HTMLElement) {
  await waitFor(() => {
    expect(element).toBeVisible();
    expect(getComputedStyle(element).pointerEvents).not.toBe('none');
    expect(element.closest('[inert]')).toBeNull();
  });
}
async function clickReady(element: HTMLElement) {
  await readyForPointer(element);
  await userEvent.click(element);
}

function DetailDemo({
  defaultTab = 'overview',
  outside = false,
  failFirstSave = false,
  emptyEvents = false,
  missingRule = false,
  note = false,
}: {
  defaultTab?: AlertDetailTab;
  outside?: boolean;
  failFirstSave?: boolean;
  emptyEvents?: boolean;
  missingRule?: boolean;
  note?: boolean;
}) {
  const [records, setRecords] = useState<Alert[]>(() =>
    navigation.map((alert) => ({
      ...alert,
      events: emptyEvents ? [] : alert.events,
      analystNote: note
        ? 'Compared the event timestamps with the change window.\nNext: confirm the endpoint owner before closing the alert.'
        : undefined,
    })),
  );
  const [selectedId, setSelectedId] = useState(records[2].id);
  const [open, setOpen] = useState(true);
  const [action, setAction] = useState('');
  const [saves, setSaves] = useState(0);
  const attempts = useRef(0);
  const selected = records.find((alert) => alert.id === selectedId);
  return (
    <main style={{ padding: 24 }}>
      <h1>Alert triage workspace</h1>
      <p>Edit the current record, browse related evidence, or open the investigation workspace.</p>
      <Button onClick={() => setOpen(true)}>Open alert details</Button>
      <p role="status">{action}</p>
      <p>Saved changes: {saves}</p>
      <AlertDetailSheet
        alert={selected}
        alerts={outside ? navigation.filter((alert) => alert.id !== selectedId) : navigation}
        analysts={analysts}
        rules={missingRule ? [] : rules}
        open={open}
        onOpenChange={setOpen}
        onNavigate={(alert) => setSelectedId(alert.id)}
        onUpdate={async (updated) => {
          attempts.current += 1;
          await new Promise((resolve) => setTimeout(resolve, 220));
          if (failFirstSave && attempts.current === 1)
            throw new Error('The update could not be saved. Your draft is preserved; try again.');
          setRecords((current) =>
            current.map((alert) => (alert.id === updated.id ? updated : alert)),
          );
          setSaves((count) => count + 1);
        }}
        onOpenInvestigation={(alert) => setAction(`Hunting query: ${alert.entity.name}`)}
        onExplain={(alert) => setAction(`AI investigation context: ${alert.id}`)}
        now={referenceTime}
        defaultTab={defaultTab}
      />
    </main>
  );
}
const meta = {
  title: 'Patterns/SIEM/AlertDetailSheet',
  component: AlertDetailSheet,
  tags: ['autodocs'],
  args: {
    alert: navigation[2],
    alerts: navigation,
    analysts,
    rules,
    open: true,
    onOpenChange: () => {},
    now: referenceTime,
  },
  parameters: { layout: 'fullscreen', docs: { story: { inline: false, height: 760 } } },
  render: () => <DetailDemo />,
} satisfies Meta<typeof AlertDetailSheet>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};
export const Events: Story = { render: () => <DetailDemo defaultTab="events" /> };
export const Rule: Story = { render: () => <DetailDemo defaultTab="rule" /> };
export const WithAnalystNote: Story = { render: () => <DetailDemo note /> };
export const OutsideFilteredResults: Story = { render: () => <DetailDemo outside /> };
export const EmptyEvents: Story = { render: () => <DetailDemo defaultTab="events" emptyEvents /> };
export const MissingRule: Story = { render: () => <DetailDemo defaultTab="rule" missingRule /> };
export const NoSelection: Story = {
  render: (args) => <AlertDetailSheet {...args} alert={undefined} />,
};
export const EditDialog: Story = {
  play: async ({ canvasElement }) => {
    await clickReady(
      within(canvasElement.ownerDocument.body).getByRole('button', { name: 'Edit' }),
    );
  },
};
export const SaveFailure: Story = {
  render: () => <DetailDemo failFirstSave />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await clickReady(page.getByRole('button', { name: 'Edit' }));
    const noteInput = await page.findByRole('textbox', { name: /Analyst note/ });
    await readyForPointer(noteInput);
    await userEvent.type(noteInput, 'Confirm the approved change window.');
    await clickReady(page.getByRole('button', { name: 'Save changes' }));
    await expect(await page.findByRole('alert')).toHaveTextContent('Your draft is preserved');
  },
};
export const NavigationAndSave: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await clickReady(page.getByRole('button', { name: 'Next alert' }));
    await expect(page.getByText('4 of 5')).toBeVisible();
    await clickReady(page.getByRole('button', { name: 'Edit' }));
    const noteInput = await page.findByRole('textbox', { name: /Analyst note/ });
    await readyForPointer(noteInput);
    await userEvent.type(
      noteInput,
      'Verified event identifiers; awaiting endpoint owner confirmation.',
    );
    await clickReady(page.getByRole('button', { name: 'Save changes' }));
    await expect(await page.findByText('Changes saved.')).toBeVisible();
    await expect(
      page.getByText('Verified event identifiers; awaiting endpoint owner confirmation.'),
    ).toBeVisible();
    await clickReady(page.getByRole('tab', { name: /^Events/ }));
    await expect(
      page.getByRole('table', { name: `Evidence events for ${navigation[3].id}` }),
    ).toBeVisible();
    await clickReady(page.getByRole('tab', { name: 'Rule' }));
    await expect(page.getByText(`${navigation[3].ruleId}.yaml`)).toBeVisible();
  },
};
