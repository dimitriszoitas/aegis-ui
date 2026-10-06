import type { Meta, StoryObj } from '@storybook/react-vite';
import { FoundationLinks } from './foundations/foundation-examples';
function Welcome() {
  return (
    <main className="stack story-pad" style={{ maxWidth: 1100 }}>
      <header>
        <p className="muted">Aegis / Design system</p>
        <h1>Security operations, in context</h1>
        <p>
          A floating surface design system for evidence-led investigations and AI assistance that
          keeps the analyst in control.
        </p>
      </header>
      <section className="surface">
        <h2>Start with the principles</h2>
        <p>
          Explore semantic tokens, light and dark surfaces, scaled control corners, and accessible
          density. Use the theme toolbar to compare every component in both modes.
        </p>
        <a href="./?path=/docs/foundations-principles--docs" target="_top">
          Read the design principles
        </a>
      </section>
      <section>
        <h2>Try complete workflows</h2>
        <FoundationLinks />
      </section>
      <section className="surface">
        <h2>Build from working examples</h2>
        <p>
          Components contain focused variants and states. Patterns show coordinated filters,
          validation, evidence details, and explicit approval. The console assembles them into an
          interactive workspace.
        </p>
        <p className="muted">
          All records are synthetic. AI responses stream locally; no keys, model requests, or
          security-system connections are needed. Console edits reset when the preview reloads.
        </p>
      </section>
    </main>
  );
}
export default { title: 'Foundations/Welcome', component: Welcome } satisfies Meta<typeof Welcome>;
export const Overview: StoryObj<typeof Welcome> = {};
