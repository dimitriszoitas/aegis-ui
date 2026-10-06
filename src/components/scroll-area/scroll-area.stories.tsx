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
        <ScrollArea label="Authentication event stream" maxHeight={240} className="surface">
          {Array.from({ length: 24 }, (_, index) => (
            <p
              key={index}
              className="mono"
              style={{
                fontSize: 'var(--text-xs)',
                overflowWrap: 'anywhere',
                paddingBlock: 'var(--space-2)',
              }}
            >{`2026-10-06T08:${String(index + 10).padStart(2, '0')}:24Z · WS-ATH-114 · Authentication ${index % 3 === 0 ? 'denied' : 'succeeded'} · k.nakamura`}</p>
          ))}
        </ScrollArea>
      </section>
      <section className="stack">
        <h3>Horizontal evidence sequence</h3>
        <p className="muted">Scroll sideways to compare the complete authentication sequence.</p>
        <ScrollArea label="Authentication evidence sequence" maxHeight={200} className="surface">
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
              <li key={index} className="surface stack" style={{ width: 220 }}>
                <strong>Evidence {index + 1}</strong>
                <span className="mono">08:{String(index + 10).padStart(2, '0')}:24 UTC</span>
                <span className="muted">
                  {index % 3 === 0 ? 'Sign-in denied' : 'Sign-in succeeded'}
                </span>
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
      <h3>Wide event evidence</h3>
      <p className="muted">
        The evidence table exceeds the viewport in both directions. Focus it to scroll with the
        arrow keys.
      </p>
      <ScrollArea label="Wide authentication evidence" maxHeight={300} className="surface">
        <table style={{ width: 1200, borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
          <caption style={{ textAlign: 'left', paddingBottom: 'var(--space-3)' }}>
            Correlated authentication events
          </caption>
          <thead>
            <tr>
              {['Timestamp', 'Host', 'User', 'Source IP', 'Result', 'Detection rule'].map(
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
                  'WS-ATH-114',
                  'k.nakamura',
                  `192.0.2.${index + 10}`,
                  index % 3 === 0 ? 'Denied' : 'Succeeded',
                  'Unusual sign-in from a new device',
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
      <h3>Short investigation note</h3>
      <p className="muted">Content that fits the available space does not need a scrollbar.</p>
      <ScrollArea label="Investigation summary" maxHeight={180} className="surface">
        <p>All related sign-ins have been reviewed. No additional evidence is available.</p>
      </ScrollArea>
    </section>
  ),
};
