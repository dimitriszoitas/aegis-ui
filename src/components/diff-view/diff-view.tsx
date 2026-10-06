import { useEffect, useId, useRef, useState, type CSSProperties, type HTMLAttributes } from 'react';
import { ArrowDown, ArrowUp, Columns2, List } from 'lucide-react';
import { ChangeSet } from '@codemirror/state';
import { EditorView, ViewPlugin } from '@codemirror/view';
import {
  MergeView,
  getChunks,
  getOriginalDoc,
  goToNextChunk,
  goToPreviousChunk,
  originalDocChangeEffect,
  unifiedMergeView,
} from '@codemirror/merge';
import { Button } from '@/components/button';
import { ButtonGroup } from '@/components/button-group';
import { IconButton } from '@/components/icon-button';
import {
  codeDimension,
  createCodeExtensions,
  type CodeLanguage,
} from '@/components/code-editor/code-theme';
import { cn } from '@/lib/utils';
import './diff-view.css';

export type DiffMode = 'split' | 'unified';
export interface DiffViewProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'onChange'> {
  original: string;
  modified: string;
  language?: CodeLanguage;
  label?: string;
  originalLabel?: string;
  modifiedLabel?: string;
  mode?: DiffMode;
  defaultMode?: DiffMode;
  onModeChange?: (mode: DiffMode) => void;
  readOnly?: boolean;
  onModifiedChange?: (value: string) => void;
  collapseUnchanged?: boolean;
  wrapLines?: boolean;
  minHeight?: number | string;
  maxHeight?: number | string;
  showModeToggle?: boolean;
}
type MountedDiff = { mode: 'split'; merge: MergeView } | { mode: 'unified'; view: EditorView };

