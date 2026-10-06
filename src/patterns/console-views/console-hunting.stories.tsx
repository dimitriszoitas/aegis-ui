import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ConsoleHunting } from './console-views';
import { ConsoleViewStoryFrame } from './console-view-story-helpers';
import { alerts, referenceTime } from '@/sample-data';
const meta = {
  title: 'Patterns/Console views/Hunting',
  component: ConsoleHunting,
  tags: ['autodocs'],
  args: { alerts, now: referenceTime, onOpenAlert: () => undefined },
  render: (args) => (
    <ConsoleViewStoryFrame>
      {(open) => <ConsoleHunting {...args} onOpenAlert={open} />}
    </ConsoleViewStoryFrame>
  ),
} satisfies Meta<typeof ConsoleHunting>;
export default meta;
export const Ready: StoryObj<typeof meta> = {};
export const PowerShellEvidence: StoryObj<typeof meta> = { args: { initialQuery: 'powershell' } };
export const NoResults: StoryObj<typeof meta> = { args: { initialQuery: 'unobserved-host-9999' } };
export const RunAndClear: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Hunt query' }), 'powershell');
    await userEvent.click(canvas.getByRole('button', { name: 'Run hunt' }));
    await expect(canvas.getByRole('grid', { name: 'Hunt result alerts' })).toBeVisible();
    await expect(canvas.getByText(/matching alerts/)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Clear' }));
    await expect(canvas.getByText('Start with an investigation lead')).toBeVisible();
  },
};
