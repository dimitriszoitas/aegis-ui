import {
  useId,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Popover as Primitive } from 'radix-ui';
import { X } from '@/components/icon';
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
  /** Keep the accessible title while hiding the visible header. */
  showHeader?: boolean;
  footer?: ReactNode;
  density?: 'regular' | 'tight';
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
  showHeader = true,
  footer,
  density = 'regular',
  label = 'Details',
  side = 'bottom',
  align = 'start',
  className,
  width,
  showClose = false,
  ...rootProps
}: PopoverProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const hasHeader = showHeader && !!(title || description || showClose);
  return (
    <Primitive.Root {...rootProps}>
      <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          ref={contentRef}
          onOpenAutoFocus={(event) => {
            const control = [
              ...(contentRef.current?.querySelectorAll<HTMLElement>(
                'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]:not(.aegis-popover-body)',
              ) ?? []),
            ].find(
              (element) =>
                element.getClientRects().length > 0 &&
                !element.closest('[hidden], [inert], [aria-hidden="true"]'),
            );
            if (control) {
              event.preventDefault();
              control.focus({ preventScroll: true });
            }
          }}
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={12}
          className={cn('aegis-popover', className)}
          style={{ width }}
          data-density={density}
          data-header={hasHeader}
          data-close={showClose}
          aria-label={title ? undefined : label}
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
        >
          {hasHeader ? (
            <header className="aegis-popover-header">
              <div className="aegis-popover-heading">
                <div className="aegis-popover-heading-copy">
                  {title && <h3 id={titleId}>{title}</h3>}
                  {description && (
                    <p id={descriptionId} className="aegis-popover-description">
                      {description}
                    </p>
                  )}
                </div>
                {showClose && (
                  <Primitive.Close className="aegis-popover-close" aria-label="Close popover">
                    <X size={16} />
                  </Primitive.Close>
                )}
              </div>
            </header>
          ) : (
            <>
              {title && (
                <h3 id={titleId} className="sr-only">
                  {title}
                </h3>
              )}
              {description && (
                <p id={descriptionId} className="sr-only">
                  {description}
                </p>
              )}
              {showClose && (
                <Primitive.Close
                  className="aegis-popover-close aegis-popover-close-floating"
                  aria-label="Close popover"
                >
                  <X size={16} />
                </Primitive.Close>
              )}
            </>
          )}
          <div
            className="aegis-popover-body"
            tabIndex={0}
            role="region"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : label}
          >
            {children}
          </div>
          {footer && <footer className="aegis-popover-footer">{footer}</footer>}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
export const PopoverClose = Primitive.Close;
export type PopoverCloseProps = ComponentPropsWithoutRef<typeof Primitive.Close>;
