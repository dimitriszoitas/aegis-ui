import { useId, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { Slider as Primitive } from 'radix-ui';
import { cn } from '@/lib/utils';
import { useFieldControl, type FieldControlProps } from '@/components/field';
import './slider.css';

export interface SliderProps extends Omit<ComponentPropsWithoutRef<typeof Primitive.Root>, 'children'>, FieldControlProps {
  label?: ReactNode;
  /** One name per thumb. Defaults to Value, or Minimum and Maximum for a range. */
  thumbLabels?: readonly string[];
  formatValue?: (value: number) => string;
  showValue?: boolean;
}

export function Slider({ label, thumbLabels, formatValue = String, showValue = true, value, defaultValue, onValueChange, min = 0, max = 100, step = 1, orientation = 'horizontal',
  id, required, disabled, invalid, className, 'aria-label': ariaLabel, 'aria-labelledby': labelledBy, 'aria-describedby': describedBy, 'aria-invalid': ariaInvalid, ...props }: SliderProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? [min]);
  const values = value ?? internalValue;
  const labelId = `aegis-slider-label-${useId()}`;
  const control = useFieldControl({ id, required, disabled, invalid, 'aria-labelledby': labelledBy ?? (label ? labelId : undefined), 'aria-describedby': describedBy, 'aria-invalid': ariaInvalid });
  return <div className="aegis-slider-field" data-orientation={orientation}>
    {(label || showValue) && <div className="aegis-slider-heading">
      {label && <span className="aegis-field-label" id={labelId}>{label}</span>}
      {showValue && <output className="aegis-slider-value" aria-hidden="true">{values.map(formatValue).join(' – ')}</output>}
    </div>}
    <Primitive.Root {...props} id={control.id} disabled={control.disabled} aria-invalid={control['aria-invalid']} aria-describedby={control['aria-describedby']}
      value={values} onValueChange={(next) => { if (value === undefined) setInternalValue(next); onValueChange?.(next); }} min={min} max={max} step={step} orientation={orientation}
      className={cn('aegis-slider', className)}>
      <Primitive.Track className="aegis-slider-track"><Primitive.Range className="aegis-slider-range" /></Primitive.Track>
      {values.map((current, index) => {
        const thumbLabel = thumbLabels?.[index] ?? (values.length === 1 ? 'Value' : index === 0 ? 'Minimum' : index === values.length - 1 ? 'Maximum' : `Threshold ${index + 1}`);
        const thumbLabelId = `${control.id}-thumb-label-${index}`;
        return <Primitive.Thumb key={index} className="aegis-slider-thumb" aria-label={control['aria-labelledby'] ? undefined : `${ariaLabel ?? (typeof label === 'string' ? label : 'Threshold')} ${thumbLabel.toLowerCase()}`}
          aria-labelledby={control['aria-labelledby'] ? `${control['aria-labelledby']}${values.length > 1 ? ` ${thumbLabelId}` : ''}` : undefined}
          aria-describedby={control['aria-describedby']} aria-invalid={control['aria-invalid']} aria-valuetext={formatValue(current)}>
          <span className="sr-only" id={thumbLabelId}>{thumbLabel}</span>
        </Primitive.Thumb>;
      })}
    </Primitive.Root>
  </div>;
}
