import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { alerts, analysts, referenceTime } from '@/sample-data';
import { FilterBar } from '@/patterns/filter-bar';
import { SeverityBadge } from '@/components/severity-badge';
import { EmptyState } from '@/components/empty-state';
import { applyAlertFilters, createDefaultFilters } from '@/lib/filters';
import { FilterPanel, type FilterPanelProps } from './filter-panel';

function Demo(args: FilterPanelProps) {
  const [filters, setFilters] = useState(args.value);
  return (
    <FilterPanel
      {...args}
      style={{ height: 760 }}
      value={filters}
      onValueChange={(next) => {
        setFilters(next);
        args.onValueChange(next);
      }}
    />
  );
}
function SynchronizedDemo(args: FilterPanelProps) {
  const [filters, setFilters] = useState(args.value);
  const filtered = applyAlertFilters(args.alerts, filters, referenceTime);
  const update = (next: typeof filters) => {
    setFilters(next);
    args.onValueChange(next);
  };
  return (
    <div className="surface" style={{ padding: 0, width: 'min(1100px, 100%)' }}>
      <FilterBar value={filters} onValueChange={update} analysts={analysts} now={referenceTime} />
      <div className="aegis-filter-sync-preview">
        <FilterPanel {...args} style={{ height: 700 }} value={filters} onValueChange={update} />
        <section className="aegis-filter-sync-results" aria-label="Matching alert preview">
          <h3>{filtered.length} matching alerts</h3>
          {filtered.length ? (
            <ul>
              {filtered.slice(0, 8).map((alert) => (
                <li key={alert.id}>
                  <SeverityBadge severity={alert.severity} />
                  <span>
                    {alert.title}
                    <small>
                      {alert.entity.name} · {alert.source}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState compact />
          )}
        </section>
      </div>
    </div>
  );
}
const meta = {
  title: 'Patterns/FilterPanel',
  component: FilterPanel,
  parameters: { layout: 'padded' },
  args: {
    alerts,
    analysts,
    now: referenceTime,
    value: createDefaultFilters(),
    onValueChange: fn(),
  },
  render: (args) => <Demo {...args} />,
} satisfies Meta<typeof FilterPanel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Applied: Story = {
  args: {
    value: {
      ...createDefaultFilters(),
      severities: ['critical', 'high'],
      sources: ['EDR'],
      statuses: ['new'],
      savedViewId: undefined,
    },
  },
};
export const FilterSearch: Story = { args: { defaultSearch: 'severity' } };
export const NoOptions: Story = { args: { defaultSearch: 'unavailable-source' } };
export const NoData: Story = { args: { alerts: [] } };
export const Disabled: Story = {
  args: { disabled: true, value: { ...createDefaultFilters(), severities: ['critical'] } },
};
export const Synchronized: Story = {
  render: (args) => <SynchronizedDemo {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = within(canvas.getByRole('complementary', { name: /Filters/ }));
    await userEvent.click(panel.getByRole('checkbox', { name: /^Critical/ }));
    await expect(
      canvas.getByRole('button', { name: 'Remove Critical severity filter' }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Critical severity filter' }));
    await expect(panel.getByRole('checkbox', { name: /^Critical/ })).not.toBeChecked();
    await userEvent.click(canvas.getByRole('button', { name: 'Unassigned' }));
    await expect(panel.getByRole('checkbox', { name: /^Unassigned/ })).toBeChecked();
    await userEvent.click(panel.getByRole('button', { name: 'Clear all' }));
    await expect(canvas.getByRole('button', { name: 'Unassigned' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await expect(
      canvas.queryByRole('button', { name: 'Remove Unassigned assignee filter' }),
    ).not.toBeInTheDocument();
  },
};
export const SearchAndExpand: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole('searchbox', { name: 'Search filter options' }),
      'firewall',
    );
    await expect(canvas.getByRole('checkbox', { name: /^Firewall/ })).toBeVisible();
    await expect(canvas.queryByRole('checkbox', { name: /^Critical/ })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Clear filter option search' }));
    await expect(canvas.getByRole('checkbox', { name: /^Critical/ })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Severity' }));
    await expect(canvas.queryByRole('checkbox', { name: /^Critical/ })).not.toBeInTheDocument();
  },
};
export const KeyboardFacets: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const severity = canvas.getByRole('button', { name: 'Severity' });
    const critical = canvas.getByRole('checkbox', { name: /^Critical/ });
    critical.focus();
    await userEvent.keyboard(' ');
    await expect(critical).toBeChecked();
    severity.focus();
    await userEvent.keyboard('{Enter}');
    await expect(severity).toHaveAttribute('aria-expanded', 'false');
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('button', { name: 'Status' })).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}{Enter}');
    await waitFor(() => expect(canvas.getByRole('checkbox', { name: /^Critical/ })).toBeChecked());
    await userEvent.click(canvas.getByRole('button', { name: 'Clear all' }));
    await expect(canvas.getByRole('checkbox', { name: /^Critical/ })).not.toBeChecked();
  },
};
