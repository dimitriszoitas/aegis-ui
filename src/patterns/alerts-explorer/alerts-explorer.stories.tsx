import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { alerts as fixtures, analysts, referenceTime, type Alert } from '@/sample-data';
import { SideSheet, SideSheetSection, SideSheetField } from '@/components/side-sheet';
import { SeverityBadge } from '@/components/severity-badge';
import { StatusBadge } from '@/components/status-badge';
import { Banner } from '@/components/banner';
import { AlertsExplorer, AlertEventsTable } from './alerts-explorer';
function ExplorerDemo({
  panelOpen = false,
  filterMode = 'panel',
}: {
  panelOpen?: boolean;
  filterMode?: 'bar' | 'panel';
}) {
  const [alerts, setAlerts] = useState(fixtures);
  const [selected, setSelected] = useState<Alert>();
  const [context, setContext] = useState<Alert[]>([]);
  return (
    <div style={{ padding: 'var(--space-5)' }}>
      <AlertsExplorer
        alerts={alerts}
        analysts={analysts}
        onAlertsChange={setAlerts}
        now={referenceTime}
        onOpenAlert={setSelected}
        onAskAi={setContext}
        defaultPanelOpen={panelOpen}
        filterMode={filterMode}
      />
      <SideSheet
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(undefined);
        }}
        title={selected?.title ?? 'Alert details'}
        description={selected?.id}
      >
        {selected && (
          <>
            <SideSheetSection title="Triage details">
              <SideSheetField label="Severity">
                <SeverityBadge severity={selected.severity} />
              </SideSheetField>
              <SideSheetField label="Status">
                <StatusBadge
                  status={
                    alerts.find((alert) => alert.id === selected.id)?.status ?? selected.status
                  }
                />
              </SideSheetField>
              <SideSheetField label="Entity">{selected.entity.name}</SideSheetField>
            </SideSheetSection>
            <AlertEventsTable alert={selected} now={referenceTime} />
          </>
        )}
      </SideSheet>
      <SideSheet
        open={context.length > 0}
        onOpenChange={(open) => {
          if (!open) setContext([]);
        }}
        title="AI investigation context"
        description={`${context.length} alerts selected`}
      >
        <Banner intent="ai" title="Ready for analysis">
          These alerts have been added to the assistant context.
        </Banner>
        <ul>
          {context.map((alert) => (
            <li key={alert.id}>
              {alert.id} · {alert.title}
            </li>
          ))}
        </ul>
      </SideSheet>
    </div>
  );
}
const meta = {
  title: 'Patterns/Alerts explorer',
  component: AlertsExplorer,
  subcomponents: { AlertEventsTable },
  tags: ['autodocs'],
  args: { alerts: fixtures, analysts, onAlertsChange: () => {}, onAskAi: () => {} },
  parameters: { layout: 'fullscreen' },
  render: () => <ExplorerDemo />,
} satisfies Meta<typeof AlertsExplorer>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const PushFilters: Story = { render: () => <ExplorerDemo panelOpen /> };
export const BarFilters: Story = {
  render: () => <ExplorerDemo filterMode="bar" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Add filter' })).toBeVisible();
    await expect(canvas.queryByRole('complementary', { name: /Filters/ })).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole('button', { name: 'Show filter panel' }),
    ).not.toBeInTheDocument();
  },
};
export const FilterSynchronization: Story = {
  render: () => <ExplorerDemo panelOpen />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const panel = c.getByRole('complementary', { name: /Filters/ });
    await userEvent.click(within(panel).getByRole('checkbox', { name: /Critical/ }));
    await expect(
      c.queryByRole('button', { name: 'Remove Critical severity filter' }),
    ).not.toBeInTheDocument();
    await expect(
      c.queryByRole('button', { name: 'Add filter' }),
    ).not.toBeInTheDocument();
    await userEvent.click(c.getByRole('button', { name: 'Hide filter panel' }));
    await expect(c.getByRole('button', { name: 'Remove Critical severity filter' })).toBeVisible();
    await userEvent.click(c.getByRole('button', { name: 'Remove Critical severity filter' }));
    await userEvent.click(c.getByRole('button', { name: 'Show filter panel' }));
    await expect(
      within(c.getByRole('complementary', { name: /Filters/ })).getByRole('checkbox', {
        name: /Critical/,
      }),
    ).not.toBeChecked();
  },
};
