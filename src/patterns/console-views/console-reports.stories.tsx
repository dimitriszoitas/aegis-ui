import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ConsoleReports } from './console-views';
import { alerts } from '@/sample-data';
const meta = {
  title: 'Patterns/Console views/Reports',
  component: ConsoleReports,
  tags: ['autodocs'],
  args: { alerts, scopeLabel: 'Last 24 hours' },
} satisfies Meta<typeof ConsoleReports>;
export default meta;
export const CurrentScope: StoryObj<typeof meta> = {};
export const GroupBySource: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Source' }));
    await expect(canvas.getByRole('columnheader', { name: 'Source' })).toBeVisible();
    await expect(canvas.getByRole('rowheader', { name: 'EDR' })).toBeVisible();
  },
};
export const EmptyScope: StoryObj<typeof meta> = { args: { alerts: [] } };
