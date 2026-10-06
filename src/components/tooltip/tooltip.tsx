import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react';
import { Tooltip as Primitive } from 'radix-ui';
import { cn } from '../../lib/utils';
import './tooltip.css';

export interface TooltipProps {
  children: ReactElement;
  content: ReactNode;
  side?: ComponentPropsWithoutRef<typeof Primitive.Content>['side'];
  align?: ComponentPropsWithoutRef<typeof Primitive.Content>['align'];
  delayDuration?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function Tooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  delayDuration = 300,
  open,
  defaultOpen,
  onOpenChange,
  className,
  disabled = false,
}: TooltipProps) {
  if (disabled || content === undefined || content === null) return children;
  return (
    <Primitive.Provider delayDuration={delayDuration}>
      <Primitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        <Primitive.Trigger asChild>{children}</Primitive.Trigger>
        <Primitive.Portal>
          <Primitive.Content
            className={cn('aegis-tooltip', className)}
            side={side}
            align={align}
            sideOffset={7}
            collisionPadding={12}
          >
            {content}
            <Primitive.Arrow className="aegis-tooltip-arrow" width={10} height={5} />
          </Primitive.Content>
        </Primitive.Portal>
      </Primitive.Root>
    </Primitive.Provider>
  );
}

export interface RichTooltipProps extends Omit<TooltipProps, 'content'> {
  title: ReactNode;
  description: ReactNode;
  shortcut?: ReactNode;
}
export function RichTooltip({
  title,
  description,
  shortcut,
  className,
  ...props
}: RichTooltipProps) {
  return (
    <Tooltip
      {...props}
      className={cn('aegis-tooltip-rich', className)}
      content={
        <>
          <div className="aegis-tooltip-heading">
            {title}
            {shortcut && <kbd>{shortcut}</kbd>}
          </div>
          <div className="aegis-tooltip-description">{description}</div>
        </>
      }
    />
  );
}
