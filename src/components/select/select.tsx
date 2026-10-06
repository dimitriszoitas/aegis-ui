import { useId, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { Select as Primitive } from 'radix-ui';
import { Check, ChevronDown, ChevronUp } from '@/components/icon';
import { cn } from '@/lib/utils';
import { useFieldControl, type FieldControlProps } from '@/components/field';
import { useModalIsolation } from '@/components/modal/use-modal-isolation';
import './select.css';

export interface SelectOption {
  /** Stable, nonempty form value. */
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
  group?: string;
}

export interface SelectProps
  extends Omit<ComponentPropsWithoutRef<typeof Primitive.Root>, 'children'>, FieldControlProps {
  options: readonly SelectOption[];
  label?: ReactNode;
  'aria-label'?: string;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  contentClassName?: string;
}

function SelectContent({
  isolate,
  ...props
}: ComponentPropsWithoutRef<typeof Primitive.Content> & { isolate: boolean }) {
  const contentRef = useRef<HTMLDivElement>(null);
  useModalIsolation(contentRef, isolate);
  return <Primitive.Content {...props} ref={contentRef} />;
}

/** A form-compatible single select with Radix keyboard navigation and typeahead. */
export function Select({
  options,
  value,
  defaultValue = '',
  onValueChange,
  open,
  defaultOpen = false,
  onOpenChange,
  label,
  placeholder = 'Choose an option',
  size = 'md',
  className,
  contentClassName,
  id,
  required,
  disabled,
  invalid,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open ?? internalOpen;
  const selectedValue = value ?? internalValue;
  const labelId = `aegis-select-label-${useId()}`;
  const control = useFieldControl({
    id,
    required,
    disabled,
    invalid,
    'aria-labelledby': labelledBy ?? (label ? labelId : undefined),
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
  });
  const selected = options.find((option) => option.value === selectedValue);
  const groups = [...new Set(options.map((option) => option.group ?? ''))];
  return (
    <div className={cn('aegis-select-field', className)}>
      {label && (
        <label id={labelId} htmlFor={control.id} className="aegis-field-label">
          {label}
        </label>
      )}
      <Primitive.Root
        {...props}
        open={isOpen}
        onOpenChange={(next) => {
          if (open === undefined) setInternalOpen(next);
          onOpenChange?.(next);
        }}
        value={selectedValue}
        required={control.required}
        disabled={control.disabled}
        onValueChange={(next) => {
          if (value === undefined) setInternalValue(next);
          onValueChange?.(next);
        }}
      >
        <Primitive.Trigger
          id={control.id}
          className="aegis-select-trigger"
          data-size={size}
          aria-label={ariaLabel}
          aria-labelledby={control['aria-labelledby']}
          aria-describedby={control['aria-describedby']}
          aria-invalid={control['aria-invalid']}
        >
          {selected?.icon && (
            <span className="aegis-select-icon" aria-hidden="true">
              {selected.icon}
            </span>
          )}
          <Primitive.Value placeholder={placeholder} />
          <Primitive.Icon className="aegis-select-chevron">
            <ChevronDown size={16} aria-hidden="true" />
          </Primitive.Icon>
        </Primitive.Trigger>
        <Primitive.Portal>
          <SelectContent
            isolate={isOpen}
            position="popper"
            sideOffset={6}
            collisionPadding={12}
            className={cn('aegis-select-content', contentClassName)}
            aria-label={ariaLabel}
            aria-labelledby={control['aria-labelledby']}
          >
            <Primitive.ScrollUpButton className="aegis-select-scroll">
              <ChevronUp size={16} aria-hidden="true" />
            </Primitive.ScrollUpButton>
            <Primitive.Viewport
              className="aegis-select-viewport"
              role="group"
              aria-label="Available options"
              tabIndex={0}
            >
              {groups.map((group) => (
                <Primitive.Group key={group}>
                  {group && (
                    <Primitive.Label className="aegis-select-group-label">{group}</Primitive.Label>
                  )}
                  {options
                    .filter((option) => (option.group ?? '') === group)
                    .map((option) => (
                      <Primitive.Item
                        className="aegis-select-option"
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                        textValue={option.label}
                        aria-describedby={
                          option.description
                            ? `${control.id}-${encodeURIComponent(option.value)}-description`
                            : undefined
                        }
                      >
                        {option.icon && (
                          <span className="aegis-select-icon" aria-hidden="true">
                            {option.icon}
                          </span>
                        )}
                        <span className="aegis-select-option-copy">
                          <Primitive.ItemText>{option.label}</Primitive.ItemText>
                          {option.description && (
                            <span
                              id={`${control.id}-${encodeURIComponent(option.value)}-description`}
                              className="aegis-select-option-description"
                            >
                              {option.description}
                            </span>
                          )}
                        </span>
                        <Primitive.ItemIndicator className="aegis-select-check">
                          <Check size={16} aria-hidden="true" />
                        </Primitive.ItemIndicator>
                      </Primitive.Item>
                    ))}
                </Primitive.Group>
              ))}
              {options.length === 0 && (
                <Primitive.Item
                  value="aegis-no-options"
                  disabled
                  className="aegis-select-no-options"
                >
                  <Primitive.ItemText>No options available</Primitive.ItemText>
                </Primitive.Item>
              )}
            </Primitive.Viewport>
            <Primitive.ScrollDownButton className="aegis-select-scroll">
              <ChevronDown size={16} aria-hidden="true" />
            </Primitive.ScrollDownButton>
          </SelectContent>
        </Primitive.Portal>
      </Primitive.Root>
    </div>
  );
}
