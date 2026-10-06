import { useState, useId } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import { Clock3, Check } from '@/components/icon';
import { Popover } from '@/components/popover';
import { Button } from '@/components/button';
import { mergeDescriptionIds, useFieldControl, type FieldControlProps } from '@/components/field';
import { timePresets, resolveTimeRange, formatTimeRange, type TimeRange } from '@/lib/time-range';
import 'react-day-picker/style.css';
import '@/components/date-picker/date-picker.css';
import './time-range-picker.css';
export type { TimeRange, TimePreset } from '@/lib/time-range';
export interface TimeRangePickerProps extends FieldControlProps {
  value?: TimeRange;
  defaultValue?: TimeRange;
  onValueChange?: (range: TimeRange) => void;
  now?: Date | number;
  defaultOpen?: boolean;
  /** Accessible standalone label. A surrounding Field supplies its own label. */
  label?: string;
}
export function TimeRangePicker({
  value,
  defaultValue = { mode: 'relative', preset: '24h' },
  onValueChange,
  now,
  defaultOpen = false,
  label = 'Time range',
  ...fieldProps
}: TimeRangePickerProps) {
  const control = useFieldControl(fieldProps);
  const valueId = useId();
  const [internal, setInternal] = useState(defaultValue);
  const active = value ?? internal;
  const [open, setOpen] = useState(defaultOpen);
  const [custom, setCustom] = useState(active.mode === 'absolute');
  const initial = resolveTimeRange(active, now);
  const [range, setRange] = useState<DateRange>({ from: initial.from, to: initial.to });
  const [fromTime, setFromTime] = useState(initial.from.toISOString().slice(11, 16)),
    [toTime, setToTime] = useState(initial.to.toISOString().slice(11, 16));
  const errorId = useId();
  const commit = (v: TimeRange) => {
    if (control.disabled) return;
    setInternal(v);
    onValueChange?.(v);
    setOpen(false);
  };
  const absolute = (): TimeRange | undefined => {
    if (!range.from || !range.to || !fromTime || !toTime) return;
    const from = `${range.from.toISOString().slice(0, 10)}T${fromTime}:00.000Z`,
      to = `${range.to.toISOString().slice(0, 10)}T${toTime}:00.000Z`;
    try {
      resolveTimeRange({ mode: 'absolute', from, to });
      return { mode: 'absolute', from, to };
    } catch {
      return;
    }
  };
  return (
    <Popover
      label={label}
      className="time-range-popover"
      width={custom ? 528 : 240}
      align="end"
      footer={
        custom ? (
          <Button
            intent="function"
            disabled={!absolute()}
            onClick={() => {
              const value = absolute();
              if (value) commit(value);
            }}
          >
            Apply range
          </Button>
        ) : undefined
      }
      open={open && !control.disabled}
      onOpenChange={(next) => {
        if (control.disabled) return;
        setOpen(next);
        if (next) {
          const r = resolveTimeRange(active, now);
          setRange(r);
          setFromTime(r.from.toISOString().slice(11, 16));
          setToTime(r.to.toISOString().slice(11, 16));
          setCustom(active.mode === 'absolute');
        }
      }}
      trigger={
        <Button
          id={control.id}
          className="aegis-time-range-trigger"
          emphasis="ghost"
          leadingIcon={<Clock3 size={15} />}
          disabled={control.disabled}
          aria-label={
            control['aria-labelledby'] ? undefined : `${label}: ${formatTimeRange(active)}`
          }
          aria-labelledby={control['aria-labelledby']}
          aria-describedby={mergeDescriptionIds(
            control['aria-describedby'],
            control['aria-labelledby'] ? valueId : undefined,
          )}
          aria-invalid={control['aria-invalid']}
        >
          <span id={valueId}>{formatTimeRange(active)}</span>
        </Button>
      }
    >
      <div className="time-range-content">
        <div className="time-range-presets">
          <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
            Relative range
          </p>
          {timePresets.map((p) => (
            <Button
              key={p.value}
              emphasis="ghost"
              intent={
                active.mode === 'relative' && active.preset === p.value ? 'function' : 'default'
              }
              trailingIcon={
                active.mode === 'relative' && active.preset === p.value ? (
                  <Check size={14} />
                ) : undefined
              }
              onClick={() => {
                setCustom(false);
                commit({ mode: 'relative', preset: p.value });
              }}
            >
              {p.label}
            </Button>
          ))}
          <Button emphasis={custom ? 'secondary' : 'ghost'} onClick={() => setCustom(true)}>
            Custom range
          </Button>
        </div>
        {custom && (
          <div className="time-range-custom">
            <p className="muted">Absolute range · UTC</p>
            <DayPicker
              mode="range"
              timeZone="UTC"
              selected={range}
              onSelect={(v) => setRange(v ?? { from: undefined })}
              defaultMonth={range.from}
              navLayout="after"
            />
            <div className="time-range-clock">
              <label>
                Start time
                <input
                  type="time"
                  value={fromTime}
                  onChange={(e) => setFromTime(e.target.value)}
                  aria-describedby={!absolute() ? errorId : undefined}
                />
              </label>
              <label>
                End time
                <input
                  type="time"
                  value={toTime}
                  onChange={(e) => setToTime(e.target.value)}
                  aria-describedby={!absolute() ? errorId : undefined}
                />
              </label>
            </div>
            {!absolute() && (
              <p
                id={errorId}
                role="status"
                style={{ color: 'var(--color-destroy-fg)', fontSize: 'var(--text-xs)' }}
              >
                Choose a start and end date, with the end after the start.
              </p>
            )}
          </div>
        )}
      </div>
    </Popover>
  );
}
