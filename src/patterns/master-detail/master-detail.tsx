import { useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { IconButton } from '@/components/icon-button';
import { X } from '@/components/icon';
import { cn } from '@/lib/utils';
import './master-detail.css';
export interface MasterDetailProps {
  list: ReactNode;
  detail?: ReactNode;
  detailTitle?: string;
  open: boolean;
  onClose: () => void;
  emptyMessage?: string;
  className?: string;
}
/** A responsive, non-modal list and detail workspace. Narrow screens show one pane at a time. */
export function MasterDetail({
  list,
  detail,
  detailTitle = 'Record details',
  open,
  onClose,
  emptyMessage = 'Select a record to view its details.',
  className,
}: MasterDetailProps) {
  const title = useId(),
    heading = useRef<HTMLHeadingElement>(null),
    origin = useRef<HTMLElement | null>(null),
    previous = useRef(false);
  useLayoutEffect(() => {
    if (open && !previous.current) {
      origin.current = document.activeElement as HTMLElement;
      heading.current?.focus();
    } else if (!open && previous.current) {
      if (origin.current?.isConnected) origin.current.focus();
    }
    previous.current = open;
  }, [open]);
  return (
    <div className={cn('aegis-master-detail', className)} data-open={open}>
      <div className="aegis-master-layout">
        <div className="aegis-master-list">{list}</div>
        <section
          className="aegis-master-record"
          aria-labelledby={open ? title : undefined}
          aria-label={open ? undefined : 'Record preview'}
        >
          {open ? (
            <>
              <header>
                <h2 id={title} ref={heading} tabIndex={-1}>
                  {detailTitle}
                </h2>
                <IconButton emphasis="ghost" aria-label="Close record details" onClick={onClose}>
                  <X size={16} />
                </IconButton>
              </header>
              <div className="aegis-master-content">{detail}</div>
            </>
          ) : (
            <p className="aegis-master-empty">{emptyMessage}</p>
          )}
        </section>
      </div>
    </div>
  );
}
