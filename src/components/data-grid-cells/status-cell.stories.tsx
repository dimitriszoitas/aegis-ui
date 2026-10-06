import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusCell } from './data-grid-cells';
export default {
  title: 'Components/Data grid/Status cell',
  component: StatusCell,
  tags: ['autodocs'],
  args: { status: 'new' },
} satisfies Meta<typeof StatusCell>;
export const Matrix: StoryObj<typeof StatusCell> = {
  render: () => (
    <div className="row">
      {(['new', 'triaged', 'in-progress', 'resolved', 'false-positive'] as const).map((status) => (
        <StatusCell key={status} status={status} />
      ))}
    </div>
  ),
};
