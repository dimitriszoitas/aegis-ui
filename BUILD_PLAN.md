# Aegis design system, build plan

This document is the complete spec and input for Claude Code. Read it fully, then execute the phases in section 13 in order. Where a library's current API differs from anything assumed here, check the current docs and keep the intent. Do not ask for approval between phases; only stop when section 2 or section 14 says to.

## 0. Decisions already made (Jim can edit these before running)

- System name: **Aegis**. A placeholder; if renamed here, apply the new name everywhere (package, Storybook title, README, repo).
- GitHub: public repo **`dimitriszoitas/aegis-ui`**. Must be created under the `dimitriszoitas` account, never `jimzoitas`. See section 14 for the mandatory account check.
- Package manager: pnpm (fall back to npm if pnpm is unavailable).
- No npm publishing in v1. Storybook is the consumption and documentation surface. A library build (tsup, exports map) is a later milestone, note it in the README roadmap.
- License: MIT.

## 1. What we are building

A production-grade design system for a modern SIEM (security information and event management) product with AI-assisted workflows. Deliverables:

1. A fully tokenized theme system with light and dark modes.
2. A complete component library: shadcn/ui as the base where it fits, custom or headless-library builds where shadcn is weak (datagrid, tree, stepper, code editor, charts).
3. SIEM-specific patterns: severity, triage, detection rules, time ranges, filtering, investigation.
4. AI interaction patterns: assistant panel, prompt input, streaming, AI-generated content containers, human-in-the-loop diff review.
5. A flagship sample layout: a SIEM console with collapsible floating navigation and an alerts datagrid.
6. A local Storybook and a public Storybook deployed to GitHub Pages.

## 2. Ground rules (apply to every phase)

- **Real content only.** Never lorem ipsum, never "Item 1", never `user@example.com` as the visible value. All demo content is realistic SIEM material: alert titles, MITRE ATT&CK technique IDs, hostnames, IPs, usernames, Sigma-style YAML rules. Section 10 defines the sample data.
- **Both themes, always.** Every component and story is verified in light and dark before it counts as done. No hardcoded colors anywhere; semantic tokens only (section 6).
- **Complete the inventory.** Work through every component in section 7, no sampling, no "representative subset". The acceptance checklist in section 15 is the contract.
- **Accessibility is in scope.** Keyboard navigation for menus, tree, grid, tabs, stepper, dialogs. Visible tokenized focus rings. Correct ARIA roles. `prefers-reduced-motion` respected for all transitions.
- **TypeScript strict.** No `any` in public component props. Exported prop types for every component.
- **Verify, do not guess.** If an API call or config fails, search the library's current docs instead of guessing from memory. Versions move fast (Tailwind v4, Storybook, shadcn, TanStack).
- **Commit per phase** with conventional commits (`feat(tokens): ...`). Run `tsc --noEmit`, lint, and `storybook build` at the end of each phase before committing.
- **UI copy in sentence case** everywhere (buttons, labels, headings, Storybook docs prose). Component names stay PascalCase.
- Only stop and ask Jim when: GitHub auth is for the wrong account (section 14), a required CLI is missing and cannot be installed, or a decision is destructive and ambiguous.

## 3. Stack

- React 18+ (or 19 if shadcn/Storybook versions align cleanly), TypeScript strict, Vite.
- Tailwind CSS v4 (CSS-first config, `@theme`), tokens as CSS custom properties.
- shadcn/ui (Radix primitives) initialized with CSS variables; restyled through our tokens, extended or replaced where needed.
- TanStack Table v8 for the datagrid, TanStack Virtual for large row counts.
- react-resizable-panels for push layouts (filter panel, console split).
- cmdk for command palette and combobox internals.
- react-day-picker (shadcn calendar) for date and time range picking.
- CodeMirror 6 (`@uiw/react-codemirror`, `@codemirror/lang-yaml`, `@codemirror/lang-json`, `@codemirror/merge`) for the code editor, YAML presenter, and AI diff review. Monaco is explicitly out: too heavy, harder to token-theme.
- Recharts for charts and sparklines, themed through CSS variables.
- lucide-react for icons. `sparkles` is the AI marker icon.
- Fonts self-hosted via @fontsource: Inter (UI) and JetBrains Mono (code, timestamps, IDs, IPs). No external font CDNs so the Pages build is self-contained.
- sonner for toasts.
- Storybook (latest stable, react-vite framework) with addon-themes, addon-a11y, autodocs.
- Vitest for a small set of logic tests (tree tri-state, table helpers, time range parsing).

