import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import './list.css';

export interface ListProps extends ComponentProps<'ul'> {
  density?: 'compact' | 'default' | 'comfortable';
  divided?: boolean;
}
export function List({ density = 'default', divided = false, className, ...props }: ListProps) {
  return (
    <ul
      className={cn('aegis-list', className)}
      data-density={density}
      data-divided={divided}
      {...props}
    />
  );
}

export interface ListItemProps extends Omit<ComponentProps<'li'>, 'title' | 'onSelect'> {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  avatar?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  selectable?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}
/** The primary row and trailing controls are siblings, so actions never nest inside a button. */
export function ListItem({
  title,
  description,
  icon,
  avatar,
  meta,
  actions,
  selectable = false,
  selected = false,
  disabled = false,
  onSelect,
  className,
  children,
  ...props
}: ListItemProps) {
  const content = (
    <>
      {(avatar || icon) && <span className="aegis-list-item-leading">{avatar || icon}</span>}
      <span className="aegis-list-item-copy">
        <span className="aegis-list-item-title">{title}</span>
        {description && <span className="aegis-list-item-description">{description}</span>}
      </span>
      {meta && <span className="aegis-list-item-meta">{meta}</span>}
    </>
  );
  return (
    <li
      className={cn('aegis-list-item', className)}
      data-selected={selected}
      data-disabled={disabled}
      {...props}
    >
      {selectable || onSelect ? (
        <button
          type="button"
          className="aegis-list-item-main"
          aria-pressed={selectable ? selected : undefined}
          onClick={onSelect}
          disabled={disabled}
        >
          {content}
        </button>
      ) : (
        <div className="aegis-list-item-main">{content}</div>
      )}
      {actions && <div className="aegis-list-item-actions">{actions}</div>}
      {children}
    </li>
  );
}
