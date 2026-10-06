# Aegis build log

The contract is [BUILD_PLAN.md](BUILD_PLAN.md). Phases are executed in order, with typecheck, lint, and Storybook build before each commit.

- Phase 0 complete, `5297b76`: React 19, Vite 8, Tailwind 4, Storybook 10.6, strict TypeScript, fonts, tooling, shadcn Radix configuration.
- Phase 1 complete, `2014d39`: three-tier tokens, light/dark switching, Tailwind/shadcn bridge, source-derived Foundations MDX. Light function/tertiary values adjusted for AA contrast.
- Phase 2 complete, `ea59eab`: core components and their stories. 146 story/theme scans plus targeted retests passed after accessibility fixes. Loading labels retain accessible names; disabled descriptions remain readable; menus default to non-modal behavior.
- Phase 3 complete: composite controls, tree, dates, navigation, overlays, wizard shell. Eight logic tests pass (four tree, four time range). Browser checks cover dialog focus/inertness, typed confirmation, menu Tab/Shift+Tab and context-menu keyboard invocation. Composite stories passed both-theme accessibility checks, including static retests of Select repairs.
- Phase 4 complete: deterministic alerts and valid detection rules, full TanStack grid and ten cell renderers, synchronized filter bar/push panel, functional bulk assignment/status/AI context. Fifteen logic tests pass; 116 story/theme scans plus 32 final interaction-aware retests pass. Virtualization verified with 1,000 rows and measured expanded details.
- User refinements included: vertical wizard retained for the full demo; 6/8/10px control radii by size, sidebar 16/12px with top toggle, chevron inset, gradient AI treatments, line/dot separators with normal/light emphasis.
- Phases 5–9 pending: code/viz; AI; console; polish; GitHub/Pages.

## Verification setup

- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build-storybook`.
- `pnpm storybook`: development server on port 6006.
- `pnpm exec vite preview --outDir storybook-static --host 127.0.0.1 --port 6007`: static verification server.
- `STORYBOOK_URL=http://127.0.0.1:6007 pnpm test:stories`: render and axe WCAG A/AA scan of every story in light and dark.
- `STORY_FILTER` optionally selects story IDs using a regular expression. `CAPTURE_STORIES=1` saves screenshots. Reports go in ignored `test-results/`.
- Storybook's legacy test runner was removed after its current package reported ended support; the maintained Playwright/axe integrations perform the sweep directly. Interactive story play functions and manual keyboard checks supplement automated scans.

## Outstanding publication guard

Before GitHub operations, run both `gh auth status` and `gh api user -q .login`. The account must be exactly `dimitriszoitas`. Do not create or push under another account. The requested public repository is `dimitriszoitas/aegis-ui`; deployment is GitHub Pages, with no npm publishing.