## 4. Repo layout

```
aegis-ui/
  .github/workflows/deploy-storybook.yml
  .storybook/
  src/
    styles/
      tokens.css          # primitives + semantic tokens, light + dark
      theme.css           # tailwind @theme mapping + shadcn variable bridge
      globals.css
    lib/                  # cn(), formatters, seeded random
    components/           # one folder per component: component, stories, index
      button/
      data-grid/
      ...
    patterns/             # multi-component patterns (filters, wizard, ai, console)
    sample-data/          # generators + fixtures (section 10)
    stories/foundations/  # token documentation stories (MDX)
  README.md
```

Component files kebab-case, exports PascalCase, every component has a colocated `.stories.tsx`.

## 5. Design language

### 5.1 The floating surface model

Everything sits on a canvas; nothing structural is flush with the viewport. The hierarchy:

- **Canvas**: the page background. Light: subtle cool gray. Dark: near-black with a blue hint. Optionally a very faint radial tint in light mode.
- **Surface**: default container background (cards, panels).
- **Raised**: surface + 1px subtle border + small soft shadow. Cards, active nav items.
- **Floating**: detached chrome. Sidebar, toolbars, bulk-action bars. Larger radius, soft layered shadow, inset from viewport edges by `--space-3` (12px).
- **Overlay**: sheets, modals, popovers. Strongest shadow, scrim behind modals.

Concrete rules:

- The side navigation is a floating panel: inset 12px from top, left, and bottom edges, radius `--radius-2xl` (20px), never full height or flush.
- Side sheets (detail panels, AI panel) float too: inset 12px from top, right, and bottom, radius `--radius-xl` (16px), sliding in like an agent, not a full-height drawer.
- Generous padding inside floating containers: 20px. Cards: 16px. Dense grid cells: 8 to 10px vertical.
- Soft borders plus soft shadows together, both themes. Dark mode leans more on borders (`rgba(255,255,255,0.06)`) and a one-step-lighter surface, with weaker shadows.
- Inner interactive items (nav rows, list items, menu items) use `--radius-lg` (12px) hover pills.

### 5.2 Color, light theme

Base: white surfaces on subtle cool gray canvas. Starting values (tune visually in Storybook, keep contrast AA):

| Token | Start value |
|---|---|
| bg-canvas | `#F4F5F8` |
| bg-surface | `#FFFFFF` |
| bg-surface-raised | `#FFFFFF` |
| bg-hover | `#F1F3F6` |
| bg-selected | `#EDF0F5` |
| text-primary | `#171A20` |
| text-secondary | `#5B6271` |
| text-tertiary | `#8A91A0` |
| border-subtle | `#E6E8EE` |
| border-default | `#D6DAE3` |

### 5.3 Color, dark theme

Base: dark neutrals that are not cold; low saturation around hue 225 to 232 so there is a hint of blue without reading as slate. Starting values:

| Token | Start value |
|---|---|
| bg-canvas | `#0D0E12` |
| bg-surface | `#17181D` |
| bg-surface-raised | `#1C1E24` |
| bg-hover | `#22242B` |
| bg-selected | `#262933` |
| text-primary | `#F2F3F6` |
| text-secondary | `#A7ACB9` |
| text-tertiary | `#7A8090` |
| border-subtle | `rgba(255,255,255,0.06)` |
| border-default | `rgba(255,255,255,0.10)` |

### 5.4 Intent and status colors

