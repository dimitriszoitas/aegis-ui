import type { HTMLAttributes, ReactNode } from 'react';
import {
  CheckCircle2,
  CircleAlert,
  Info,
  LoaderCircle,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react';
import {
  Toaster as SonnerToaster,
  toast as sonnerToast,
  type ToasterProps as SonnerToasterProps,
} from 'sonner';
import { cn } from '../../lib/utils';
import './toast.css';

export type ToastIntent = 'info' | 'success' | 'warning' | 'destroy' | 'ai' | 'loading';
export interface ToastAction {
  label: string;
  onClick: () => void;
}
export interface ToastProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  intent?: ToastIntent;
  action?: ToastAction;
  onDismiss?: () => void;
}
const icons = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  destroy: CircleAlert,
  ai: Sparkles,
  loading: LoaderCircle,
};
export function Toast({
  title,
  description,
  intent = 'info',
  action,
  onDismiss,
  className,
  ...props
}: ToastProps) {
  const Icon = icons[intent];
  return (
    <div role="status" {...props} className={cn('aegis-toast', `aegis-toast-${intent}`, className)}>
      <Icon
        size={18}
        className={cn('aegis-toast-icon', intent === 'loading' && 'aegis-toast-spinning')}
        aria-hidden
      />
      <div className="aegis-toast-body">
        <div className="aegis-toast-title">{title}</div>
        {description && <div className="aegis-toast-description">{description}</div>}
        {action && (
          <button type="button" className="aegis-toast-action" onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          className="aegis-toast-dismiss"
          aria-label="Dismiss notification"
          onClick={onDismiss}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
export type ToasterProps = SonnerToasterProps;
export function Toaster({ className, toastOptions, ...props }: ToasterProps) {
  return (
    <SonnerToaster
      position="bottom-right"
      offset={12}
      gap={12}
      visibleToasts={4}
      className={cn('aegis-toaster', className)}
      {...props}
      toastOptions={{
        ...toastOptions,
        unstyled: true,
        classNames: { toast: 'aegis-sonner-toast', ...toastOptions?.classNames },
      }}
    />
  );
}
export interface ShowToastOptions extends Pick<
  ToastProps,
  'title' | 'description' | 'intent' | 'action'
> {
  id?: string | number;
  duration?: number;
  toasterId?: string;
}
export function showToast({
  title,
  description,
  intent = 'info',
  action,
  duration = 5000,
  id,
  toasterId,
}: ShowToastOptions) {
  return sonnerToast.custom(
    (toastId) => (
      <Toast
        title={title}
        description={description}
        intent={intent}
        action={
          action
            ? {
                label: action.label,
                onClick: () => {
                  action.onClick();
                  sonnerToast.dismiss(toastId);
                },
              }
            : undefined
        }
        onDismiss={() => sonnerToast.dismiss(toastId)}
      />
    ),
    { id, duration: intent === 'loading' ? Infinity : duration, toasterId },
  );
}
export const dismissToast = sonnerToast.dismiss;
