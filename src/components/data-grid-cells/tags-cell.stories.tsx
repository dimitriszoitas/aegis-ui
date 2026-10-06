import type { Meta, StoryObj } from '@storybook/react-vite';
import { TagsCell } from './data-grid-cells';
export default {
  title: 'Components/Data grid/Tags cell',
  component: TagsCell,
  tags: ['autodocs'],
  args: { tags: ['execution', 'powershell', 'office-child', 'endpoint'] },
} satisfies Meta<typeof TagsCell>;
export const Matrix: StoryObj<typeof TagsCell> = {
  render: () => (
    <div className="stack">
      <TagsCell tags={['execution', 'powershell', 'office-child', 'endpoint']} />
      <TagsCell tags={['identity', 'travel']} maxVisible={1} />
      <TagsCell tags={['credential-access', 'brute-force']} maxVisible={0} />
      <TagsCell tags={[]} />
    </div>
  ),
};
