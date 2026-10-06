import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import './button.css';
export type Intent = 'default' | 'function' | 'destroy' | 'ai';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
 size?: 'sm' | 'md' | 'lg'; emphasis?: 'filled' | 'soft' | 'ghost'; intent?: Intent;
 loading?: boolean; leadingIcon?: ReactNode; trailingIcon?: ReactNode;
}
/** A shadcn-style native button, restyled with Aegis intent and surface tokens. */
export function Button({size='md',emphasis='filled',intent='default',loading=false,leadingIcon,trailingIcon,children,className,disabled,type='button',...props}:ButtonProps) {
 return <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={cn('aegis-button',className)} data-size={size} data-emphasis={emphasis} data-intent={intent}>
 {leadingIcon && <span className="button-icon">{loading ? <LoaderCircle className="button-spinner" size={16}/> : leadingIcon}</span>}
 {loading && !leadingIcon && <span className="button-loading"><LoaderCircle className="button-spinner" size={16}/></span>}
 <span className={cn('button-label',loading && !leadingIcon && 'button-label-loading')}>{children}</span>{trailingIcon && <span className="button-icon">{trailingIcon}</span>}
 </button>;
}
