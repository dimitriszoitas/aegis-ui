import {
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { DropdownMenu as Primitive } from 'radix-ui';
import { Check, ChevronRight, Circle, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import './dropdown-menu.css';

export interface DropdownMenuActionItem {
  type?: 'item';
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  intent?: 'default' | 'destroy';
  onSelect?: () => void;
}
export interface DropdownMenuCheckboxItem {
  type: 'checkbox';
  id: string;
  label: ReactNode;
  checked: boolean | 'indeterminate';
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  shortcut?: string;
}
export interface DropdownMenuRadioOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}
export interface DropdownMenuRadioGroup {
  type: 'radio-group';
  id: string;
  label?: ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  options: DropdownMenuRadioOption[];
}
export interface DropdownMenuSubmenu {
  type: 'submenu';
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  items: DropdownMenuEntry[];
}
export interface DropdownMenuGroup {
  type: 'group';
  id: string;
  label?: ReactNode;
  items: DropdownMenuEntry[];
}
export interface DropdownMenuSeparator {
  type: 'separator';
  id: string;
}
export type DropdownMenuEntry =
  | DropdownMenuActionItem
  | DropdownMenuCheckboxItem
  | DropdownMenuRadioGroup
  | DropdownMenuSubmenu
  | DropdownMenuGroup
  | DropdownMenuSeparator;
export interface DropdownMenuProps extends Omit<
  ComponentPropsWithoutRef<typeof Primitive.Root>,
  'children'
> {
  trigger: ReactElement;
  items: DropdownMenuEntry[];
  align?: ComponentPropsWithoutRef<typeof Primitive.Content>['align'];
  side?: ComponentPropsWithoutRef<typeof Primitive.Content>['side'];
  className?: string;
  label?: string;
}

function MenuEntries({ items }: { items: DropdownMenuEntry[] }) {
  return items.map((item) => {
    switch (item.type) {
      case 'separator':
        return <Primitive.Separator key={item.id} className="aegis-menu-separator" />;
      case 'group':
        return (
          <Primitive.Group key={item.id}>
            {item.label && (
              <Primitive.Label className="aegis-menu-label">{item.label}</Primitive.Label>
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
            className="aegis-menu-item aegis-menu-checkable"
          >
            <Primitive.ItemIndicator className="aegis-menu-indicator">
              {item.checked === 'indeterminate' ? <Minus size={14} /> : <Check size={14} />}
            </Primitive.ItemIndicator>
            <span className="aegis-menu-item-label">{item.label}</span>
            {item.shortcut && <kbd>{item.shortcut}</kbd>}
          </Primitive.CheckboxItem>
        );
      case 'radio-group':
        return (
          <Primitive.Group key={item.id}>
            {item.label && (
              <Primitive.Label className="aegis-menu-label">{item.label}</Primitive.Label>
            )}
            <Primitive.RadioGroup value={item.value} onValueChange={item.onValueChange}>
              {item.options.map((option) => (
                <Primitive.RadioItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="aegis-menu-item aegis-menu-checkable"
                >
                  <Primitive.ItemIndicator className="aegis-menu-indicator">
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
            <Primitive.SubTrigger disabled={item.disabled} className="aegis-menu-item">
              {item.icon && (
                <span className="aegis-menu-icon" aria-hidden>
                  {item.icon}
                </span>
              )}
              <span className="aegis-menu-item-label">{item.label}</span>
              <ChevronRight className="aegis-menu-sub-arrow" size={14} />
            </Primitive.SubTrigger>
            <Primitive.Portal>
              <Primitive.SubContent
                className="aegis-menu-content"
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
              'aegis-menu-item',
              item.intent === 'destroy' && 'aegis-menu-item-destroy',
            )}
          >
            {item.icon && (
              <span className="aegis-menu-icon" aria-hidden>
                {item.icon}
              </span>
            )}
            <span className="aegis-menu-item-label">{item.label}</span>
            {item.shortcut && <kbd>{item.shortcut}</kbd>}
          </Primitive.Item>
        );
    }
  });
}

export function DropdownMenu({
  trigger,
  items,
  align = 'end',
  side = 'bottom',
  className,
  label = 'Actions',
  modal = false,
  open,
  defaultOpen = false,
  onOpenChange,
  ...rootProps
}: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closingWithTab = useRef(false);
  function changeOpen(next: boolean) {
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  }
  return (
    <Primitive.Root
      {...rootProps}
      modal={modal}
      open={open ?? internalOpen}
      onOpenChange={changeOpen}
    >
      <Primitive.Trigger asChild ref={triggerRef}>
        {trigger}
      </Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          aria-label={label}
          className={cn('aegis-menu-content', className)}
          align={align}
          side={side}
          sideOffset={7}
          collisionPadding={12}
          onKeyDownCapture={(event) => {
            if (event.key === 'Tab') {
              // Unmount before the browser chooses its next tab stop from the trigger.
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
