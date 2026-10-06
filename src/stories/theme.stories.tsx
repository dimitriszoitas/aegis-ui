import type { Meta, StoryObj } from '@storybook/react-vite';
function ThemeSpecimen() {
 return <main className="stack story-pad" style={{maxWidth: 1100}}>
  <header><p className="muted">Aegis / Foundations</p><h1>Clarity at every layer</h1><p className="muted">Quiet surfaces. Clear intent. Focus where it matters.</p></header>
  <div className="story-grid">{['surface','surface-raised','hover','selected'].map(name => <section key={name} className="surface" style={{background: `var(--color-bg-${name})`}}><h3>{name.replace('-', ' ')}</h3><p className="muted">Investigate suspicious authentication across your environment.</p><span className="mono">WS-ATH-114 · T1110</span></section>)}</div>
  <section className="surface stack"><h2>Intent and severity</h2><div className="row">{['function','ai','destroy','success','warning'].map(name => <button key={name} style={{border: 0, padding: 'var(--space-2) var(--space-4)',borderRadius: 'var(--radius-md)',background: `var(--color-${name}-bg)`,color: 'var(--color-on-intent)'}}>{name}</button>)}</div><div className="row">{['critical','high','medium','low','info'].map(name => <span key={name} style={{padding: 'var(--space-1) var(--space-3)',borderRadius: 'var(--radius-full)',border: `1px solid var(--color-severity-${name}-border)`,background: `var(--color-severity-${name}-bg)`, color: `var(--color-severity-${name}-fg)`}}>{name}</span>)}</div></section>
  <div className="story-grid">{['raised','floating','overlay'].map(name => <section key={name} className="surface" style={{boxShadow: `var(--shadow-${name})`}}><h3>{name}</h3><p className="muted">Soft edges establish a clear surface hierarchy.</p></section>)}</div>
 </main>;
}
export default {title: 'Foundations/Theme', component: ThemeSpecimen} satisfies Meta<typeof ThemeSpecimen>;
export const Overview: StoryObj<typeof ThemeSpecimen> = {};