Define full ramps (50 to 950, OKLCH) for: cool gray (slate family), ink (dark neutrals above), blue (function), violet (ai), red (destroy), green (success), amber (warning), orange. Starting anchors:

- function: `#4A6CF7` (light mode fill), `#6B8BFF` (dark mode fill), soft variants at 8 to 12% alpha.
- ai: `#8B5CF6`, dark `#A78BFA`, plus gradient token `--gradient-ai: linear-gradient(135deg, #8B5CF6, #4A6CF7)`.
- destroy: `#DC3D43`, dark `#FF6369`.
- success `#2E9E5B`, warning `#D97706`.

Severity scale (SIEM core, used by badges, grid cells, charts):

- critical `#DC2626`, high `#EA580C`, medium `#D97706`, low `#2563EB`, info `#64748B`.
- Each severity gets `bg` (tinted, ~10% alpha), `fg`, and `border` tokens per theme, AA contrast for the fg on the tinted bg.

### 5.5 Radius, shadows, spacing, type, motion

- Radius tokens: xs 6, sm 8, md 10, lg 12, xl 16, 2xl 20, full. Buttons and inputs md, cards lg, sheets xl, sidebar and modals 2xl, chips full.
- Shadows (light mode starters, soften alphas for dark):
  - raised: `0 1px 2px rgba(16,24,40,.05), 0 1px 3px rgba(16,24,40,.08)`
  - floating: `0 2px 8px -2px rgba(16,24,40,.08), 0 12px 32px -8px rgba(16,24,40,.14)`
  - overlay: `0 8px 16px -6px rgba(16,24,40,.12), 0 28px 64px -12px rgba(16,24,40,.28)`
- Spacing: 4px base scale (1 through 24 steps). Typography: Inter, sizes 12/13/14/16/18/20/24/30, UI base 14, dense grid 13, `tabular-nums` for numbers, JetBrains Mono for timestamps, IDs, IPs, code.
- Motion tokens: fast 120ms, base 180ms, slide 260ms, ease-out curves. Sheets slide + fade, sidebar collapse animates width, all gated by `prefers-reduced-motion`.
- Focus ring: 2px function-colored ring with 2px offset, tokenized, identical pattern on every interactive element.
- Z-index scale tokens: sticky 40, dropdown 50, sheet 60, modal 70, popover 80, toast 90, tooltip 100.

## 6. Token architecture

Three tiers, CSS custom properties, defined in `src/styles/tokens.css`:

1. **Primitives**: raw ramps and scales (`--blue-500`, `--space-4`, `--radius-lg`). Theme-agnostic.
2. **Semantic**: what components consume (`--color-bg-surface`, `--color-text-secondary`, `--color-function-bg`, `--color-severity-high-fg`, `--shadow-floating`, `--ring-focus`). Defined once for light on `:root`, overridden under `.dark`.
3. **Component tokens** only where genuinely needed (grid row heights per density, sidebar widths).

Wiring:

- Theme switching: `.dark` class on `<html>` (plus `data-theme` attribute mirror). Default follows `prefers-color-scheme`; Storybook toolbar overrides it.
- Map semantic tokens into Tailwind v4 `@theme` in `theme.css` so utilities exist: `bg-canvas`, `bg-surface`, `text-secondary`, `border-subtle`, `shadow-floating`, `rounded-xl`, `ring-focus`, intent utilities.
- Bridge shadcn's expected variables to our semantics in the same file (`--background: var(--color-bg-surface)`, `--primary: var(--color-function-bg)`, `--destructive`, `--ring`, `--radius`, etc.) so stock shadcn components inherit the theme before we restyle them.
- Rule: components and stories reference semantic tokens or mapped utilities only. Zero raw hex values outside `tokens.css`.

Foundations documentation (Storybook MDX): color swatch grids per theme, severity row, radius, shadows, spacing, type specimens, motion demos. Generated from the token source where practical so docs cannot drift.

## 7. Component inventory