// CodeMirror's collapsed-context widgets are clickable divs; give them keyboard parity.
const accessibleCollapsedContext = ViewPlugin.fromClass(
  class {
    private observer: MutationObserver;
    constructor(private view: EditorView) {
      this.observer = new MutationObserver(() => this.enhance());
      this.observer.observe(view.contentDOM, { childList: true, subtree: true });
      view.dom.addEventListener('keydown', this.onKeyDown, true);
      queueMicrotask(() => this.enhance());
    }
    enhance() {
      for (const element of this.view.contentDOM.querySelectorAll<HTMLElement>(
        '.cm-collapsedLines',
      )) {
        element.setAttribute('role', 'button');
        element.tabIndex = 0;
        element.setAttribute('aria-label', `Expand ${element.textContent ?? 'unchanged lines'}`);
      }
    }
    onKeyDown = (event: KeyboardEvent) => {
      const element =
        event.target instanceof HTMLElement
          ? event.target.closest<HTMLElement>('.cm-collapsedLines')
          : null;
      if (!element || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      event.stopPropagation();
      element.click();
      this.view.focus();
    };
    destroy() {
      this.observer.disconnect();
      this.view.dom.removeEventListener('keydown', this.onKeyDown, true);
    }
  },
);

/** Original is always read-only. Inline accept/reject actions belong to the surrounding review. */
export function DiffView({
  original,
  modified,
  language = 'yaml',
  label = 'Rule changes',
  originalLabel = 'Original',
  modifiedLabel = 'Proposed',
  mode,
  defaultMode = 'split',
  onModeChange,
  readOnly = true,
  onModifiedChange,
  collapseUnchanged = false,
  wrapLines = false,
  minHeight = 160,
  maxHeight = 560,
  showModeToggle = true,
  className,
  style,
  ...props
}: DiffViewProps) {
  const [internalMode, setInternalMode] = useState(defaultMode);
  const activeMode = mode ?? internalMode;
  const [changeCount, setChangeCount] = useState(0);
  const host = useRef<HTMLDivElement>(null);
  const mounted = useRef<MountedDiff | null>(null);
  const externalUpdate = useRef(false);
  const snapshot = useRef({ original, modified, onModifiedChange });
  const titleId = useId();
  const helpId = useId();
  useEffect(() => {
    snapshot.current = { original, modified, onModifiedChange };
  }, [original, modified, onModifiedChange]);
  useEffect(() => {
    if (!host.current) return;
    const countChanges = () => {
      const current = mounted.current;
      if (current)
        setChangeCount(
          current.mode === 'split'
            ? current.merge.chunks.length
            : (getChunks(current.view.state)?.chunks.length ?? 0),
        );
    };
    const extension = (name: string, locked: boolean) => [
      ...createCodeExtensions({
        language,
        label: name,
        readOnly: locked,
        wrapLines,
        describedBy: helpId,
      }),
      accessibleCollapsedContext,
    ];
    const listen = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        if (!externalUpdate.current)
          snapshot.current.onModifiedChange?.(update.state.doc.toString());
        queueMicrotask(countChanges);
      }
    });
    const collapsed = collapseUnchanged ? { margin: 3, minSize: 6 } : undefined;
    if (activeMode === 'split') {
      const merge = new MergeView({
        parent: host.current,
        a: {
          doc: snapshot.current.original,
          extensions: extension(`${label}: ${originalLabel}`, true),
        },
        b: {
          doc: snapshot.current.modified,
          extensions: [...extension(`${label}: ${modifiedLabel}`, readOnly), listen],
        },
        highlightChanges: true,
        gutter: true,
        collapseUnchanged: collapsed,
      });
      merge.dom.tabIndex = 0;
      merge.dom.setAttribute('role', 'region');
      merge.dom.setAttribute('aria-label', 'Scrollable side-by-side comparison');
      mounted.current = { mode: 'split', merge };
    } else {
      const view = new EditorView({
        parent: host.current,
        doc: snapshot.current.modified,
        extensions: [
          ...extension(`${label}: unified comparison`, readOnly),
          unifiedMergeView({
            original: snapshot.current.original,
            mergeControls: false,
            highlightChanges: true,
            gutter: true,
            collapseUnchanged: collapsed,
          }),
          listen,
        ],
      });
      mounted.current = { mode: 'unified', view };
    }
    countChanges();
    return () => {
      const current = mounted.current;
      mounted.current = null;
      if (current?.mode === 'split') current.merge.destroy();
      else current?.view.destroy();
    };
  }, [
    activeMode,
    language,
    label,
    originalLabel,
    modifiedLabel,
    readOnly,
    wrapLines,
    collapseUnchanged,
    helpId,
  ]);
  useEffect(() => {
    const current = mounted.current;
    if (!current) return;
    const replace = (view: EditorView, value: string) => {
      if (view.state.doc.toString() !== value)
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    };
    externalUpdate.current = true;
    try {
      if (current.mode === 'split') {
        replace(current.merge.a, original);
        replace(current.merge.b, modified);
        setChangeCount(current.merge.chunks.length);
      } else {
        const previous = getOriginalDoc(current.view.state);
        if (previous.toString() !== original)
          current.view.dispatch({
            effects: originalDocChangeEffect(
              current.view.state,
              ChangeSet.of({ from: 0, to: previous.length, insert: original }, previous.length),
            ),
          });
        replace(current.view, modified);
        setChangeCount(getChunks(current.view.state)?.chunks.length ?? 0);
      }
    } finally {
      externalUpdate.current = false;
    }
  }, [original, modified, activeMode]);
  const navigate = (direction: 'previous' | 'next') => {
    const current = mounted.current;
    const view = current?.mode === 'split' ? current.merge.b : current?.view;
    if (view) {
      (direction === 'next' ? goToNextChunk : goToPreviousChunk)(view);
      view.focus();
    }
  };
  return (
    <section
      {...props}
      className={cn('aegis-diff-view', className)}
      data-mode={activeMode}
      aria-labelledby={titleId}
      style={
        {
          '--diff-min-height': codeDimension(minHeight),
          '--diff-max-height': codeDimension(maxHeight),
          ...style,
        } as CSSProperties
      }
    >
      <div className="aegis-diff-toolbar">
        <div className="aegis-diff-title">
          <h3 id={titleId}>{label}</h3>
          <span role="status">
            {changeCount === 0
              ? 'No changes'
              : `${changeCount} changed ${changeCount === 1 ? 'section' : 'sections'}`}
          </span>
        </div>
        <div className="aegis-diff-tools">
          <ButtonGroup aria-label="Change navigation">
            <IconButton
              aria-label="Previous change"
              size="sm"
              emphasis="ghost"
              disabled={!changeCount}
              onClick={() => navigate('previous')}
            >
              <ArrowUp size={14} />
            </IconButton>
            <IconButton
              aria-label="Next change"
              size="sm"
              emphasis="ghost"
              disabled={!changeCount}
              onClick={() => navigate('next')}
            >
              <ArrowDown size={14} />
            </IconButton>
          </ButtonGroup>
          {showModeToggle && (
            <ButtonGroup aria-label="Diff layout">
              {(
                [
                  { value: 'split', label: 'Split view', icon: Columns2 },
                  { value: 'unified', label: 'Unified view', icon: List },
                ] as const
              ).map(({ value, label: name, icon: Icon }) => (
                <Button
                  key={value}
                  size="sm"
                  emphasis={activeMode === value ? 'soft' : 'ghost'}
                  intent={activeMode === value ? 'function' : 'default'}
                  aria-pressed={activeMode === value}
                  leadingIcon={<Icon size={14} />}
                  onClick={() => {
                    if (mode === undefined) setInternalMode(value);
                    onModeChange?.(value);
                  }}
                >
                  {name}
                </Button>
              ))}
            </ButtonGroup>
          )}
        </div>
      </div>
      <p className="sr-only" id={helpId}>
        Comparison of {originalLabel} and {modifiedLabel}. Removed lines are marked with a minus and
        additions with a plus in the legend. Tab moves out of the code. Use the previous and next
        change buttons to navigate.
      </p>
      <div className="aegis-diff-legend">
        <span>
          <b className="aegis-diff-removed">−</b>
          {originalLabel}
        </span>
        <span>
          <b className="aegis-diff-added">+</b>
          {modifiedLabel}
          {!readOnly && ' · Editable'}
        </span>
      </div>
      <div ref={host} className="aegis-diff-host" />
    </section>
  );
}
