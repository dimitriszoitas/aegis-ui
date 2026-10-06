import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ConsoleIncidents } from './console-views';
import { ConsoleViewStoryFrame } from './console-view-story-helpers';
import { alerts, referenceTime } from '@/sample-data';
const meta = {
  title: 'Patterns/Console views/Incidents',
  component: ConsoleIncidents,
  tags: ['autodocs'],
  args: { alerts, now: referenceTime, onOpenAlert: () => undefined },
  render: (args) => (
    <ConsoleViewStoryFrame>
      {(open) => <ConsoleIncidents {...args} onOpenAlert={open} />}
    </ConsoleViewStoryFrame>
  ),
} satisfies Meta<typeof ConsoleIncidents>;
export default meta;
export const EntityGroups: StoryObj<typeof meta> = {};
export const SearchGroups: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole('searchbox', { name: 'Search investigation groups' }),
      'WS-LON-082',
    );
    await expect(canvas.getByRole('button', { name: /WS-LON-082.*host/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  },
};
export const EmptyScope: StoryObj<typeof meta> = { args: { alerts: [] } };