Every item below gets: all listed variants and states, both themes, keyboard support, a stories file covering the matrix, and autodocs. shadcn is the starting point where noted; otherwise build on Radix primitives or the named headless library.

### 7.1 Actions

1. **Button**: sizes `sm` (28px), `md` (34px), `lg` (40px); emphasis `filled`, `soft` (tinted bg, no border), `ghost`; intents `default` (neutral), `function` (blue), `destroy` (red), `ai` (violet; filled may use `--gradient-ai`, soft uses violet tint, always pairs well with the sparkles icon). States: hover, active, focus-visible, disabled, loading (spinner replaces leading icon, width stable). Leading/trailing icon slots.
2. **IconButton**: same sizes/emphasis/intents, square, required `aria-label`, tooltip by default.
3. **ButtonGroup**: segmented attach, for toolbars.
4. **CopyButton**: copies text, swaps to check icon, toast optional.

### 7.2 Tags, badges, severity

5. **Tag/Chip**: variants `static`, `removable` (close affordance, keyboard deletable), `interactive` (selectable filter chip with pressed state), `counter` (label + count); sizes sm/md; neutral + intent colorways.
6. **SeverityBadge**: critical/high/medium/low/info, dot + label and compact dot-only forms, built on severity tokens.
7. **StatusDot** and **StatusBadge**: new, triaged, in progress, resolved, false positive.
8. **CountBadge**: numeric pill for nav items and tabs (caps at 99+).
9. **Kbd**: keyboard hint chip.

### 7.3 Forms

10. **Field** wrapper: label, optional/required marker, help text, error text, consistent spacing; all inputs compose with it.
11. **TextInput**: sizes sm/md/lg, prefix/suffix slots, clearable, invalid state.
12. **SearchInput**: search icon, clear, optional Kbd shortcut hint, debounced `onSearch`.
13. **Textarea**: auto-grow option, character counter option.
14. **Select** (single dropdown): shadcn select restyled, with item descriptions and icons.
15. **MultiCombobox**: popover + cmdk list, type-to-filter, multi-select with selected chips inline (overflow collapses to +N), select all/clear, grouped options, async-friendly (loading state). Keyboard complete.
16. **Checkbox** (with indeterminate), **RadioGroup**, **Switch**, **Slider**.
17. **TreeView**: nested items, expand/collapse with chevrons and arrow keys, checkboxes with tri-state parent logic (checked/unchecked/indeterminate computed from descendants), icons, item counts, controlled + uncontrolled, `role="tree"` ARIA pattern. Custom build (no suitable Radix primitive); unit-test the tri-state logic.
18. **DatePicker** and **TimeRangePicker**: SIEM-critical. Presets (last 15m, 1h, 24h, 7d, 30d, custom), custom absolute range with calendar + time fields, relative vs absolute display, compact trigger button showing the active range.

### 7.4 Navigation

19. **Tabs** ("tabbers"): `line` variant (underline indicator, animated) and `pill`/segmented variant; optional icons and CountBadges; overflow scrolls with edge fade; keyboard arrows.
20. **SideNav**: the floating sidebar. Expanded 264px with section labels, items (icon + label + optional CountBadge), nested groups; collapsed 68px icon-only with tooltips; animated collapse; active item gets raised-surface treatment; footer slot (settings, user).
21. **Breadcrumb**, **Pagination** (page numbers + rows-per-page select), **CommandPalette** (cmdk modal, ⌘K, grouped actions, navigation, recent items, "ask AI" escape hatch row).

### 7.5 Lists and menus

22. **ListItem** and **List**: icon/avatar slot, title, description, meta (time, badge), trailing actions revealed on hover, selectable variant.
23. **DropdownMenu** and **ContextMenu**: groups, icons, shortcuts, checkbox/radio items, destructive items, submenus.
24. **Accordion**: used standalone and inside the filter panel.

### 7.6 Overlays and feedback

