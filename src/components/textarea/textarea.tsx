import { forwardRef, useId, useImperativeHandle, useLayoutEffect, useRef, useState, type ChangeEvent, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { mergeDescriptionIds, useFieldControl } from '@/components/field';
import './textarea.css';

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'defaultValue'> {
  value?: string;
  defaultValue?: string;
  label?: ReactNode;
  invalid?: boolean;
  autoGrow?: boolean;
  maxRows?: number;
  showCount?: boolean;
  onValueChange?: (value: string) => void;
  textareaClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({
  value, defaultValue = '', label, invalid, disabled, required, id, autoGrow = false, maxRows = 10,
  showCount = false, maxLength, rows = 3, className, textareaClassName, style, onChange, onValueChange,
  'aria-describedby': describedBy, 'aria-labelledby': labelledBy, 'aria-invalid': ariaInvalid, ...props
}, forwardedRef) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const text = value ?? uncontrolledValue;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const localId = useId();
  const labelId = `aegis-textarea-label-${localId}`;
  const countId = `aegis-textarea-count-${localId}`;
  const control = useFieldControl({ id, required, disabled, invalid, 'aria-invalid': ariaInvalid, 'aria-labelledby': labelledBy ?? (label ? labelId : undefined), 'aria-describedby': mergeDescriptionIds(describedBy, showCount ? countId : undefined) });
  useImperativeHandle(forwardedRef, () => inputRef.current!);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input || !autoGrow) return;
    function resize() {
      if (!input) return;
      const computed = getComputedStyle(input);
      const lineHeight = parseFloat(computed.lineHeight) || 20;
      const padding = parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom);
      const border = parseFloat(computed.borderTopWidth) + parseFloat(computed.borderBottomWidth);
      const minimum = Math.max(1, rows) * lineHeight + padding + border;
      const maximum = Math.max(rows, maxRows) * lineHeight + padding + border;
      input.style.height = 'auto';
      input.style.height = `${Math.min(maximum, Math.max(minimum, input.scrollHeight + border))}px`;
      input.style.overflowY = input.scrollHeight + border > maximum ? 'auto' : 'hidden';
    }
    resize();
    let width = input.clientWidth;
    const observer = new ResizeObserver(() => {
      if (input.clientWidth !== width) { width = input.clientWidth; resize(); }
    });
    observer.observe(input);
    return () => observer.disconnect();
  }, [text, autoGrow, rows, maxRows]);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    if (value === undefined) setUncontrolledValue(event.currentTarget.value);
    onValueChange?.(event.currentTarget.value);
    onChange?.(event);
  }

  return <div className={cn('aegis-textarea', className)}>
    {label && <label id={labelId} htmlFor={control.id} className="aegis-field-label">{label}</label>}
    <textarea {...props} {...control} ref={inputRef} value={text} onChange={handleChange} rows={rows} maxLength={maxLength} style={style}
      className={cn('aegis-textarea-native', textareaClassName)} data-autogrow={autoGrow || undefined} />
    {showCount && <span id={countId} className="aegis-textarea-count">{text.length.toLocaleString()}{maxLength !== undefined ? ` / ${maxLength.toLocaleString()}` : ''} characters</span>}
  </div>;
});
