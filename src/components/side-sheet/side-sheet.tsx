import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Dialog as Primitive } from 'radix-ui';
import { ChevronLeft, ChevronRight, X } from '@/components/icon';
import { cn } from '../../lib/utils';
import { useModalIsolation } from '../modal/use-modal-isolation';
import './side-sheet.css';

export interface SideSheetProps extends Omit<
  ComponentPropsWithoutRef<typeof Primitive.Root>,
  'children' | 'modal'
> {
  title: ReactNode;
  description?: ReactNode;
  trigger?: ReactElement;
  children?: ReactNode;
  footer?: ReactNode;
  /** Optional calls to action below the title row, alongside result navigation. */
  headerActions?: ReactNode;
  /** Backward-compatible alias for headerActions. */
  actions?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  docked?: boolean;
  /** One-based position within the current filtered result set. */
  position?: number;
  total?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  closeLabel?: string;
}
export interface SideSheetSectionProps {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}
export function SideSheetSection({ title, children, className }: SideSheetSectionProps) {
  return (
    <section className={cn('aegis-sheet-section', className)}>
      {title && <h3>{title}</h3>}
      {children}
    </section>
  );
}
export interface SideSheetFieldProps {
  label: ReactNode;
  children: ReactNode;
}
export function SideSheetField({ label, children }: SideSheetFieldProps) {
  return (
    <div className="aegis-sheet-field">
      <div className="aegis-sheet-field-label">{label}</div>
      <div className="aegis-sheet-field-value">{children}</div>
    </div>
  );
}

function SheetHeader({
  title,
  description,
  actions,
  position,
  total,
  onPrevious,
  onNext,
  onClose,
  titleId,
  descriptionId,
  docked,
  closeLabel = 'Close detail panel',
}: Pick<
  SideSheetProps,
  | 'title'
  | 'description'
  | 'actions'
  | 'position'
  | 'total'
  | 'onPrevious'
  | 'onNext'
  | 'docked'
  | 'closeLabel'
> & { onClose: () => void; titleId: string; descriptionId: string }) {
  return (
    <header className="aegis-sheet-header">
      <div className="aegis-sheet-heading-row">
        <div className="aegis-sheet-heading">
          {docked ? (
            <h2 id={titleId} className="aegis-sheet-title">
              {title}
            </h2>
          ) : (
            <Primitive.Title id={titleId} className="aegis-sheet-title">
              {title}
            </Primitive.Title>
          )}
          {description &&
            (docked ? (
              <p id={descriptionId} className="aegis-sheet-description">
                {description}
              </p>
            ) : (
              <Primitive.Description id={descriptionId} className="aegis-sheet-description">
                {description}
              </Primitive.Description>
            ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="aegis-sheet-icon-button"
          aria-label={closeLabel}
        >
          <X size={18} />
        </button>
      </div>
      {((position !== undefined && total !== undefined) || actions) && (
        <div className="aegis-sheet-toolbar">
          {position !== undefined && total !== undefined && (
            <div className="aegis-sheet-navigation" aria-label="Alert navigation">
              <button
                type="button"
                className="aegis-sheet-icon-button"
                onClick={onPrevious}
                disabled={!onPrevious || position <= 1}
                aria-label="Previous alert"
              >
                <ChevronLeft size={16} />
              </button>
              <span aria-live="polite">
                {position} of {total}
              </span>
              <button
                type="button"
                className="aegis-sheet-icon-button"
                onClick={onNext}
                disabled={!onNext || position >= total}
                aria-label="Next alert"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          {actions && <div className="aegis-sheet-actions">{actions}</div>}
        </div>
      )}
    </header>
  );
}

function OverlayContent({
  children,
  className,
  trigger,
  titleId,
  descriptionId,
}: {
  children: ReactNode;
  className: string;
  trigger?: ReactElement;
  titleId: string;
  descriptionId?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  useModalIsolation(ref);
  return (
    <Primitive.Content
      ref={ref}
      className={className}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onOpenAutoFocus={() => {
        previousFocus.current =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
      }}
      onCloseAutoFocus={(event) => {
        if (!trigger && previousFocus.current) {
          event.preventDefault();
          const element = previousFocus.current;
          requestAnimationFrame(() => element.focus());
        }
      }}
    >
      {children}
    </Primitive.Content>
  );
}

function DockedContent({
  children,
  className,
  titleId,
  descriptionId,
  onClose,
}: {
  children: ReactNode;
  className: string;
  titleId: string;
  descriptionId?: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const [previousFocus] = useState<HTMLElement | null>(() =>
    typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  useLayoutEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    const active = document.activeElement;
    const opener =
      active instanceof HTMLElement && !panel.contains(active) ? active : previousFocus;
    return () => {
      if (!panel.contains(document.activeElement) || !opener) return;
      requestAnimationFrame(() => {
        const current = document.activeElement;
        // Preserve focus when the user or the next view has already moved it elsewhere.
        if (opener.isConnected && (current === document.body || panel.contains(current))) {
          opener.focus({ preventScroll: true });
        }
      });
    };
  }, [previousFocus]);
  return (
    <aside
      ref={ref}
      className={className}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !event.defaultPrevented) {
          event.preventDefault();
          onClose();
        }
      }}
    >
      {children}
    </aside>
  );
}

export function SideSheet({
  open,
  defaultOpen = false,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  headerActions,
  actions,
  size = 'md',
  className,
  docked = false,
  position,
  total,
  onPrevious,
  onNext,
  closeLabel,
}: SideSheetProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open ?? internalOpen;
  const titleId = useId();
  const descriptionId = useId();
  function changeOpen(next: boolean) {
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  }
  const contents = (
    <>
      <SheetHeader
        title={title}
        description={description}
        actions={headerActions ?? actions}
        position={position}
        total={total}
        onPrevious={onPrevious}
        onNext={onNext}
        onClose={() => changeOpen(false)}
        titleId={titleId}
        descriptionId={descriptionId}
        docked={docked}
        closeLabel={closeLabel}
      />
      <div className="aegis-sheet-body" tabIndex={0} role="region" aria-labelledby={titleId}>
        {children}
      </div>
      {footer && <footer className="aegis-sheet-footer">{footer}</footer>}
    </>
  );
  const classes = cn(
    'aegis-sheet',
    `aegis-sheet-${size}`,
    docked && 'aegis-sheet-docked',
    className,
  );
  return (
    <Primitive.Root open={isOpen} onOpenChange={changeOpen} modal={!docked}>
      {trigger && <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>}
      {docked ? (
        isOpen && (
          <DockedContent
            className={classes}
            titleId={titleId}
            descriptionId={description ? descriptionId : undefined}
            onClose={() => changeOpen(false)}
          >
            {contents}
          </DockedContent>
        )
      ) : (
        <Primitive.Portal>
          <Primitive.Overlay data-aegis-overlay className="aegis-sheet-overlay" />
          <OverlayContent
            className={classes}
            trigger={trigger}
            titleId={titleId}
            descriptionId={description ? descriptionId : undefined}
          >
            {contents}
          </OverlayContent>
        </Primitive.Portal>
      )}
    </Primitive.Root>
  );
}
