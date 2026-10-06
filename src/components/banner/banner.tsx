import { useId, type ComponentProps, type ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info, Sparkles, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import './banner.css';

export interface BannerProps extends Omit<ComponentProps<'div'>, 'title'> {
  intent?: 'info' | 'success' | 'warning' | 'destroy' | 'ai';
  title?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
}
const icons = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  destroy: CircleAlert,
  ai: Sparkles,
};

export function Banner({
  intent = 'info',
  title,
  icon,
  action,
  onDismiss,
  dismissLabel = 'Dismiss notification',
  children,
  className,
  ...props
}: BannerProps) {
  const titleId = useId();
  const Icon = icons[intent];
  return (
    <div
      className={cn('aegis-banner', className)}
      data-intent={intent}
      role={intent === 'destroy' ? 'alert' : 'note'}
      aria-labelledby={title ? titleId : undefined}
      {...props}
    >
      <span className="aegis-banner-icon" aria-hidden="true">
        {icon ?? <Icon size={19} />}
      </span>
      <div className="aegis-banner-content">
        {title && (
          <div className="aegis-banner-title" id={titleId}>
            {title}
          </div>
        )}
        {children && <div className="aegis-banner-description">{children}</div>}
      </div>
      {action && <div className="aegis-banner-action">{action}</div>}
      {onDismiss && (
        <button
          className="aegis-banner-dismiss"
          type="button"
          aria-label={dismissLabel}
          onClick={onDismiss}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export type CalloutProps = BannerProps;
export function Callout(props: CalloutProps) {
  return <Banner {...props} />;
}
