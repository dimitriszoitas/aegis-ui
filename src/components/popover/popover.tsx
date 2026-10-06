import { useId, type ComponentPropsWithoutRef, type ReactElement, type ReactNode } from 'react';
import { Popover as Primitive } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import './popover.css';

export interface PopoverProps extends Omit<
  ComponentPropsWithoutRef<typeof Primitive.Root>,
  'children'
> {
  trigger: ReactElement;
  children: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  label?: string;
  side?: ComponentPropsWithoutRef<typeof Primitive.Content>['side'];
  align?: ComponentPropsWithoutRef<typeof Primitive.Content>['align'];
  className?: string;
  width?: number | string;
  showClose?: boolean;
}
export function Popover({
  trigger,
  children,
  title,
  description,
  label = 'Details',
  side = 'bottom',
  align = 'start',
  className,
  width,
  showClose = false,
  ...rootProps
}: PopoverProps) {
  const titleId = useId();
  const descriptionId = useId();
  return (
    <Primitive.Root {...rootProps}>
      <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={12}
          className={cn('aegis-popover', className)}
          style={{ width }}
          aria-label={title ? undefined : label}
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
        >
          {(title || showClose) && (
            <div className="aegis-popover-heading">
              {title && <h3 id={titleId}>{title}</h3>}
              {showClose && (
                <Primitive.Close className="aegis-popover-close" aria-label="Close popover">
                  <X size={16} />
                </Primitive.Close>
              )}
            </div>
          )}
          {description && (
            <p id={descriptionId} className="aegis-popover-description">
              {description}
            </p>
          )}
          {children}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
export const PopoverClose = Primitive.Close;
export type PopoverCloseProps = ComponentPropsWithoutRef<typeof Primitive.Close>;
