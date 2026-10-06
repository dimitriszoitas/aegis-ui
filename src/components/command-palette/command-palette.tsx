import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Command } from 'cmdk';
import { Dialog } from 'radix-ui';
import { Search, Sparkles, X } from 'lucide-react';
import { IconButton } from '@/components/icon-button';
import { Kbd } from '@/components/kbd';
import { useModalIsolation } from '@/components/modal/use-modal-isolation';
import './command-palette.css';
function CommandContent({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef<HTMLElement | null>(null);
  useModalIsolation(ref);
  return (
    <Dialog.Content
      ref={ref}
      className="command-dialog"
      aria-describedby="command-description"
      onOpenAutoFocus={() => {
        previous.current =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
      }}
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        requestAnimationFrame(() => previous.current?.focus());
      }}
    >
      {children}
    </Dialog.Content>
  );
}
export interface CommandAction {
  id: string;
  label: string;
  group?: string;
  icon?: ReactNode;
  keywords?: string[];
  shortcut?: string;
  onSelect: () => void;
}
export interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  actions: CommandAction[];
  onAskAi?: (query: string) => void;
  shortcut?: boolean;
}
export function CommandPalette({
  open: controlled,
  onOpenChange,
  defaultOpen = false,
  actions,
  onAskAi,
  shortcut = true,
}: CommandPaletteProps) {
  const [internal, setInternal] = useState(defaultOpen),
    [query, setQuery] = useState('');
  const open = controlled ?? internal;
  const setOpen = (next: boolean) => {
    setInternal(next);
    onOpenChange?.(next);
    if (!next) setQuery('');
  };
  useEffect(() => {
    if (!shortcut) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setInternal((v) => !v);
        onOpenChange?.(!open);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [shortcut, open, onOpenChange]);
  const groups = [...new Set(actions.map((a) => a.group ?? 'Actions'))];
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay data-aegis-overlay className="command-scrim" />
        <CommandContent>
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Dialog.Description id="command-description" className="sr-only">
            Search navigation, investigation actions and recent detections. Use arrow keys to choose
            and Enter to run.
          </Dialog.Description>
          <Command label="Search Aegis">
            <div className="command-search">
              <Search size={18} aria-hidden />
              <Command.Input
                autoFocus
                placeholder="Search anything, or ask Aegis…"
                value={query}
                onValueChange={setQuery}
                aria-label="Search commands"
              />
              <Dialog.Close asChild>
                <IconButton aria-label="Close command palette" size="sm" emphasis="ghost">
                  <X size={14} />
                </IconButton>
              </Dialog.Close>
            </div>
            <Command.List>
              <Command.Empty>
                No matching actions. Ask Aegis to investigate this query.
              </Command.Empty>
              {groups.map((group) => (
                <Command.Group heading={group} key={group}>
                  {actions
                    .filter((a) => (a.group ?? 'Actions') === group)
                    .map((action) => (
                      <Command.Item
                        key={action.id}
                        value={action.label}
                        keywords={action.keywords}
                        onSelect={() => {
                          setOpen(false);
                          action.onSelect();
                        }}
                      >
                        {action.icon}
                        <span>{action.label}</span>
                        {action.shortcut && <Kbd>{action.shortcut}</Kbd>}
                      </Command.Item>
                    ))}
                </Command.Group>
              ))}
              {onAskAi && (
                <Command.Group heading="Aegis assistant">
                  <Command.Item
                    forceMount
                    value="ask-aegis"
                    onSelect={() => {
                      setOpen(false);
                      onAskAi(query);
                    }}
                  >
                    <Sparkles size={17} />
                    <span>{query ? `Ask Aegis about “${query}”` : 'Ask Aegis to investigate'}</span>
                  </Command.Item>
                </Command.Group>
              )}
            </Command.List>
            <div className="command-footer">
              <span>
                <Kbd>↑ ↓</Kbd> Navigate
              </span>
              <span>
                <Kbd>↵</Kbd> Open
              </span>
              <span>
                <Kbd>Esc</Kbd> Close
              </span>
            </div>
          </Command>
        </CommandContent>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
