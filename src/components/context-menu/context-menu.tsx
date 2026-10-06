import { useRef, useState, type ComponentPropsWithoutRef, type ReactElement } from 'react';
import { flushSync } from 'react-dom';
import { ContextMenu as Primitive } from 'radix-ui';
import { Check, ChevronRight, Circle, Minus } from 'lucide-react';
import type { DropdownMenuEntry } from '../dropdown-menu';
import { cn } from '../../lib/utils';
import './context-menu.css';

export type ContextMenuEntry = DropdownMenuEntry;
export interface ContextMenuProps extends Omit<
  ComponentPropsWithoutRef<typeof Primitive.Root>,
  'children'
> {
  children: ReactElement;
  items: ContextMenuEntry[];
  defaultOpen?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
}

function MenuEntries({ items }: { items: ContextMenuEntry[] }) {
  return items.map((item) => {
    switch (item.type) {
      case 'separator':
        return <Primitive.Separator key={item.id} className="aegis-context-separator" />;
      case 'group':
        return (
          <Primitive.Group key={item.id}>
            {item.label && (
              <Primitive.Label className="aegis-context-label">{item.label}</Primitive.Label>
            )}
            <MenuEntries items={item.items} />
          </Primitive.Group>
        );
      case 'checkbox':
        return (
          <Primitive.CheckboxItem
            key={item.id}
            checked={item.checked}
            onCheckedChange={item.onCheckedChange}
            disabled={item.disabled}
            onSelect={(event) => event.preventDefault()}
            className="aegis-context-item aegis-context-checkable"
          >
            <Primitive.ItemIndicator className="aegis-context-indicator">
              {item.checked === 'indeterminate' ? <Minus size={14} /> : <Check size={14} />}
            </Primitive.ItemIndicator>
            <span className="aegis-context-item-label">{item.label}</span>
            {item.shortcut && <kbd>{item.shortcut}</kbd>}
          </Primitive.CheckboxItem>
        );
      case 'radio-group':
        return (
          <Primitive.Group key={item.id}>
            {item.label && (
              <Primitive.Label className="aegis-context-label">{item.label}</Primitive.Label>
            )}
            <Primitive.RadioGroup value={item.value} onValueChange={item.onValueChange}>
              {item.options.map((option) => (
                <Primitive.RadioItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="aegis-context-item aegis-context-checkable"
                >
                  <Primitive.ItemIndicator className="aegis-context-indicator">
                    <Circle size={7} fill="currentColor" />
                  </Primitive.ItemIndicator>
                  {option.label}
                </Primitive.RadioItem>
              ))}
            </Primitive.RadioGroup>
          </Primitive.Group>
        );
      case 'submenu':
        return (
          <Primitive.Sub key={item.id}>
            <Primitive.SubTrigger disabled={item.disabled} className="aegis-context-item">
              {item.icon && (
                <span className="aegis-context-icon" aria-hidden>
                  {item.icon}
                </span>
              )}
              <span className="aegis-context-item-label">{item.label}</span>
              <ChevronRight className="aegis-context-sub-arrow" size={14} />
            </Primitive.SubTrigger>
            <Primitive.Portal>
              <Primitive.SubContent
                className="aegis-context-content"
                sideOffset={5}
                collisionPadding={12}
              >
                <MenuEntries items={item.items} />
              </Primitive.SubContent>
            </Primitive.Portal>
          </Primitive.Sub>
        );
      default:
        return (
          <Primitive.Item
            key={item.id}
            disabled={item.disabled}
            onSelect={item.onSelect}
            className={cn(
              'aegis-context-item',
              item.intent === 'destroy' && 'aegis-context-item-destroy',
            )}
          >
            {item.icon && (
              <span className="aegis-context-icon" aria-hidden>
                {item.icon}
              </span>
            )}
            <span className="aegis-context-item-label">{item.label}</span>
            {item.shortcut && <kbd>{item.shortcut}</kbd>}
          </Primitive.Item>
        );
    }
  });
}

export function ContextMenu({
  children,
  items,
  open,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  label = 'Context actions',
  className,
  modal = false,
  ...rootProps
}: ContextMenuProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const closingWithTab = useRef(false);
  function changeOpen(next: boolean) {
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  }
  return (
    <Primitive.Root
      {...rootProps}
      open={open ?? internalOpen}
      onOpenChange={changeOpen}
      modal={modal}
    >
      <Primitive.Trigger
        asChild
        ref={triggerRef}
        disabled={disabled}
        tabIndex={0}
        onKeyDown={(event) => {
          if (
            !disabled &&
            (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))
          ) {
            event.preventDefault();
            const bounds = event.currentTarget.getBoundingClientRect();
            event.currentTarget.dispatchEvent(
              new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                clientX: bounds.left + 12,
                clientY: bounds.top + Math.min(bounds.height, 32),
              }),
            );
          }
        }}
      >
        {children}
      </Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          aria-label={label}
          className={cn('aegis-context-content', className)}
          collisionPadding={12}
          onKeyDownCapture={(event) => {
            if (event.key === 'Tab') {
              event.stopPropagation();
              closingWithTab.current = true;
              flushSync(() => changeOpen(false));
              triggerRef.current?.focus();
            }
          }}
          onCloseAutoFocus={(event) => {
            if (closingWithTab.current) {
              event.preventDefault();
              closingWithTab.current = false;
            }
          }}
        >
          <MenuEntries items={items} />
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
