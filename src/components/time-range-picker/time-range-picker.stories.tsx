import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TimeRangePicker, type TimeRange } from './time-range-picker';
import { resolveTimeRange, timePresets } from '@/lib/time-range';
export default {
  title: 'Components/Forms/TimeRangePicker',
  component: TimeRangePicker,
} satisfies Meta<typeof TimeRangePicker>;
const now = Date.UTC(2026, 9, 6, 12);
export const Matrix: StoryObj<typeof TimeRangePicker> = {
  render: () => (
    <div className="stack">
      {timePresets.map((p) => (
        <TimeRangePicker key={p.value} value={{ mode: 'relative', preset: p.value }} now={now} />
      ))}
      <TimeRangePicker
        value={{ mode: 'absolute', from: '2026-10-05T10:00:00Z', to: '2026-10-06T12:00:00Z' }}
        now={now}
      />
    </div>
  ),
};
function LinkedRange() {
  const [value, setValue] = useState<TimeRange>({ mode: 'relative', preset: '24h' });
  const resolved = resolveTimeRange(value, now);
  return (
    <div className="stack">
      <TimeRangePicker value={value} onValueChange={setValue} now={now} />
      <p className="mono muted">
        {resolved.from.toISOString()} → {resolved.to.toISOString()}
      </p>
    </div>
  );
}
export const Interactive: StoryObj<typeof TimeRangePicker> = { render: () => <LinkedRange /> };
export const CustomCalendar: StoryObj<typeof TimeRangePicker> = {
  args: {
    defaultOpen: true,
    now,
    defaultValue: { mode: 'absolute', from: '2026-10-05T08:30:00Z', to: '2026-10-06T12:00:00Z' },
  },
};
export const Presets: StoryObj<typeof TimeRangePicker> = { args: { defaultOpen: true, now } };
