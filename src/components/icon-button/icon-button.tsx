import { Tooltip as RadixTooltip } from 'radix-ui';
import { Button, type ButtonProps } from '@/components/button';
import { cn } from '@/lib/utils';
import './icon-button.css';
export interface IconButtonProps extends Omit<ButtonProps, 'leadingIcon' | 'trailingIcon'> {
  'aria-label': string;
  tooltip?: boolean;
}
export function IconButton({
  'aria-label': label,
  tooltip = true,
  className,
  children,
  ...props
}: IconButtonProps) {
  const button = (
    <Button aria-label={label} {...props} className={cn('aegis-icon-button', className)}>
      {children}
    </Button>
  );
  return tooltip ? (
    <RadixTooltip.Provider delayDuration={350}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{button}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content className="icon-button-tooltip" sideOffset={7}>
            {label}
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  ) : (
    button
  );
}