25. **Modal/Dialog**: sizes sm/md/lg, 2xl radius, scrim + optional subtle backdrop blur, sticky footer actions, `ConfirmDialog` preset for destructive actions (destroy intent, typed-confirmation option).
26. **SideSheet**: floating overlay inset 12px from top/right/bottom, radius xl, sizes sm 400 / md 560 / lg 720, slide-in `--motion-slide`; header supports title block, prev/next stepper with position indicator ("5 of 48") for triage flows, and action buttons; scrollable body with section pattern (label left, value right rows); footer slot. Also a `docked` mode that pushes content instead of overlaying (used by the AI panel in the console).
27. **Popover**, **Tooltip** (and `RichTooltip` with title/body), **Toast** (sonner, intents, action button), **Banner/Callout**: inline info/success/warning/destroy/ai variants.
28. **EmptyState**: icon or small illustration slot, title, description, primary action; presets for "no results", "no data yet", "error".
29. **Skeleton** (text, block, avatar, table-row presets with shimmer), **Spinner**, **ProgressBar**.

### 7.7 Wizard / stepper

30. **Stepper**: horizontal and vertical, numbered steps with states (upcoming, current, complete, error), optional descriptions, clickable completed steps.
31. **Wizard** pattern: controlled multi-step container with step validation gates, back/next/finish footer, dirty-state guard. Demo flow: "Create detection rule" (Define → Logic → Test → Review and enable), reusing form inputs, the code editor, charts, and the YAML presenter.

### 7.8 Datagrid (flagship, own phase)

32. **DataGrid** on TanStack Table v8, styled as a raised surface card:
- **Densities**: compact / default / comfortable via row-height component tokens, toggle in toolbar.
- **Sorting**: single and multi-sort (shift-click), header sort indicators with order index numbers, clear-sort affordance.
- **Columns**: resizable (drag handle, double-click autosize optional), show/hide via column settings popover, min/max widths, optional pinning left for the selection column.
- **Complex cells**, shipped as reusable cell renderers: SeverityCell, EntityCell (avatar + primary + secondary line), TimeCell (mono relative time, absolute on tooltip), TagsCell (overflow +N), SparklineCell, StatusCell, NumberCell (right-aligned tabular-nums), ActionsCell (hover-revealed IconButtons + overflow menu), AiVerdictCell (suggested verdict chip + confidence), ExpandCell.
- **Nested rows**: expandable sub-rows (alert → its events) rendered as an indented sub-table or an inline JSON/YAML detail row.
- **Selection**: checkbox column with header tri-state; selected state raises a **floating bulk actions bar** (floating surface, bottom center: count, assign, change status, "summarize with AI", clear).
- **States**: loading skeleton rows, empty state, error state, sticky header, optional virtualization above ~200 rows.
- **Row interaction**: click opens the detail SideSheet; keyboard row focus and Enter to open.

### 7.9 Filter patterns

33. **FilterPanel (push, from the left)**: lives inside the grid shell; toggling it animates a ~300px panel in from the left and the table shrinks (push, never overlay; width transition or react-resizable-panels). Contains search-within-filters, Accordion groups of checkbox facets with counts, severity facet using SeverityBadges, time histogram mini-chart, applied-count header, clear all.
34. **FilterBar (horizontal, above the table)**: quick filter chips, "Add filter" builder popover (field → operator → value), applied filters as removable chips, saved views select, SearchInput, TimeRangePicker, density toggle, column settings; wired to the same filter state as the panel so both patterns stay in sync.

### 7.10 Code and data display

35. **CodeEditor**: CodeMirror 6 wrapper, YAML + JSON modes, line numbers, folding, custom light/dark themes built from tokens (mono font token, selection, gutter, syntax palette), read-only flag, min/max height, status bar slot.
36. **YamlPresenter**: read-only presenter for detection rules: syntax highlighting, line numbers, folding, copy button, optional highlighted line ranges, filename header chip.
37. **JsonViewer**: collapsible tree for event payloads, type-colored values, copy path/value, used inside grid expanded rows and the detail sheet.
38. **DiffView**: `@codemirror/merge` two-pane or unified diff, themed; the base for AI rule-change review.

