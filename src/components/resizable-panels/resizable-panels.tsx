import { useCallback, useState } from 'react';
import {
  Group,
  Panel,
  Separator,
  type GroupProps,
  type PanelProps,
  type SeparatorProps,
} from 'react-resizable-panels';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import './resizable-panels.css';
export type ResizablePanelsProps = GroupProps;
export function ResizablePanels({ className, ...props }: ResizablePanelsProps) {
  return <Group className={cn('aegis-resizable-panels', className)} {...props} />;
}
export type ResizablePanelProps = PanelProps;
export function ResizablePanel({ className, onResize, ...props }: ResizablePanelProps) {
  const [hidden, setHidden] = useState(
    () => props.defaultSize !== undefined && parseFloat(String(props.defaultSize)) === 0,
  );
  const handleResize = useCallback<NonNullable<PanelProps['onResize']>>(
    (size, id, previous) => {
      setHidden(size.asPercentage === 0);
      onResize?.(size, id, previous);
    },
    [onResize],
  );
  return (
    <Panel
      {...props}
      className={cn('aegis-resizable-panel', className)}
      onResize={handleResize}
      inert={hidden || props.inert}
      aria-hidden={hidden || props['aria-hidden']}
    />
  );
}
export interface ResizeHandleProps extends SeparatorProps {
  label: string;
  withGrip?: boolean;
}
/** Arrow keys resize. Enter toggles the preceding panel when it is collapsible. */
export function ResizeHandle({
  label,
  withGrip = true,
  className,
  children,
  ...props
}: ResizeHandleProps) {
  return (
    <Separator {...props} aria-label={label} className={cn('aegis-resize-handle', className)}>
      {children ??
        (withGrip && (
          <span aria-hidden="true">
            <GripVertical size={12} />
          </span>
        ))}
    </Separator>
  );
}
