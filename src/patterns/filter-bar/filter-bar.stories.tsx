import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { analysts, referenceTime } from '@/sample-data';
import { createDefaultFilters, type FilterColumn, type FilterDensity } from '@/lib/filters';
import { FilterBar, type FilterBarProps } from './filter-bar';

const initialColumns: FilterColumn[] = [
  { id: 'title', label: 'Alert title', visible: true, hideable: false },
  { id: 'severity', label: 'Severity', visible: true },
  { id: 'source', label: 'Source', visible: true },
  { id: 'status', label: 'Status', visible: true },
  { id: 'assignee', label: 'Assignee', visible: false },
];
function Demo(args: FilterBarProps) {
  const [filters, setFilters] = useState(args.value);
  const [density, setDensity] = useState<FilterDensity>('default');
  const [columns, setColumns] = useState(initialColumns);
  return (
    <div className="surface" style={{ padding: 0 }}>
      <FilterBar
        {...args}
        value={filters}
        onValueChange={(next) => {
          setFilters(next);
          args.onValueChange(next);
        }}
        density={density}
        onDensityChange={setDensity}
        columns={columns}
        onColumnVisibilityChange={(id, visible) =>
          setColumns((current) =>
            current.map((column) => (column.id === id ? { ...column, visible } : column)),
          )
        }
      />
      <p className="muted" style={{ margin: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
        Viewing {density} rows · {columns.filter((column) => column.visible).length} columns visible
      </p>
    </div>
  );
}
const meta = {
  title: 'Patterns/FilterBar',
  component: FilterBar,
  parameters: { layout: 'padded' },
  args: { value: createDefaultFilters(), onValueChange: fn(), analysts, now: referenceTime },
  render: (args) => <Demo {...args} />,
} satisfies Meta<typeof FilterBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const AppliedFilters: Story = {
  args: {
    value: {
      ...createDefaultFilters(),
      savedViewId: undefined,
      severities: ['critical', 'high'],
      statuses: ['new'],
      sources: ['EDR'],
      assignees: [analysts[0].id],
      rules: [{ id: 'technique', field: 'mitre', operator: 'contains', value: 'T1059' }],
      timeRange: { mode: 'relative', preset: '7d' },
    },
  },
};
export const Disabled: Story = {
  args: {
    disabled: true,
    value: { ...createDefaultFilters(), severities: ['high'], savedViewId: undefined },
  },
};
export const BuilderOpen: Story = { args: { defaultBuilderOpen: true } };
export const QueryAndClear: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search alerts' }), 'PowerShell');
    await expect(canvas.getByRole('button', { name: 'Remove search filter' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Clear all' }));
    await expect(canvas.getByRole('searchbox', { name: 'Search alerts' })).toHaveValue('');
    await expect(
      canvas.queryByRole('button', { name: 'Remove search filter' }),
    ).not.toBeInTheDocument();
  },
};
export const ViewControls: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Compact rows' }));
    await expect(canvas.getByRole('button', { name: 'Compact rows' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Column settings' }));
    await userEvent.click(body.getByRole('checkbox', { name: 'Assignee' }));
    await expect(body.getByRole('checkbox', { name: 'Assignee' })).toBeChecked();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(canvas.getByRole('combobox', { name: 'Saved view' }));
    await userEvent.click(body.getByRole('option', { name: 'High priority' }));
    await expect(
      await canvas.findByRole('button', { name: 'Remove Critical severity filter' }),
    ).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Remove High severity filter' })).toBeVisible();
  },
};
export const BuildRule: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }));
    await userEvent.click(body.getByRole('combobox', { name: 'Value' }));
    await userEvent.click(body.getByRole('option', { name: 'EDR' }));
    await userEvent.click(await body.findByRole('button', { name: 'Apply filter' }));
    await expect(canvas.getByRole('button', { name: 'Remove Source is EDR filter' })).toBeVisible();
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Add filter' })).toHaveFocus());
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Remove Source is EDR filter' })).toHaveFocus();
    await userEvent.keyboard('{Delete}');
    await expect(
      canvas.queryByRole('button', { name: 'Remove Source is EDR filter' }),
    ).not.toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Add filter' })).toHaveFocus();
  },
};