### 7.11 Data viz

39. **ChartContainer** + themed Recharts kit: Line, Area, Bar (incl. stacked severity), Donut; tokenized palette (categorical ramp + severity mapping), floating-surface tooltip, legend, empty/loading states.
40. **Sparkline**: tiny line/area/bar, ~100x28, no axes, for table cells and metric cards.
41. **MetricCard**: KPI value (tabular-nums), label, delta arrow with success/destroy coloring, optional sparkline; used in console header strip.
42. **EventHistogram**: time-bucketed bar chart (events over time, severity-stacked), designed to sit above the datagrid; optional brush range selection synced to TimeRangePicker (brush is nice-to-have).

### 7.12 Utilities

43. **Avatar** (initials fallback, status dot) and **AvatarGroup** (+N overflow).
44. **Card**, **Separator**, **ScrollArea** (styled scrollbars both themes).
45. **RelativeTime** (auto-updating, mono, absolute on hover), **Timeline** (investigation/audit trail: dot + line, icon per event type, timestamps).
46. **ResizablePanels** wrapper (styled handles) for console splits.

## 8. AI patterns

AI is a first-class intent, not a bolt-on. Shared rules: AI-generated content is always labeled, provenance is visible, streaming never blocks the UI, and consequential AI actions require human approval.

47. **AI visual language**: `ai` intent tokens (violet family + `--gradient-ai`), AI-tinted surface (~5% violet alpha + 1px violet-tinted or gradient hairline border), sparkles icon as the marker. Documented in an MDX guidelines page.
48. **AiPanel**: the assistant surface. A SideSheet (overlay by default, docked push mode in the console) with: header (title, model/scope row, close), context chips showing what it can see ("3 alerts selected", "Last 24h"), scrollable transcript, PromptInput composer.
49. **PromptInput**: auto-growing textarea, send + stop-generation buttons, slash-command menu (cmdk popover), attach-context action that adds chips, Kbd hints (Enter to send, Shift+Enter newline).
50. **AiMessage**: assistant turn renderer with parts: streaming markdown text with animated caret, collapsible "working" section listing tool steps with status icons ("Queried 1,284 events across 3 sources"), result cards, citation/evidence chips linking to alerts or rules, footer actions (copy, thumbs up/down, regenerate).
51. **ThinkingIndicator**: animated sparkle/dots + rotating status line; **streaming skeleton** shimmer for pending blocks.
52. **AiCard / AiHighlight**: container for AI output embedded anywhere (grid sheet, wizard): AI-tinted surface, "AI generated" label with sparkles, optional ConfidenceBadge (high/medium/low), feedback + regenerate footer.
53. **AiInlineSuggestion**: ghost-text completion inside TextInput/Textarea, Tab to accept, Esc to dismiss (demo: suggested rule name and description in the wizard).
54. **AiDiffReview**: human-in-the-loop approval. DiffView of current vs AI-proposed YAML rule, summary of the change in an AiCard, explicit Approve (function) and Reject (ghost) actions, audit line after approval.
55. **Grid + triage integration**: AiVerdictCell (suggested verdict + confidence), row action "Explain this alert" opening AiPanel pre-seeded with that alert, bulk action "Summarize with AI".
56. **Mocked streaming**: a local async-generator mock streams canned, realistic analyst responses token-by-token (no network, no keys) so every AI story is interactive in Storybook.

## 9. Sample layout: the SIEM console

A fullscreen Storybook story (`Console/SIEM console`) assembling the system, with realistic data throughout:

