import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import './separator.css';

export interface SeparatorProps extends ComponentProps<'div'> {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}
export function Separator({
  orientation = 'horizontal',
  decorative = true,
  className,
  ...props
}: SeparatorProps) {
  return (
    <div
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      className={cn('aegis-separator', className)}
      data-orientation={orientation}
      {...props}
    />
  );
}
