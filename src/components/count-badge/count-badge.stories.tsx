import type { Meta, StoryObj } from '@storybook/react-vite';
import { CountBadge } from './count-badge';
export default { title: 'Components/Tags/CountBadge', component: CountBadge } satisfies Meta<
  typeof CountBadge
>;
export const Matrix: StoryObj<typeof CountBadge> = {
  render: () => (
    <div className="row">
      {[0, 8, 48, 150].map((count) => (
        <CountBadge count={count} label="open alerts" key={count} />
      ))}
    </div>
  ),
};