- Floating **SideNav** (left, inset, collapsible to icons): product mark, search trigger (opens CommandPalette), sections like Overview, Alerts (CountBadge), Incidents, Hunting, Detection rules, Reports, Settings; user footer.
- **Header strip**: breadcrumb, 3 to 4 MetricCards (open alerts, critical, MTTR, events/sec with sparklines), TimeRangePicker, AI panel toggle (ai-intent IconButton).
- **Main card**: EventHistogram above the **alerts DataGrid** with FilterBar; FilterPanel toggle demonstrating the push behavior; Tabs above the grid (All / Needs review / Assigned to me, with counts).
- **Row click** opens the alert detail SideSheet: "n of 48" prev/next header, Edit/Open actions, label-left value-right field rows (severity, status, entity, MITRE technique, timestamps), tabs inside (Overview / Events / Rule), JsonViewer for events, YamlPresenter for the rule, Timeline, AiCard with a triage summary.
- **AiPanel** docked on the right (push mode) with the mocked streaming conversation about the selected alerts.
- Everything works: collapse, sort, multi-sort, resize, expand nested rows, select + bulk bar, both filter patterns, both themes.

## 10. Sample data

`src/sample-data/` with a seeded deterministic generator (stable across reloads) producing:

- **~150 alerts**: id, realistic title ("Impossible travel for k.nakamura", "Encoded PowerShell command on WS-ATH-114", "Brute force against OWA from 185.220.x.x"), severity, status, source (EDR, firewall, identity, DNS), MITRE technique id + name (T1110 Brute force, T1059.001 PowerShell, T1567 Exfiltration...), entity (user/host/ip), event count, first/last seen timestamps, assignee, tags, 24-point sparkline series, 3 to 8 nested event sub-rows with JSON payloads.
- **4+ Sigma-style YAML detection rules**, syntactically valid and realistic (impossible travel, brute force, encoded PowerShell, DNS tunneling).
- **Analysts**: names, initials avatars, roles.
- **Time series** for histogram and charts, severity-stacked.
- **Canned AI transcripts** for the streaming mock.

## 11. Storybook

- Structure: `Foundations/` (tokens docs), `Components/` (grouped as in section 7), `Patterns/` (Filters, Wizard, AI, Detail sheet), `Console/`.
- Theme toolbar via addon-themes (class strategy on `html`), canvas backgrounds matched to `bg-canvas` per theme so floating surfaces read correctly.
- addon-a11y enabled; autodocs for every component; each component's primary story shows the full variant matrix, plus focused stories for states.
- A "Principles" MDX page: the floating surface model, intent system, AI guidelines, density guidance.
- Scripts: `dev` (vite playground optional), `storybook`, `build-storybook`, `typecheck`, `lint`, `test`.

## 12. Quality bar

- `tsc --noEmit`, ESLint, and `storybook build` pass clean.
- addon-a11y shows no critical violations on component stories.
- Keyboard: tab order sane everywhere; arrows in menus/tabs/tree/grid rows; Esc closes overlays; focus trapped in modals and returned on close.
- Vitest covers: tree tri-state propagation, filter state sync (panel vs bar), time range preset parsing. Keep it small (10 to 15 tests).
- No raw hex outside `tokens.css` (add a lint rule or grep check in CI).

## 13. Phases

Each phase ends with: typecheck + lint + storybook build green, a commit, and a one-line summary. Keep going unless blocked.

- **Phase 0, scaffold**: Vite + React + TS strict, Tailwind v4, shadcn init (CSS variables), Storybook, fonts, ESLint/Prettier, Vitest, folder layout, git init + first commit.
- **Phase 1, tokens and theming**: section 5 and 6 complete, theme switching, shadcn bridge, Foundations docs, theme toolbar.
- **Phase 2, core components**: 7.1, 7.2, plus Field/TextInput/SearchInput/Textarea/Checkbox/Radio/Switch, Tabs, Tooltip, Popover, DropdownMenu, Toast, Card, Separator, Skeleton, Spinner, Avatar, Kbd, Banner, EmptyState.
- **Phase 3, composite components**: Select, MultiCombobox, TreeView (+tests), Slider, DatePicker, TimeRangePicker, ListItem, ContextMenu, Accordion, Modal/ConfirmDialog, SideSheet, ScrollArea, Breadcrumb, Pagination, CommandPalette, Stepper + Wizard shell.
- **Phase 4, datagrid and filters**: 7.8 and 7.9 complete, including cell renderers, nested rows, bulk bar, both filter patterns in sync.
- **Phase 5, code and data viz**: CodeEditor, YamlPresenter, JsonViewer, DiffView, chart kit, Sparkline, MetricCard, EventHistogram, Timeline, RelativeTime, ResizablePanels.
- **Phase 6, AI patterns**: section 8 complete with the streaming mock; finish the "Create detection rule" wizard demo using AiInlineSuggestion and AiDiffReview.
- **Phase 7, SIEM console**: section 9 assembled and fully interactive.
- **Phase 8, polish**: a11y pass, both-themes sweep of every story, Principles MDX, README (overview, principles, quickstart, scripts, roadmap), LICENSE.
- **Phase 9, publish**: section 14.

