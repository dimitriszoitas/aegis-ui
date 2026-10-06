import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Popover as Primitive } from 'radix-ui';
import { Command } from 'cmdk';
import { Check, ChevronDown, Search } from '@/components/icon';
import { cn } from '@/lib/utils';
import { useFieldControl, type FieldControlProps } from '@/components/field';
import { Tag } from '@/components/tag';
import { Spinner } from '@/components/spinner';
import type { SelectOption } from '@/components/select';
import './multi-combobox.css';

export interface MultiComboboxOption extends SelectOption {
  keywords?: readonly string[];
}

export interface MultiComboboxProps extends FieldControlProps {
  options: readonly MultiComboboxOption[];
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  label?: ReactNode;
  'aria-label'?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  search?: string;
  onSearchChange?: (search: string) => void;
  /** Disable local filtering when results are supplied by a remote search. */
  filterOptions?: boolean;
  maxVisible?: number;
  loading?: boolean;
  loadingLabel?: string;
  emptyLabel?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  name?: string;
  className?: string;
}

/** Cmdk list/group presentation with explicit multi-selection and active-descendant semantics. */
export function MultiCombobox({
  options,
  value,
  defaultValue = [],
  onValueChange,
  label,
  'aria-label': ariaLabel,
  placeholder = 'Choose sources',
  searchPlaceholder = 'Search sources',
  search,
  onSearchChange,
  filterOptions = true,
  maxVisible = 3,
  loading = false,
  loadingLabel = 'Loading available sources',
  emptyLabel = 'No matching sources',
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  name,
  className,
  id,
  disabled,
  required,
  invalid,
  'aria-describedby': describedBy,
  'aria-labelledby': labelledBy,
  'aria-invalid': ariaInvalid,
}: MultiComboboxProps) {
  const [internalValue, setInternalValue] = useState<readonly string[]>(defaultValue);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [internalSearch, setInternalSearch] = useState('');
  const [activeValue, setActiveValue] = useState<string>();
  const [listId, setListId] = useState<string>();
  const localId = useId();
  const labelId = `aegis-multi-label-${localId}`;
  const summaryId = `aegis-multi-summary-${localId}`;
  const popupId = `aegis-multi-popup-${localId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focusFrame = useRef<number | undefined>(undefined);
  const selected = value ?? internalValue;
  const open = controlledOpen ?? internalOpen;
  const query = search ?? internalSearch;
  const control = useFieldControl({
    id,
    disabled,
    required,
    invalid,
    'aria-labelledby': labelledBy ?? (label ? labelId : undefined),
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
  });
  const selectedSet = new Set(selected);
  const filtered = options.filter(
    (option) =>
      !filterOptions ||
      [option.label, option.description, ...(option.keywords ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  );
  const enabled = filtered.filter((option) => !option.disabled);
  const active = enabled.find((option) => option.value === activeValue) ?? enabled[0];
  const groups = [...new Set(filtered.map((option) => option.group ?? ''))];
  const limit = Math.max(0, Math.floor(maxVisible));
  const shown = selected.slice(0, limit);
  const hidden = selected.slice(limit);
  const nameFor = (selectedValue: string) =>
    options.find((option) => option.value === selectedValue)?.label ?? selectedValue;
  const optionId = (optionValue: string) =>
    `${control.id}-option-${encodeURIComponent(optionValue)}`;
  const captureList = useCallback((node: HTMLDivElement | null) => {
    if (node) setListId(node.id);
  }, []);

  useEffect(() => {
    if (open && activeValue)
      document
        .getElementById(`${control.id}-option-${encodeURIComponent(activeValue)}`)
        ?.scrollIntoView({ block: 'nearest' });
  }, [activeValue, open, control.id]);
  useEffect(
    () => () => {
      if (focusFrame.current !== undefined) cancelAnimationFrame(focusFrame.current);
    },
    [],
  );

  function updateSelection(next: readonly string[]) {
    const deduplicated = [...new Set(next)];
    if (value === undefined) setInternalValue(deduplicated);
    onValueChange?.(deduplicated);
  }
  function removeChip(selectedValue: string) {
    const index = shown.indexOf(selectedValue);
    const previousFocus = shellRef.current?.ownerDocument.activeElement;
    updateSelection(selected.filter((item) => item !== selectedValue));
    if (focusFrame.current !== undefined) cancelAnimationFrame(focusFrame.current);
    focusFrame.current = requestAnimationFrame(() => {
      const shell = shellRef.current;
      if (!shell) return;
      const currentFocus = shell.ownerDocument.activeElement;
      if (currentFocus !== shell.ownerDocument.body && currentFocus !== previousFocus) return;
      const chips = shell.querySelectorAll<HTMLButtonElement>('button.tag-remove:not(:disabled)');
      const target = chips[Math.min(Math.max(0, index), chips.length - 1)] ?? triggerRef.current;
      target?.focus();
    });
  }
  function toggle(option: MultiComboboxOption) {
    if (option.disabled || control.disabled || loading) return;
    updateSelection(
      selectedSet.has(option.value)
        ? selected.filter((item) => item !== option.value)
        : [...selected, option.value],
    );
  }
  function updateSearch(next: string) {
    if (search === undefined) setInternalSearch(next);
    setActiveValue(undefined);
    onSearchChange?.(next);
  }
  function updateOpen(next: boolean) {
    if (control.disabled) return;
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
    if (!next) updateSearch('');
  }
  function navigate(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    const index = enabled.findIndex((option) => option.value === active?.value);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (enabled.length)
        setActiveValue(
          enabled[(index + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length]
            .value,
        );
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setActiveValue((event.key === 'Home' ? enabled[0] : enabled.at(-1))?.value);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (active) toggle(active);
    } else if (event.key === 'Backspace' && !query && selected.length) {
      event.preventDefault();
      updateSelection(selected.slice(0, -1));
    }
  }

  return (
    <div className={cn('aegis-multi-field', className)}>
      {label && (
        <label id={labelId} htmlFor={control.id} className="aegis-field-label">
          {label}
        </label>
      )}
      <Primitive.Root open={open && !control.disabled} onOpenChange={updateOpen}>
        <Primitive.Anchor asChild>
          <div
            ref={shellRef}
            className="aegis-multi-shell"
            data-disabled={control.disabled || undefined}
            data-invalid={
              control['aria-invalid'] === true || control['aria-invalid'] === 'true' || undefined
            }
          >
            {shown.map((selectedValue) => (
              <Tag
                key={selectedValue}
                size="sm"
                variant="removable"
                disabled={control.disabled}
                removeLabel={`Remove ${nameFor(selectedValue)}`}
                onRemove={() => removeChip(selectedValue)}
              >
                {nameFor(selectedValue)}
              </Tag>
            ))}
            {hidden.length > 0 && (
              <span
                className="aegis-multi-overflow"
                title={hidden.map(nameFor).join(', ')}
                aria-label={`${hidden.length} more selected: ${hidden.map(nameFor).join(', ')}`}
              >
                +{hidden.length}
              </span>
            )}
            <Primitive.Trigger asChild>
              <button
                ref={triggerRef}
                id={control.id}
                type="button"
                role="combobox"
                aria-haspopup="dialog"
                aria-controls={open ? popupId : undefined}
                aria-expanded={open && !control.disabled}
                aria-label={
                  control['aria-labelledby'] ? undefined : (ariaLabel ?? 'Select sources')
                }
                aria-labelledby={control['aria-labelledby']}
                aria-describedby={[control['aria-describedby'], summaryId]
                  .filter(Boolean)
                  .join(' ')}
                aria-required={control.required}
                aria-invalid={control['aria-invalid']}
                disabled={control.disabled}
                className="aegis-multi-trigger"
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    updateOpen(true);
                  }
                }}
              >
                {!selected.length && <span className="aegis-multi-placeholder">{placeholder}</span>}
                {selected.length > 0 && <span className="sr-only">Edit selection</span>}
                <ChevronDown size={16} aria-hidden="true" />
              </button>
            </Primitive.Trigger>
          </div>
        </Primitive.Anchor>
        <span id={summaryId} className="sr-only" aria-live="polite">
          {selected.length} selected
        </span>
        <Primitive.Portal>
          <Primitive.Content
            id={popupId}
            className="aegis-multi-popover"
            sideOffset={6}
            collisionPadding={12}
            align="start"
            aria-label={ariaLabel ?? (typeof label === 'string' ? label : 'Choose sources')}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              inputRef.current?.focus();
            }}
          >
            <Command shouldFilter={false} label={searchPlaceholder}>
              <div className="aegis-multi-search">
                <Search size={16} aria-hidden="true" />
                <input
                  ref={inputRef}
                  role="combobox"
                  aria-label={searchPlaceholder}
                  aria-expanded="true"
                  aria-autocomplete="list"
                  aria-controls={listId}
                  aria-activedescendant={active ? optionId(active.value) : undefined}
                  value={query}
                  onChange={(event) => updateSearch(event.currentTarget.value)}
                  onKeyDown={navigate}
                  placeholder={searchPlaceholder}
                  autoComplete="off"
                />
              </div>
              <div
                className="aegis-multi-toolbar"
                onKeyDown={(event) => {
                  if (event.key !== 'Escape') event.stopPropagation();
                }}
              >
                <button
                  type="button"
                  disabled={loading || !enabled.length}
                  onClick={() =>
                    updateSelection([...selected, ...enabled.map((option) => option.value)])
                  }
                >
                  Select all{query ? ' matches' : ''}
                </button>
                <button
                  type="button"
                  disabled={!selected.length}
                  onClick={() => updateSelection([])}
                >
                  Clear
                </button>
                <span>{selected.length} selected</span>
              </div>
              {loading && (
                <div className="aegis-multi-message" role="status">
                  <Spinner size="sm" />
                  {loadingLabel}
                </div>
              )}
              <Command.List
                ref={captureList}
                className="aegis-multi-list"
                label="Available sources"
                aria-multiselectable="true"
                aria-busy={loading}
              >
                {groups.map((group) => (
                  <Command.Group
                    key={group}
                    heading={group || undefined}
                    value={group || 'ungrouped'}
                  >
                    {filtered
                      .filter((option) => (option.group ?? '') === group)
                      .map((option) => (
                        <div
                          key={option.value}
                          id={optionId(option.value)}
                          role="option"
                          aria-selected={selectedSet.has(option.value)}
                          aria-disabled={option.disabled || loading}
                          className="aegis-multi-option"
                          data-active={active?.value === option.value || undefined}
                          data-disabled={option.disabled || loading || undefined}
                          onPointerMove={() => {
                            if (!option.disabled && !loading) setActiveValue(option.value);
                          }}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => toggle(option)}
                        >
                          <span
                            className="aegis-multi-check"
                            data-checked={selectedSet.has(option.value) || undefined}
                            aria-hidden="true"
                          >
                            {selectedSet.has(option.value) && <Check size={13} />}
                          </span>
                          {option.icon && (
                            <span className="aegis-multi-icon" aria-hidden="true">
                              {option.icon}
                            </span>
                          )}
                          <span className="aegis-multi-option-copy">
                            <span>{option.label}</span>
                            {option.description && (
                              <span className="aegis-multi-description">{option.description}</span>
                            )}
                          </span>
                        </div>
                      ))}
                  </Command.Group>
                ))}
              </Command.List>
              {!loading && !filtered.length && (
                <div className="aegis-multi-message" role="status">
                  {emptyLabel}
                </div>
              )}
              <div className="aegis-multi-footer">↑↓ navigate · Enter toggles · Esc closes</div>
            </Command>
          </Primitive.Content>
        </Primitive.Portal>
      </Primitive.Root>
      {name &&
        selected.map((selectedValue) => (
          <input
            key={selectedValue}
            type="hidden"
            name={name}
            value={selectedValue}
            disabled={control.disabled}
          />
        ))}
    </div>
  );
}
