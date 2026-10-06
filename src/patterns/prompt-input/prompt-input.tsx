import { useId, useRef, useState, type ReactNode } from 'react';
import { Popover } from 'radix-ui';
import { Command } from 'cmdk';
import { ArrowUp, Check, Paperclip, Slash, Square } from '@/components/icon';
import { IconButton } from '@/components/icon-button';
import { Textarea } from '@/components/textarea';
import { Tag } from '@/components/tag';
import { Kbd } from '@/components/kbd';
import { cn } from '@/lib/utils';
import type { AiContextItem } from '@/lib/ai';
import './prompt-input.css';

export interface PromptCommand {
  id: string;
  label: string;
  description?: string;
  prompt: string;
  icon?: ReactNode;
}
export interface PromptInputProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSend: (prompt: string, context: AiContextItem[]) => void | Promise<void>;
  generating?: boolean;
  onStop?: () => void;
  context?: AiContextItem[];
  availableContext?: AiContextItem[];
  onContextChange?: (context: AiContextItem[]) => void;
  commands?: PromptCommand[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}
const emptyContext: AiContextItem[] = [];
const defaultCommands: PromptCommand[] = [
  {
    id: 'explain',
    label: 'Explain evidence',
    description: 'Start an investigation from attached records',
    prompt: 'Explain the attached evidence and suggest the next investigation steps.',
  },
  {
    id: 'summarize',
    label: 'Summarize alerts',
    description: 'Prepare a concise analyst handoff',
    prompt: 'Summarize the attached alerts for an analyst handoff.',
  },
  {
    id: 'rule',
    label: 'Review detection rule',
    description: 'Check proposed logic before making changes',
    prompt: 'Review the attached detection rule and list the validation checks.',
  },
];
export function PromptInput({
  value,
  defaultValue = '',
  onValueChange,
  onSend,
  generating = false,
  onStop,
  context,
  availableContext = emptyContext,
  onContextChange,
  commands = defaultCommands,
  disabled = false,
  placeholder = 'Ask about your investigation…',
  className,
}: PromptInputProps) {
  const [draft, setDraft] = useState(defaultValue);
  const [localContext, setLocalContext] = useState<AiContextItem[]>([]);
  const [commandsOpen, setCommandsOpen] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const textarea = useRef<HTMLTextAreaElement>(null);
  const text = value ?? draft;
  const currentText = useRef(text);
  currentText.current = text;
  const attached = context ?? localContext;
  const helpId = useId();
  const errorId = useId();
  const setText = (next: string) => {
    if (value === undefined) setDraft(next);
    onValueChange?.(next);
    setError('');
  };
  const changeContext = (next: AiContextItem[]) => {
    if (context === undefined) setLocalContext(next);
    onContextChange?.(next);
  };
  const restoreFocus = () => requestAnimationFrame(() => textarea.current?.focus());
  async function send() {
    if (!text.trim() || generating || submitting || disabled) return;
    const sent = text;
    setSubmitting(true);
    setError('');
    try {
      await onSend(
        sent.trim(),
        attached.map((item) => ({ ...item })),
      );
      if (currentText.current === sent) setText('');
      restoreFocus();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Message could not be sent. Try again.');
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div className={cn('aegis-prompt', className)} data-disabled={disabled || undefined}>
      {attached.length > 0 && (
        <div
          className="aegis-prompt-context"
          role="region"
          aria-label="Attached context"
          tabIndex={0}
        >
          {attached.map((item) => (
            <Tag
              key={item.id}
              size="sm"
              variant="removable"
              disabled={disabled}
              removeLabel={`Remove ${item.label} from context`}
              onRemove={() => {
                changeContext(attached.filter((entry) => entry.id !== item.id));
                restoreFocus();
              }}
            >
              {item.label}
            </Tag>
          ))}
        </div>
      )}
      <Textarea
        ref={textarea}
        aria-label="Message to Aegis AI"
        aria-describedby={`${helpId}${error ? ` ${errorId}` : ''}`}
        autoGrow
        rows={2}
        maxRows={7}
        value={text}
        onValueChange={setText}
        disabled={disabled || submitting}
        placeholder={placeholder}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (
            event.key === '/' &&
            !text.trim() &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
          ) {
            event.preventDefault();
            setCommandsOpen(true);
          } else if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            void send();
          }
        }}
      />
      <div className="aegis-prompt-toolbar">
        <div className="aegis-prompt-tools">
          <Popover.Root open={attachmentsOpen} onOpenChange={setAttachmentsOpen}>
            <Popover.Trigger asChild>
              <IconButton
                aria-label="Attach context"
                tooltip={false}
                size="sm"
                emphasis="ghost"
                disabled={disabled}
              >
                <Paperclip size={16} />
              </IconButton>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="aegis-prompt-menu"
                side="top"
                align="start"
                sideOffset={8}
                collisionPadding={12}
                aria-label="Attach investigation context"
                onCloseAutoFocus={(event) => {
                  event.preventDefault();
                  restoreFocus();
                }}
              >
                <Command label="Available context">
                  <Command.Input
                    placeholder="Find an alert, event, or rule…"
                    aria-label="Search context"
                  />
                  <Command.List>
                    <Command.Empty>No matching context.</Command.Empty>
                    {availableContext.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={`${item.label} ${item.id}`}
                        onSelect={() => {
                          if (!attached.some((entry) => entry.id === item.id))
                            changeContext([...attached, { ...item }]);
                          setAttachmentsOpen(false);
                        }}
                      >
                        <span>
                          <strong>{item.label}</strong>
                          <small>
                            {item.id} · {item.kind}
                          </small>
                        </span>
                        {attached.some((entry) => entry.id === item.id) && (
                          <Check size={15} aria-label="Attached" />
                        )}
                      </Command.Item>
                    ))}
                  </Command.List>
                </Command>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          <Popover.Root open={commandsOpen} onOpenChange={setCommandsOpen}>
            <Popover.Trigger asChild>
              <IconButton
                aria-label="Prompt commands"
                tooltip={false}
                size="sm"
                emphasis="ghost"
                disabled={disabled}
              >
                <Slash size={16} />
              </IconButton>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="aegis-prompt-menu"
                side="top"
                align="start"
                sideOffset={8}
                collisionPadding={12}
                aria-label="Prompt commands"
                onCloseAutoFocus={(event) => {
                  event.preventDefault();
                  restoreFocus();
                }}
              >
                <Command label="Prompt commands">
                  <Command.Input
                    placeholder="Find a command…"
                    aria-label="Search prompt commands"
                  />
                  <Command.List>
                    <Command.Empty>No matching commands.</Command.Empty>
                    {commands.map((command) => (
                      <Command.Item
                        key={command.id}
                        value={`${command.label} ${command.id}`}
                        onSelect={() => {
                          setText(command.prompt);
                          setCommandsOpen(false);
                        }}
                      >
                        {command.icon}
                        <span>
                          <strong>{command.label}</strong>
                          {command.description && <small>{command.description}</small>}
                        </span>
                      </Command.Item>
                    ))}
                  </Command.List>
                </Command>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
        {generating ? (
          <IconButton
            aria-label="Stop generation"
            tooltip={false}
            intent="ai"
            emphasis="secondary"
            size="sm"
            onClick={() => {
              onStop?.();
              restoreFocus();
            }}
            disabled={!onStop}
          >
            <Square size={14} />
          </IconButton>
        ) : (
          <IconButton
            aria-label="Send message"
            tooltip={false}
            intent="ai"
            size="sm"
            onClick={() => void send()}
            loading={submitting}
            disabled={disabled || !text.trim()}
          >
            <ArrowUp size={16} />
          </IconButton>
        )}
      </div>
      <p id={helpId} className="aegis-prompt-hint">
        <Kbd>Enter</Kbd> send <span>·</span> <Kbd>Shift + Enter</Kbd> new line <span>·</span>{' '}
        <Kbd>/</Kbd> commands
      </p>
      {error && (
        <p id={errorId} className="aegis-prompt-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
