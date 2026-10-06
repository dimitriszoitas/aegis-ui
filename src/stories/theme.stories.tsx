import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkles } from '@/components/icon';
import { Button, type Intent } from '@/components/button';
import { Tag } from '@/components/tag';
import { SeverityBadge, type Severity } from '@/components/severity-badge';
const actions: { intent: Intent; label: string }[] = [
  { intent: 'default', label: 'View evidence' },
  { intent: 'function', label: 'Investigate alert' },
  { intent: 'ai', label: 'Explain with AI' },
  { intent: 'destroy', label: 'Delete draft' },
];
function ThemeSpecimen() {
  const [selection, setSelection] = useState('Select a control to inspect its treatment.');
  return (
    <main className="stack story-pad" style={{ maxWidth: 1100 }}>
      <header>
        <p className="muted">Aegis / Foundations</p>
        <h1>Clarity at every layer</h1>
        <p className="muted">Quiet surfaces. Clear intent. Focus where it matters.</p>
      </header>
      <div className="story-grid">
        {[
          { token: 'surface', label: 'Surface' },
          { token: 'surface-raised', label: 'Raised surface' },
          { token: 'hover', label: 'Hover surface' },
          { token: 'selected', label: 'Selected surface' },
        ].map(({ token, label }) => (
          <section
            key={token}
            className="surface"
            style={{ background: `var(--color-bg-${token})` }}
          >
            <h2 style={{ fontSize: 'var(--text-md)' }}>{label}</h2>
            <p className="muted">Investigate suspicious authentication across your environment.</p>
            <span className="mono">WS-ATH-114 · T1110</span>
          </section>
        ))}
      </div>
      <section className="surface stack">
        <h2>Actions and intent</h2>
        {(['primary', 'secondary', 'tertiary', 'ghost'] as const).map((emphasis) => (
          <div className="row" key={emphasis} aria-label={`${emphasis} actions`}>
            {actions.map(({ intent, label }) => (
              <Button
                key={intent}
                intent={intent}
                emphasis={emphasis}
                leadingIcon={intent === 'ai' ? <Sparkles size={15} /> : undefined}
                onClick={() => setSelection(`${label}: ${emphasis} ${intent} treatment selected.`)}
              >
                {label}
              </Button>
            ))}
          </div>
        ))}
        <p className="muted" role="status">
          {selection}
        </p>
        <div className="row">
          <Tag intent="success">Replay complete</Tag>
          <Tag intent="warning">Review required</Tag>
        </div>
      </section>
      <section className="surface stack">
        <h2>Severity</h2>
        <div className="row">
          {(['critical', 'high', 'medium', 'low', 'info'] as Severity[]).map((severity) => (
            <SeverityBadge key={severity} severity={severity} />
          ))}
        </div>
      </section>
      <section className="surface stack">
        <h2>Control sizes</h2>
        <div className="row">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Button
              key={size}
              size={size}
              emphasis="secondary"
              onClick={() =>
                setSelection(
                  `${size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'} control selected.`,
                )
              }
            >
              {size === 'sm' ? 'Small · 28px' : size === 'md' ? 'Medium · 34px' : 'Large · 40px'}
            </Button>
          ))}
        </div>
      </section>
      <div className="story-grid">
        {['raised', 'floating', 'overlay'].map((name) => (
          <section key={name} className="surface" style={{ boxShadow: `var(--shadow-${name})` }}>
            <h2 style={{ fontSize: 'var(--text-md)' }}>{name[0].toUpperCase() + name.slice(1)}</h2>
            <p className="muted">Soft edges establish a clear surface hierarchy.</p>
          </section>
        ))}
      </div>
    </main>
  );
}
export default { title: 'Foundations/Theme', component: ThemeSpecimen } satisfies Meta<
  typeof ThemeSpecimen
>;
export const Overview: StoryObj<typeof ThemeSpecimen> = {};
