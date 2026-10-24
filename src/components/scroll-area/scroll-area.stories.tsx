import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScrollArea } from './scroll-area';
export default { title: 'Components/Utilities/ScrollArea', component: ScrollArea } satisfies Meta<
  typeof ScrollArea
>;
export const Matrix: StoryObj<typeof ScrollArea> = {
  render: () => (
    <div className="stack" style={{ maxWidth: 760 }}>
      <section className="stack">
        <h3>Vertical event stream</h3>
        <p className="muted">Focus the event stream and use the arrow keys or Page Down.</p>
        <ScrollArea label="Project update event stream" maxHeight={240} className="story-layout">
          {Array.from({ length: 24 }, (_, index) => (
            <p
              key={index}
              className="mono"
              style={{
                fontSize: 'var(--text-xs)',
                overflowWrap: 'anywhere',
                paddingBlock: 'var(--space-2)',
              }}
            >{`2026-10-06T08:${String(index + 10).padStart(2, '0')}:24Z · PRJ-0042 · Project update ${index % 3 === 0 ? 'blocked' : 'completed'} · k.nakamura`}</p>
          ))}
        </ScrollArea>
      </section>
      <section className="stack">
        <h3>Horizontal activity sequence</h3>
        <p className="muted">Scroll sideways to compare the complete project update sequence.</p>
        <ScrollArea
          label="Project update activity sequence"
          maxHeight={200}
          className="story-layout"
        >
          <ol
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              width: 'max-content',
              listStyle: 'none',
              margin: 0,
              padding: 0,
            }}
          >
            {Array.from({ length: 8 }, (_, index) => (
              <li key={index} className="story-layout stack" style={{ width: 220 }}>
                <strong>Update {index + 1}</strong>
                <span className="mono">08:{String(index + 10).padStart(2, '0')}:24 UTC</span>
                <span className="muted">{index % 3 === 0 ? 'Task blocked' : 'Task completed'}</span>
              </li>
            ))}
          </ol>
        </ScrollArea>
      </section>
    </div>
  ),
};
export const BothAxes: StoryObj<typeof ScrollArea> = {
  render: () => (
    <section className="stack" style={{ maxWidth: 760 }}>
      <h3>Wide event activity</h3>
      <p className="muted">
        The activity table exceeds the viewport in both directions. Focus it to scroll with the
        arrow keys.
      </p>
      <ScrollArea label="Wide project update activity" maxHeight={300} className="story-layout">
        <table style={{ width: 1200, borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
          <caption style={{ textAlign: 'left', paddingBottom: 'var(--space-3)' }}>
            Correlated project update events
          </caption>
          <thead>
            <tr>
              {['Timestamp', 'Project', 'User', 'Workspace', 'Result', 'Workflow rule'].map(
                (label) => (
                  <th
                    key={label}
                    scope="col"
                    style={{ textAlign: 'left', padding: 'var(--space-3)' }}
                  >
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 24 }, (_, index) => (
              <tr key={index}>
                {[
                  `2026-10-06T08:${String(index + 10).padStart(2, '0')}:24Z`,
                  'PRJ-0042',
                  'k.nakamura',
                  `Workspace ${index + 1}`,
                  index % 3 === 0 ? 'Blocked' : 'Completed',
                  'Customer onboarding',
                ].map((value, column) => (
                  <td
                    key={column}
                    style={{
                      padding: 'var(--space-3)',
                      borderTop: '1px solid var(--color-border-subtle)',
                      fontFamily: column < 4 ? 'var(--font-mono)' : undefined,
                    }}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </section>
  ),
};
export const NoOverflow: StoryObj<typeof ScrollArea> = {
  render: () => (
    <section className="stack" style={{ maxWidth: 760 }}>
      <h3>Short project note</h3>
      <p className="muted">Content that fits the available space does not need a scrollbar.</p>
      <ScrollArea label="Project summary" maxHeight={180} className="story-layout">
        <p>All related milestones have been reviewed. The next milestone is ready to plan.</p>
      </ScrollArea>
    </section>
  ),
};
