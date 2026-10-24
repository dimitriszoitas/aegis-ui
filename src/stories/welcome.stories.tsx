import type { Meta, StoryObj } from '@storybook/react-vite';
import { FoundationLinks } from './foundations/foundation-examples';
function Welcome() {
  return (
    <main className="stack story-pad" style={{ maxWidth: 1100 }}>
      <header>
        <p className="muted">Aegis / Design system</p>
        <h1>Components for clear application interfaces</h1>
        <p>
          Reusable controls and patterns for applications, dashboards, developer tools, and
          data-rich interfaces. Fundamental and Fundamental Floating share light and dark palettes.
        </p>
      </header>
      <section className="surface">
        <h2>Start with the principles</h2>
        <p>
          Explore semantic tokens, light and dark surfaces, compact controls, and data density.
          Fundamental is the default; Fundamental Floating contains navigation and assistant panels.
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
          validation, record details, and explicit approval. The Application Demo combines them into
          a connected workspace for projects, customers, invoices, and team members.
        </p>
        <p className="muted">
          All records are synthetic. AI responses stream locally; no keys, model requests, or
          external service connections are needed. Console edits reset when the preview reloads.
        </p>
      </section>
    </main>
  );
}
export default { title: 'Foundations/Welcome', component: Welcome } satisfies Meta<typeof Welcome>;
export const Overview: StoryObj<typeof Welcome> = {};
