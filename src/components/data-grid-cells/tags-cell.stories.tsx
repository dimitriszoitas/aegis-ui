import type { Meta, StoryObj } from '@storybook/react-vite';
import { TagsCell } from './data-grid-cells';
export default {
  title: 'Components/Data grid/Tags cell',
  component: TagsCell,
  tags: ['autodocs'],
  args: { tags: ['delivery', 'project', 'needs-review', 'workspace'] },
} satisfies Meta<typeof TagsCell>;
export const Matrix: StoryObj<typeof TagsCell> = {
  render: () => (
    <div className="stack">
      <TagsCell tags={['delivery', 'project', 'needs-review', 'workspace']} />
      <TagsCell tags={['onboarding', 'customer']} maxVisible={1} />
      <TagsCell tags={['payments', 'past-due']} maxVisible={0} />
      <TagsCell tags={[]} />
    </div>
  ),
};
