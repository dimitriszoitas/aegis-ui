import { useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { Tabs as Primitive } from 'radix-ui';
import { cn } from '../../lib/utils';
import './tabs.css';

export interface TabItem {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  count?: number;
  content: ReactNode;
  disabled?: boolean;
}
export interface TabsProps extends Omit<
  ComponentPropsWithoutRef<typeof Primitive.Root>,
  'children'
> {
  items: TabItem[];
  variant?: 'line' | 'pill';
  label?: string;
  listClassName?: string;
  contentClassName?: string;
  /** One persistent workspace whose data changes with the selected tab. Preserves its local state. */
  sharedContent?: ReactNode;
}
export function Tabs({
  items,
  variant = 'line',
  label = 'Views',
  className,
  listClassName,
  contentClassName,
  defaultValue,
  value,
  onValueChange,
  sharedContent,
  ...props
}: TabsProps) {
  const firstEnabled = items.find((item) => !item.disabled)?.value;
  const [internalValue, setInternalValue] = useState(defaultValue ?? firstEnabled);
  const activeValue = value ?? internalValue;
  return (
    <Primitive.Root
      {...props}
      defaultValue={defaultValue ?? firstEnabled}
      value={value}
      onValueChange={(next) => {
        setInternalValue(next);
        onValueChange?.(next);
      }}
      className={cn('aegis-tabs', `aegis-tabs-${variant}`, className)}
    >
      <div className="aegis-tabs-overflow">
        <Primitive.List className={cn('aegis-tabs-list', listClassName)} aria-label={label}>
          {items.map((item) => (
            <Primitive.Trigger
              key={item.value}
              value={item.value}
              disabled={item.disabled}
              className="aegis-tabs-trigger"
            >
              {item.icon && (
                <span className="aegis-tabs-icon" aria-hidden>
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
              {item.count !== undefined && (
                <span className="aegis-tabs-count" aria-label={`${item.count} alerts`}>
                  {item.count > 99 ? '99+' : item.count}
                </span>
              )}
            </Primitive.Trigger>
          ))}
        </Primitive.List>
      </div>
      {sharedContent !== undefined ? (
        <Primitive.Content
          value={activeValue ?? ''}
          className={cn('aegis-tabs-content', contentClassName)}
        >
          {sharedContent}
        </Primitive.Content>
      ) : (
        items.map((item) => (
          <Primitive.Content
            key={item.value}
            value={item.value}
            className={cn('aegis-tabs-content', contentClassName)}
          >
            {item.content}
          </Primitive.Content>
        ))
      )}
    </Primitive.Root>
  );
}
