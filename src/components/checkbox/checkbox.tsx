import { forwardRef, useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { Check, Minus } from '@/components/icon';
import { cn } from '@/lib/utils';
import { mergeDescriptionIds, useFieldControl } from '@/components/field';
import './checkbox.css';

export type CheckboxCheckedState = boolean | 'indeterminate';
export interface CheckboxProps extends Omit<
  ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
  'children'
> {
  /** Compact controls use the same styling at 16px instead of 18px. */
  size?: 'sm' | 'md';
  label?: ReactNode;
  description?: ReactNode;
  invalid?: boolean;
  containerClassName?: string;
}

/** A form-compatible Radix checkbox including the mixed (indeterminate) state. */
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  {
    size = 'md',
    label,
    description,
    invalid,
    id,
    disabled,
    required,
    className,
    containerClassName,
    'aria-describedby': describedBy,
    'aria-labelledby': labelledBy,
    'aria-invalid': ariaInvalid,
    ...props
  },
  ref,
) {
  const localId = useId();
  const labelId = `aegis-checkbox-label-${localId}`;
  const descriptionId = `aegis-checkbox-help-${localId}`;
  const control = useFieldControl({
    id,
    disabled,
    required,
    invalid,
    'aria-invalid': ariaInvalid,
    'aria-labelledby': labelledBy ?? (label ? labelId : undefined),
    'aria-describedby': mergeDescriptionIds(describedBy, description ? descriptionId : undefined),
  });
  return (
    <div
      className={cn('aegis-checkbox-field', containerClassName)}
      data-size={size}
      data-disabled={control.disabled || undefined}
    >
      <CheckboxPrimitive.Root
        {...props}
        {...control}
        ref={ref}
        className={cn('aegis-checkbox-control', className)}
      >
        <CheckboxPrimitive.Indicator className="aegis-checkbox-indicator">
          <Check className="aegis-checkbox-check" size={14} strokeWidth={2.5} aria-hidden="true" />
          <Minus className="aegis-checkbox-mixed" size={14} strokeWidth={2.5} aria-hidden="true" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {(label || description) && (
        <div className="aegis-checkbox-copy">
          {label && (
            <label className="aegis-checkbox-label" id={labelId} htmlFor={control.id}>
              {label}
            </label>
          )}
          {description && (
            <div className="aegis-checkbox-description" id={descriptionId}>
              {description}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
