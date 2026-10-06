import { forwardRef, useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';
import { mergeDescriptionIds, useFieldControl } from '@/components/field';
import './radio-group.css';

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps extends Omit<ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>, 'children'> {
  options: readonly RadioOption[];
  label?: ReactNode;
  description?: ReactNode;
  invalid?: boolean;
}

/** Arrow-key navigation and native form values are provided by Radix. */
export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup({
  options, label, description, invalid, id, disabled, required, className, orientation = 'vertical',
  'aria-describedby': describedBy, 'aria-labelledby': labelledBy, 'aria-invalid': ariaInvalid, ...props
}, ref) {
  const localId = useId();
  const labelId = `aegis-radio-label-${localId}`;
  const descriptionId = `aegis-radio-help-${localId}`;
  const control = useFieldControl({ id, disabled, required, invalid, 'aria-invalid': ariaInvalid,
    'aria-labelledby': labelledBy ?? (label ? labelId : undefined),
    'aria-describedby': mergeDescriptionIds(describedBy, description ? descriptionId : undefined) });
  return <div className="aegis-radio-field">
    {label && <div className="aegis-field-label" id={labelId}>{label}</div>}
    {description && <div className="aegis-radio-description" id={descriptionId}>{description}</div>}
    <RadioGroupPrimitive.Root {...props} {...control} ref={ref} orientation={orientation} className={cn('aegis-radio-group', className)}>
      {options.map((option, index) => {
        const optionId = `${control.id}-option-${index}`;
        return <div className="aegis-radio-option" key={option.value} data-disabled={(control.disabled || option.disabled) || undefined}>
          <RadioGroupPrimitive.Item className="aegis-radio-control" id={optionId} value={option.value} disabled={option.disabled}
            aria-labelledby={`${optionId}-label`} aria-describedby={option.description ? `${optionId}-description` : undefined} aria-invalid={control['aria-invalid']}>
            <RadioGroupPrimitive.Indicator className="aegis-radio-indicator" />
          </RadioGroupPrimitive.Item>
          <div className="aegis-radio-copy">
            <label className="aegis-radio-label" id={`${optionId}-label`} htmlFor={optionId}>{option.label}</label>
            {option.description && <div className="aegis-radio-description" id={`${optionId}-description`}>{option.description}</div>}
          </div>
        </div>;
      })}
    </RadioGroupPrimitive.Root>
  </div>;
});
