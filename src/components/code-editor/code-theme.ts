import { EditorState, type Extension } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import { codeFolding, HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { yaml } from '@codemirror/lang-yaml';
import { json } from '@codemirror/lang-json';
import { basicSetup } from '@uiw/react-codemirror';

export type CodeLanguage = 'yaml' | 'json';
export interface HighlightedLineRange {
  /** Inclusive, one-based line numbers. */ from: number;
  to: number;
}
export interface CodeExtensionOptions {
  language: CodeLanguage;
  label: string;
  describedBy?: string;
  readOnly?: boolean;
  lineNumbers?: boolean;
  folding?: boolean;
  wrapLines?: boolean;
  highlightedLines?: readonly HighlightedLineRange[];
}

/** CSS variables resolve at paint time, so a theme switch preserves selection and undo history. */
export const codeTheme: Extension = [
  EditorView.theme({
    '&': {
      color: 'var(--color-text-primary)',
      backgroundColor: 'var(--color-bg-surface)',
      fontSize: 'var(--text-sm)',
    },
    '&.cm-focused': { outline: 'none' },
    '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.65', overflow: 'auto' },
    '.cm-content': { padding: 'var(--space-3) 0', caretColor: 'var(--color-text-primary)' },
    '.cm-line': { padding: '0 var(--space-4)' },
    '.cm-content:focus-visible': { outline: 'none' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--color-text-primary)' },
    '.cm-gutters': {
      backgroundColor: 'var(--color-bg-canvas)',
      color: 'var(--color-text-secondary)',
      borderRight: '1px solid var(--color-border-subtle)',
    },
    '.cm-gutterElement': { padding: '0 var(--space-2)' },
    '.cm-activeLine': { backgroundColor: 'var(--color-bg-hover)' },
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--color-bg-hover)',
      color: 'var(--color-text-primary)',
    },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'var(--color-function-soft) !important',
    },
    '.cm-selectionMatch': { backgroundColor: 'var(--color-function-soft)' },
    '.cm-matchingBracket': {
      color: 'var(--color-function-fg)',
      backgroundColor: 'var(--color-function-soft)',
      outline: '1px solid var(--color-function-border)',
    },
    '.cm-nonmatchingBracket': { color: 'var(--color-destroy-fg)' },
    '.cm-foldPlaceholder': {
      color: 'var(--color-text-secondary)',
      backgroundColor: 'var(--color-bg-hover)',
      border: '1px solid var(--color-border-default)',
      borderRadius: 'var(--radius-xs)',
      padding: '0 var(--space-1)',
    },
    '.cm-tooltip, .cm-panels': {
      color: 'var(--color-text-primary)',
      backgroundColor: 'var(--color-bg-surface-raised)',
      border: '1px solid var(--color-border-default)',
    },
    '.cm-tooltip': { borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-floating)' },
    '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
      color: 'var(--color-function-fg)',
      backgroundColor: 'var(--color-function-soft)',
    },
    '.cm-searchMatch': {
      backgroundColor: 'var(--color-warning-soft)',
      outline: '1px solid var(--color-warning-border)',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: 'var(--color-function-soft)',
      outline: '1px solid var(--color-function-border)',
    },
    '.cm-search label, .cm-search input, .cm-search button': {
      color: 'var(--color-text-primary)',
      fontFamily: 'var(--font-ui)',
    },
    '.cm-textfield, .cm-button': {
      color: 'var(--color-text-primary)',
      background: 'var(--color-bg-surface)',
      border: '1px solid var(--color-border-strong)',
      borderRadius: 'var(--radius-xs)',
    },
    '.cm-placeholder': { color: 'var(--color-text-tertiary)' },
    '.aegis-code-highlighted-line': {
      backgroundColor: 'var(--color-function-soft)',
      boxShadow: 'inset 3px 0 var(--color-function-bg)',
    },
  }),
  syntaxHighlighting(
    HighlightStyle.define([
      { tag: [tags.propertyName, tags.attributeName], color: 'var(--color-syntax-key)' },
      { tag: [tags.string, tags.special(tags.string)], color: 'var(--color-syntax-string)' },
      { tag: [tags.number, tags.integer, tags.float], color: 'var(--color-syntax-number)' },
      {
        tag: [tags.keyword, tags.bool, tags.null, tags.atom, tags.typeName],
        color: 'var(--color-syntax-keyword)',
      },
      { tag: [tags.comment, tags.meta], color: 'var(--color-syntax-comment)', fontStyle: 'italic' },
      {
        tag: [tags.punctuation, tags.bracket, tags.operator],
        color: 'var(--color-text-secondary)',
      },
      { tag: tags.invalid, color: 'var(--color-destroy-fg)', textDecoration: 'underline' },
    ]),
  ),
];

export function createCodeExtensions({
  language,
  label,
  describedBy,
  readOnly = false,
  lineNumbers = true,
  folding = true,
  wrapLines = false,
  highlightedLines = [],
}: CodeExtensionOptions): Extension[] {
  const extensions: Extension[] = [
    basicSetup({
      lineNumbers,
      foldGutter: folding,
      foldKeymap: folding,
      highlightActiveLine: !readOnly,
      highlightActiveLineGutter: false,
      highlightSelectionMatches: false,
      autocompletion: !readOnly,
    }),
    codeTheme,
    language === 'yaml' ? yaml() : json(),
    EditorState.readOnly.of(readOnly),
    EditorView.editable.of(!readOnly),
    EditorView.contentAttributes.of({
      role: 'textbox',
      'aria-label': label,
      'aria-multiline': 'true',
      'aria-readonly': String(readOnly),
      tabindex: '0',
      spellcheck: 'false',
      ...(describedBy ? { 'aria-describedby': describedBy } : {}),
    }),
  ];
  if (wrapLines) extensions.push(EditorView.lineWrapping);
  if (folding)
    extensions.push(
      codeFolding({
        placeholderDOM: (view, unfold) => {
          const button = view.dom.ownerDocument.createElement('button');
          button.type = 'button';
          button.textContent = '…';
          button.className = 'cm-foldPlaceholder';
          button.setAttribute('aria-label', 'Expand folded code');
          button.addEventListener('click', (event) => {
            unfold(event);
            view.focus();
          });
          return button;
        },
      }),
    );
  if (highlightedLines.length)
    extensions.push(
      EditorView.decorations.compute(['doc'], (state) => {
        const lines = new Set<number>();
        for (const range of highlightedLines) {
          if (!Number.isFinite(range.from) || !Number.isFinite(range.to)) continue;
          for (
            let number = Math.max(1, Math.ceil(range.from));
            number <= Math.min(state.doc.lines, Math.floor(range.to));
            number++
          )
            lines.add(number);
        }
        return Decoration.set(
          [...lines]
            .sort((a, b) => a - b)
            .map((number) =>
              Decoration.line({ class: 'aegis-code-highlighted-line' }).range(
                state.doc.line(number).from,
              ),
            ),
        );
      }),
    );
  return extensions;
}

export const codeDimension = (size: number | string | undefined): string | undefined =>
  typeof size === 'number' ? `${size}px` : size;
