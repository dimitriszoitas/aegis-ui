import { useRef, useState, type ComponentProps } from 'react';
import { CheckCheck, ChevronDown, Sparkles, UserRoundCheck, UserRoundMinus, X } from 'lucide-react';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { DropdownMenu } from '@/components/dropdown-menu';
import { IconButton } from '@/components/icon-button';
import { Separator } from '@/components/separator';
import { StatusDot, statusLabels, type AlertStatus } from '@/components/status-badge';
import { cn } from '@/lib/utils';
import './bulk-actions-bar.css';

export interface BulkActionAnalyst {
  id: string;
  name: string;
  initials?: string;
}
export interface BulkActionsBarProps extends Omit<ComponentProps<'section'>, 'onError'> {
  selectedCount: number;
  analysts: readonly BulkActionAnalyst[];
  onAssign: (analystId: string | null) => void | Promise<void>;
  onStatusChange: (status: AlertStatus) => void | Promise<void>;
  onSummarize: () => void | Promise<void>;
  onClear: () => void;
  loading?: boolean;
  position?: 'fixed' | 'inline';
}
/** Floating selection actions. Async callbacks remain guarded until completion. */
export function BulkActionsBar({
  selectedCount,
  analysts,
  onAssign,
  onStatusChange,
  onSummarize,
  onClear,
  loading = false,
  position = 'fixed',
  className,
  onKeyDown,
  ...props
}: BulkActionsBarProps) {
  const [pending, setPending] = useState<string>();
  const [error, setError] = useState('');
  const pendingRef = useRef(false);
  const busy = loading || pending !== undefined;
  const count = Number.isFinite(selectedCount) ? Math.max(0, Math.floor(selectedCount)) : 0;
  async function perform(action: string, callback: () => void | Promise<void>) {
    if (pendingRef.current || loading) return;
    pendingRef.current = true;
    setPending(action);
    setError('');
    try {
      await callback();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The selected alerts could not be updated. Try again.',
      );
    } finally {
      pendingRef.current = false;
      setPending(undefined);
    }
  }
  if (count === 0) return null;
  return (
    <section
      {...props}
      className={cn('aegis-bulk-actions', className)}
      data-position={position}
      role="region"
      aria-label="Bulk alert actions"
      aria-busy={busy || undefined}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !event.defaultPrevented && !busy) {
          event.preventDefault();
          event.stopPropagation();
          onClear();
        }
        onKeyDown?.(event);
      }}
    >
      <div className="aegis-bulk-actions-row">
        <div className="aegis-bulk-selection" aria-live="polite">
          <span className="aegis-bulk-count">{count.toLocaleString()}</span>
          <span>selected</span>
        </div>
        <Separator orientation="vertical" />
        <DropdownMenu
          label="Assign selected alerts"
          trigger={
            <Button
              size="sm"
              emphasis="ghost"
              leadingIcon={<UserRoundCheck size={15} />}
              trailingIcon={<ChevronDown size={12} />}
              disabled={busy}
              loading={pending === 'assign'}
            >
              Assign
            </Button>
          }
          items={[
            {
              type: 'group',
              id: 'analysts',
              label: 'Assign to analyst',
              items: analysts.map((analyst) => ({
                id: analyst.id,
                label: analyst.name,
                icon: <Avatar name={analyst.name} initials={analyst.initials} size="sm" />,
                onSelect: () => {
                  void perform('assign', () => onAssign(analyst.id));
                },
              })),
            },
            { type: 'separator', id: 'separator' },
            {
              id: 'unassign',
              label: 'Remove assignee',
              icon: <UserRoundMinus size={15} />,
              onSelect: () => {
                void perform('assign', () => onAssign(null));
              },
            },
          ]}
        />
        <DropdownMenu
          label="Change status of selected alerts"
          trigger={
            <Button
              size="sm"
              emphasis="ghost"
              leadingIcon={<CheckCheck size={15} />}
              trailingIcon={<ChevronDown size={12} />}
              disabled={busy}
              loading={pending === 'status'}
            >
              Change status
            </Button>
          }
          items={(Object.entries(statusLabels) as [AlertStatus, string][]).map(
            ([status, label]) => ({
              id: status,
              label,
              icon: <StatusDot status={status} label={false} />,
              onSelect: () => {
                void perform('status', () => onStatusChange(status));
              },
            }),
          )}
        />
        <Button
          size="sm"
          emphasis="soft"
          intent="ai"
          leadingIcon={<Sparkles size={15} />}
          disabled={busy}
          loading={pending === 'summarize'}
          onClick={() => {
            void perform('summarize', onSummarize);
          }}
        >
          Summarize with AI
        </Button>
        <Separator orientation="vertical" />
        <IconButton
          size="sm"
          emphasis="ghost"
          aria-label="Clear selected alerts"
          disabled={busy}
          onClick={onClear}
        >
          <X size={15} />
        </IconButton>
      </div>
      {error && (
        <p className="aegis-bulk-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