## 14. GitHub repo and public Storybook

**Account guard, mandatory before anything touches GitHub:**

1. Run `gh auth status` and `gh api user -q .login`.
2. The login must be exactly `dimitriszoitas`. If it is `jimzoitas` or anything else, STOP and ask Jim to switch (`gh auth switch --user dimitriszoitas` or `gh auth login`), then re-verify. Never create the repo under another account.

Then:

3. `gh repo create dimitriszoitas/aegis-ui --public --source . --remote origin --push` (description: "Aegis, a floating-surface design system for AI-assisted SIEM products. React, Tailwind v4, shadcn, Storybook.").
4. Add `.github/workflows/deploy-storybook.yml`: on push to `main`, install (pnpm cache), `build-storybook`, `actions/upload-pages-artifact` on `storybook-static`, `actions/deploy-pages` (permissions: `pages: write`, `id-token: write`).
5. Enable Pages with workflow builds: `gh api repos/dimitriszoitas/aegis-ui/pages -X POST -f build_type=workflow` (a 409 means it is already enabled, fine).
6. Push, watch the run (`gh run watch`), then verify `https://dimitriszoitas.github.io/aegis-ui/` actually loads and assets resolve under the subpath; fix base-path/asset issues if any.
7. Put the live Storybook URL at the top of the README and in the repo's website field.

## 15. Acceptance checklist

- [ ] Tokens: three tiers, light + dark, no raw hex outside tokens.css, Tailwind + shadcn bridged
- [ ] Light theme: white + subtle cool gray; dark theme: warm-leaning darks with a blue hint
- [ ] Floating model everywhere: inset floating SideNav with soft radius, floating sheets, surfaces + soft shadows + borders
- [ ] Buttons: 3 sizes x 3 emphasis x 4 intents (default, function, destroy, ai) + states, icon buttons
- [ ] Tags/chips: static, removable, interactive, counter; SeverityBadge and status set
- [ ] Forms complete: text, textarea, select, multi-combobox, tree with tri-state checkboxes and nesting, checkbox/radio/switch/slider, date + time range pickers, field wrapper
- [ ] Tabs: line and pill variants with counts
- [ ] Lists, menus, context menus, command palette
- [ ] Wizard/stepper with the detection-rule demo
- [ ] DataGrid: densities, sorting + multi-sort, complex cells, resizable columns, nested rows, selection with floating bulk bar, loading/empty/error, virtualization
- [ ] Filter patterns: left push panel and horizontal bar, state-synced
- [ ] Modals, confirm dialog, floating side sheets with n-of-m header
- [ ] CodeEditor + YamlPresenter + JsonViewer + DiffView, token-themed both modes
- [ ] Data viz: chart kit, sparklines (incl. in-table), metric cards, event histogram
- [ ] AI patterns: panel, prompt input, streaming mock, AI cards with labeling + feedback, inline suggestion, diff review, grid triage integration
- [ ] SIEM console sample layout: collapsible floating nav + working datagrid + detail sheet + AI panel
- [ ] All demo content is realistic SIEM material, zero placeholders
- [ ] Storybook runs locally; a11y clean on components; every story correct in both themes
- [ ] Public repo on github.com/dimitriszoitas (account verified) with Storybook live on GitHub Pages