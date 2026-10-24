import type { Meta, StoryObj } from '@storybook/react-vite';
import { CopyButton } from './copy-button';
export default {
  title: 'Components/Actions/CopyButton',
  component: CopyButton,
  args: { text: 'PRJ-0042', 'aria-label': 'Copy project ID' },
} satisfies Meta<typeof CopyButton>;
export const Matrix: StoryObj<typeof CopyButton> = {
  render: (args) => (
    <div className="row">
      <code>PRJ-0042</code>
      <CopyButton {...args} />
    </div>
  ),
};
