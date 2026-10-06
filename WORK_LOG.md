# Aegis build log

The contract is [BUILD_PLAN.md](BUILD_PLAN.md). Phases are executed in order, with typecheck, lint, and Storybook build before each commit.

- Phase 0 complete, `5297b76`: React 19, Vite 8, Tailwind 4, Storybook 10.6, strict TypeScript, fonts, tooling, shadcn Radix configuration.
- Phase 1 complete, `2014d39`: three-tier tokens, light/dark switching, Tailwind/shadcn bridge, source-derived Foundations MDX. Light function/tertiary values adjusted for AA contrast.
- Phase 2 complete, `ea59eab`: core components and their stories. 146 story/theme scans plus targeted retests passed after accessibility fixes. Loading labels retain accessible names; disabled descriptions remain readable; menus default to non-modal behavior.
- Phase 3 complete: composite controls, tree, dates, navigation, overlays, wizard shell. Eight logic tests pass (four tree, four time range). Browser checks cover dialog focus/inertness, typed confirmation, menu Tab/Shift+Tab and context-menu keyboard invocation. Composite stories passed both-theme accessibility checks, including static retests of Select repairs.
- Phase 4 complete: deterministic alerts and valid detection rules, full TanStack grid and ten cell renderers, synchronized filter bar/push panel, functional bulk assignment/status/AI context. Fifteen logic tests pass; 116 story/theme scans plus 32 final interaction-aware retests pass. Virtualization verified with 1,000 rows and measured expanded details.
- User refinements included: vertical wizard retained for the full demo; 6/8/10px control radii by size, sidebar 16/12px with top toggle, chevron inset, gradient AI treatments, line/dot separators with normal/light emphasis.
- Phase 5 complete: token-themed YAML/JSON editor, read-only YAML presenter, split/unified diffs, keyboard JSON viewer with copy paths/values, Recharts kit, sparklines, metrics, brushed event histogram, timeline, relative time, and resizable panels. Verified 48 code, 46 chart, 12 JSON, 42 integration/utility/theme checks plus 22 static code retests; fixed deleted-line contrast. Existing 15 logic tests pass; typecheck/lint/build green.
- Phase 6 complete: local streaming assistant, prompt composer, AI messages/cards/feedback, inline completions, guarded YAML approval, and the full horizontal/vertical detection wizard with validated replay. AI story suites and 54 final static story/theme checks pass; 11 replay assertions and cancellation/stale-response regressions pass. Typecheck, lint, 15 logic tests, and Storybook build are green. The story verifier now accepts portal-only overlay stories.
- Phase 7 complete: fullscreen console and Vite playground, persistent queue/grid state, scoped metrics, histogram, working navigation views, editable detail sheet, assistant handoff/evidence links, and rule creation into the workspace. Detail-sheet and supporting-view suites pass both themes; 44 static checks were repaired with condition-based portal readiness and six clean retests, followed by 24 clean queue/console checks. Twelve integrated journeys plus queue persistence and selection-scope regressions pass. Mobile layout reviewed at 390px; typecheck/lint/15 logic tests/Storybook and playground builds pass.
- Phase 8 complete: README/MIT license, expanded Principles and AI guidance, themed standalone MDX, secondary prop references, isolated overlay docs, and reviewed console screenshots. Full 696-case story/theme sweep had zero axe violations; two radio play timing failures were corrected and retested. New chip-removal and Field-composed time-range cases pass, followed by 50 clean final story/theme retests. Ten final MDX/theme checks, 26 overlay-doc checks, toolbar theme round-trip, public Props audit, and keyboard refinements pass. Typecheck/lint/15 logic tests/Storybook and playground builds are green. Final inventory: 350 stories, verified in both themes across the full sweep and changed-story retests.
- Phase 9 in progress: verified the active account is `dimitriszoitas`, created the public `dimitriszoitas/aegis-ui` repository, uploaded phases 0–8, and enabled workflow-based Pages. Added a Node 24/pnpm cached deployment that checks types, lint, logic tests, and Storybook before publishing. Local checks and a strict `/aegis-ui/` subpath browser smoke pass; live deployment verification remains.

## Verification setup

- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build-storybook`.
- `pnpm storybook`: development server on port 6006.
- `pnpm exec vite preview --outDir storybook-static --host 127.0.0.1 --port 6007`: static verification server.
- `STORYBOOK_URL=http://127.0.0.1:6007 pnpm test:stories`: render and axe WCAG A/AA scan of every story in light and dark.
- `STORY_FILTER` optionally selects story IDs using a regular expression. `CAPTURE_STORIES=1` saves screenshots. Reports go in ignored `test-results/`.
- Storybook's legacy test runner was removed after its current package reported ended support; the maintained Playwright/axe integrations perform the sweep directly. Interactive story play functions and manual keyboard checks supplement automated scans.

## Outstanding publication guard

Before GitHub operations, run both `gh auth status` and `gh api user -q .login`. The account must be exactly `dimitriszoitas`. Do not create or push under another account. The requested public repository is `dimitriszoitas/aegis-ui`; deployment is GitHub Pages, with no npm publishing.
