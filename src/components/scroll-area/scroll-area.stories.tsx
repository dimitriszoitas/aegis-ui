import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScrollArea } from './scroll-area';
export default { title: 'Components/Utilities/ScrollArea', component: ScrollArea } satisfies Meta<
  typeof ScrollArea
>;
export const Matrix: StoryObj<typeof ScrollArea> = {
  render: () => (
    <ScrollArea label="Authentication event stream" maxHeight={240} className="surface">
      {Array.from({ length: 24 }, (_, index) => (
        <p
          key={index}
          className="mono"
          style={{ fontSize: 'var(--text-xs)' }}
        >{`2026-10-06T08:${String(index + 10).padStart(2, '0')}:24Z · WS-ATH-114 · Authentication ${index % 3 === 0 ? 'denied' : 'succeeded'} · k.nakamura`}</p>
      ))}
    </ScrollArea>
  ),
};
