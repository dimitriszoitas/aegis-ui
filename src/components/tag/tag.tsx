import type { ReactNode, CSSProperties } from 'react';
import { X } from '@/components/icon';
import type { Intent } from '@/components/button';
import { cn } from '@/lib/utils';
import './tag.css';
export interface TagProps {
  children: ReactNode;
  variant?: 'static' | 'removable' | 'interactive' | 'counter';
  size?: 'sm' | 'md';
  intent?: Intent | 'success' | 'warning';
  count?: number;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  onRemove?: () => void;
  removeLabel?: string;
  disabled?: boolean;
  className?: string;
}
export function Tag({
  children,
  variant = 'static',
  size = 'md',
  intent = 'default',
  count,
  selected = false,
  onSelectedChange,
  onRemove,
  removeLabel = 'Remove filter',
  disabled,
  className,
}: TagProps) {
  const style =
    intent === 'default'
      ? undefined
      : ({
          '--tag-fg': `var(--color-${intent}-fg)`,
          '--tag-bg': `var(--color-${intent}-soft)`,
        } as CSSProperties);
  const props = {
    className: cn('tag', className),
    style,
    'data-size': size,
    'data-intent': intent,
    'data-selected': selected,
  };
  if (variant === 'interactive')
    return (
      <button
        {...props}
        type="button"
        disabled={disabled}
        aria-pressed={selected}
        onClick={() => onSelectedChange?.(!selected)}
      >
        {children}
      </button>
    );
  return (
    <span {...props}>
      {children}
      {variant === 'counter' && <span className="tag-count">{count ?? 0}</span>}
      {variant === 'removable' && (
        <button
          type="button"
          className="tag-remove"
          aria-label={removeLabel}
          disabled={disabled}
          onClick={onRemove}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
              e.preventDefault();
              onRemove?.();
            }
          }}
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}
export { Tag as Chip };
export type ChipProps = TagProps;
