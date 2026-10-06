import {
  cloneElement,
  isValidElement,
  useId,
  type ButtonHTMLAttributes,
  type ReactNode,
  type ReactElement,
  type SVGProps,
} from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import './button.css';
export type Intent = 'default' | 'function' | 'destroy' | 'ai';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  emphasis?: 'filled' | 'soft' | 'ghost';
  intent?: Intent;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}
/** A shadcn-style native button, restyled with Aegis intent and surface tokens. */
export function Button({
  size = 'md',
  emphasis = 'filled',
  intent = 'default',
  loading = false,
  leadingIcon,
  trailingIcon,
  children,
  className,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const gradientId = `aegis-ai-${useId().replaceAll(':', '')}`;
  const gradientForeground = intent === 'ai' && emphasis !== 'filled';
  function paintIcon(node: ReactNode): ReactNode {
    if (!gradientForeground || !isValidElement(node)) return node;
    const icon = node as ReactElement<SVGProps<SVGSVGElement>>;
    return cloneElement(icon, { style: { ...icon.props.style, stroke: `url(#${gradientId})` } });
  }
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn('aegis-button', className)}
      data-size={size}
      data-emphasis={emphasis}
      data-intent={intent}
    >
      {gradientForeground && (
        <svg className="button-gradient-defs" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-ai-fg)" />
              <stop offset="100%" stopColor="var(--color-function-fg)" />
            </linearGradient>
          </defs>
        </svg>
      )}
      {leadingIcon && (
        <span className="button-icon">
          {paintIcon(loading ? <LoaderCircle className="button-spinner" size={16} /> : leadingIcon)}
        </span>
      )}
      {loading && !leadingIcon && (
        <span className="button-loading">
          {paintIcon(<LoaderCircle className="button-spinner" size={16} />)}
        </span>
      )}
      <span className={cn('button-label', loading && !leadingIcon && 'button-label-loading')}>
        {paintIcon(children)}
      </span>
      {trailingIcon && <span className="button-icon">{paintIcon(trailingIcon)}</span>}
    </button>
  );
}
