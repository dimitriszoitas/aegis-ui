import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Dialog as Primitive } from 'radix-ui';
import { X } from '@/components/icon';
import { Button, type Intent } from '../button';
import { TextInput } from '../text-input';
import { cn } from '../../lib/utils';
import { useModalIsolation } from './use-modal-isolation';
import './modal.css';

export interface ModalProps extends Omit<
  ComponentPropsWithoutRef<typeof Primitive.Root>,
  'children' | 'modal'
> {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  trigger?: ReactElement;
  footer?: ReactNode;
  /** Width presets: 400px, 560px, and 800px, each clamped to the viewport. */
  size?: 'small' | 'regular' | 'large';
  /** Hide the visible header while retaining title and description for assistive technology. */
  showHeader?: boolean;
  className?: string;
  showClose?: boolean;
  closeLabel?: string;
  closeOnOutsideClick?: boolean;
  role?: 'dialog' | 'alertdialog';
}

function ModalContent({
  title,
  description,
  children,
  footer,
  size = 'regular',
  showHeader = true,
  className,
  showClose = true,
  closeLabel = 'Close dialog',
  closeOnOutsideClick = true,
  trigger,
  role = 'dialog',
}: Omit<ModalProps, 'open' | 'defaultOpen' | 'onOpenChange'>) {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const descriptionId = useId();
  useModalIsolation(contentRef);
  return (
    <Primitive.Content
      ref={contentRef}
      role={role}
      className={cn('aegis-modal', `aegis-modal-${size}`, className)}
      aria-describedby={description ? descriptionId : undefined}
      data-header={showHeader}
      data-close={showClose}
      onOpenAutoFocus={() => {
        previousFocus.current =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
      }}
      onCloseAutoFocus={(event) => {
        const content = contentRef.current;
        const current = document.activeElement;
        // A completed action may already have focused a different page or dialog.
        if (current !== document.body && !content?.contains(current)) {
          event.preventDefault();
          return;
        }
        if (!trigger && previousFocus.current) {
          event.preventDefault();
          const element = previousFocus.current;
          requestAnimationFrame(() => {
            const active = document.activeElement;
            if (element.isConnected && (active === document.body || content?.contains(active))) {
              element.focus({ preventScroll: true });
            }
          });
        }
      }}
      onPointerDownOutside={(event) => {
        if (!closeOnOutsideClick) event.preventDefault();
      }}
    >
      {showHeader ? (
        <header className="aegis-modal-header">
          <div className="aegis-modal-heading">
            <Primitive.Title className="aegis-modal-title">{title}</Primitive.Title>
            {description && (
              <Primitive.Description id={descriptionId} className="aegis-modal-description">
                {description}
              </Primitive.Description>
            )}
          </div>
          {showClose && (
            <Primitive.Close className="aegis-modal-close" aria-label={closeLabel}>
              <X size={18} />
            </Primitive.Close>
          )}
        </header>
      ) : (
        <>
          <Primitive.Title className="sr-only">{title}</Primitive.Title>
          {description && (
            <Primitive.Description id={descriptionId} className="sr-only">
              {description}
            </Primitive.Description>
          )}
          {showClose && (
            <Primitive.Close
              className="aegis-modal-close aegis-modal-close-floating"
              aria-label={closeLabel}
            >
              <X size={18} />
            </Primitive.Close>
          )}
        </>
      )}
      {children !== undefined && children !== null && (
        <div className="aegis-modal-body" tabIndex={0} role="region" aria-label="Dialog content">
          {children}
        </div>
      )}
      {footer && <footer className="aegis-modal-footer">{footer}</footer>}
    </Primitive.Content>
  );
}

export function Modal({ open, defaultOpen, onOpenChange, trigger, ...props }: ModalProps) {
  return (
    <Primitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} modal>
      {trigger && <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>}
      <Primitive.Portal>
        <Primitive.Overlay data-aegis-overlay className="aegis-modal-overlay" />
        <ModalContent {...props} trigger={trigger} />
      </Primitive.Portal>
    </Primitive.Root>
  );
}
export const Dialog = Modal;
export type DialogProps = ModalProps;
export const ModalClose = Primitive.Close;
export type ModalCloseProps = ComponentPropsWithoutRef<typeof Primitive.Close>;

export interface ConfirmDialogProps extends Omit<ModalProps, 'footer' | 'size' | 'role'> {
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmationText?: string;
  intent?: Extract<Intent, 'function' | 'destroy'>;
  loading?: boolean;
}
export function ConfirmDialog({
  title,
  description,
  trigger,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  onConfirm,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  confirmationText,
  intent = 'destroy',
  loading = false,
  ...props
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [value, setValue] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const id = useId();
  const isOpen = open ?? internalOpen;
  const busy = loading || pending;
  const confirmed = !confirmationText || value === confirmationText;
  useEffect(() => {
    if (!isOpen) {
      setValue('');
      setError('');
    }
  }, [isOpen]);
  function changeOpen(next: boolean) {
    if (busy && !next) return;
    if (next) {
      setValue('');
      setError('');
    }
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  }
  async function confirm() {
    if (!confirmed || busy) return;
    setPending(true);
    setError('');
    try {
      await onConfirm();
      if (open === undefined) setInternalOpen(false);
      onOpenChange?.(false);
      setValue('');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'The action could not be completed. Try again.',
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal
      {...props}
      title={title}
      description={description}
      trigger={trigger}
      open={isOpen}
      onOpenChange={changeOpen}
      size="small"
      role="alertdialog"
      closeOnOutsideClick={false}
      showClose={!busy}
      footer={
        <>
          <Button emphasis="ghost" disabled={busy} onClick={() => changeOpen(false)}>
            {cancelLabel}
          </Button>
          <Button
            intent={intent}
            disabled={!confirmed}
            loading={busy}
            onClick={() => void confirm()}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
      {confirmationText && (
        <div className="aegis-confirm-field">
          <TextInput
            id={id}
            label={
              <>
                Type <strong>{confirmationText}</strong> to confirm
              </>
            }
            value={value}
            onValueChange={setValue}
            autoComplete="off"
            disabled={busy}
          />
        </div>
      )}
      {error && (
        <p className="aegis-confirm-error" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}
