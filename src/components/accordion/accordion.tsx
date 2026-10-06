import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Accordion as Primitive } from 'radix-ui';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import './accordion.css';

export interface AccordionItem {
  value: string;
  title: ReactNode;
  content: ReactNode;
  icon?: ReactNode;
  count?: number;
  disabled?: boolean;
}
export type AccordionProps = (
  | Omit<ComponentPropsWithoutRef<typeof Primitive.Root> & { type: 'single' }, 'children'>
  | Omit<ComponentPropsWithoutRef<typeof Primitive.Root> & { type: 'multiple' }, 'children'>
) & { items: AccordionItem[]; variant?: 'divided' | 'contained' };

/** Compact disclosure rows with consistent nesting; Radix supplies keyboard and ARIA behavior. */
export function Accordion({ items, variant = 'divided', className, ...props }: AccordionProps) {
  return (
    <Primitive.Root
      {...props}
      className={cn('aegis-accordion', `aegis-accordion-${variant}`, className)}
    >
      {items.map((item) => (
        <Primitive.Item
          value={item.value}
          key={item.value}
          disabled={item.disabled}
          className="aegis-accordion-item"
        >
          <Primitive.Header className="aegis-accordion-header">
            <Primitive.Trigger className="aegis-accordion-trigger">
              {item.icon && (
                <span className="aegis-accordion-icon" aria-hidden>
                  {item.icon}
                </span>
              )}
              <span className="aegis-accordion-title">{item.title}</span>
              {item.count !== undefined && (
                <span className="aegis-accordion-count">{item.count}</span>
              )}
              <ChevronDown size={16} className="aegis-accordion-chevron" aria-hidden />
            </Primitive.Trigger>
          </Primitive.Header>
          <Primitive.Content className="aegis-accordion-content">
            <div className="aegis-accordion-content-inner">{item.content}</div>
          </Primitive.Content>
        </Primitive.Item>
      ))}
    </Primitive.Root>
  );
}
