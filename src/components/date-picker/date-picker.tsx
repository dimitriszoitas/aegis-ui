import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { CalendarDays } from 'lucide-react';
import { Popover } from '@/components/popover';
import { Button } from '@/components/button';
import { useFieldControl, type FieldControlProps } from '@/components/field';
import 'react-day-picker/style.css';
import './date-picker.css';
export interface DatePickerProps extends FieldControlProps {
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (date: Date | undefined) => void;
  label?: string;
  disabled?: boolean;
  defaultOpen?: boolean;
}
export function DatePicker(allProps: DatePickerProps) {
  const {
    value,
    defaultValue,
    onValueChange,
    label = 'Choose date',
    defaultOpen,
    ...props
  } = allProps;
  const controlled = Object.prototype.hasOwnProperty.call(allProps, 'value');
  const [internal, setInternal] = useState(defaultValue),
    [open, setOpen] = useState(defaultOpen ?? false);
  const selected = controlled ? value : internal;
  const control = useFieldControl(props);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button
          {...control}
          disabled={control.disabled}
          emphasis="soft"
          leadingIcon={<CalendarDays size={16} />}
          aria-label={`${label}${selected ? `: ${selected.toLocaleDateString('en-GB', { timeZone: 'UTC' })}` : ''}`}
        >
          {selected
            ? selected.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                timeZone: 'UTC',
              })
            : label}
        </Button>
      }
    >
      <DayPicker
        mode="single"
        timeZone="UTC"
        selected={selected}
        defaultMonth={selected}
        onSelect={(date) => {
          if (!controlled) setInternal(date);
          onValueChange?.(date);
          setOpen(false);
        }}
        autoFocus
        navLayout="after"
      />
    </Popover>
  );
}
