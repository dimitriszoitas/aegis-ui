import { useState, type CSSProperties } from 'react';
import { Button } from '@/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card';
import { ArrowRight, Check, Layers, Moon, Server, Sun } from '@/components/icon';
import { SeverityBadge } from '@/components/severity-badge';
import { StatusBadge } from '@/components/status-badge';
import './token-story.css';

/** A scoped, live demonstration of the design system's actual token roles. */
export function TokenStory() {
  const [dark, setDark] = useState(true);
  const [triaged, setTriaged] = useState(false);
  const [spacing, setSpacing] = useState<'default' | 'roomy'>('default');
  const spacingToken = spacing === 'roomy' ? '--space-5' : '--space-3';

  return (
    <section
      id="foundations"
      className="marketing-token-story marketing-container"
      aria-labelledby="token-system-title"
    >
      <div className="marketing-token-heading">
        <p className="marketing-section-label">THE FOUNDATION</p>
        <h2 id="token-system-title">Tokens give every value a job.</h2>
      </div>
      <div className="marketing-token-workbench-grid">
        <div className="marketing-token-model">
          <p className="marketing-token-intro">
            A growing platform shouldn’t collect a different shade, spacing rule, and button
            treatment on every screen. Shared tokens make those decisions part of the system.
          </p>
          <dl className="marketing-token-layers">
            <div>
              <dt>Primitives</dt>
              <dd>A repeatable scale for spacing, type, and corners.</dd>
            </div>
            <div>
              <dt>Semantic roles</dt>
              <dd>Surface, text, and action colors with values for each theme.</dd>
            </div>
            <div>
              <dt>Component settings</dt>
              <dd>Shared choices applied to cards, controls, and dense grids.</dd>
            </div>
          </dl>
          <div className="marketing-token-trace">
            <span className="marketing-token-trace-label">FOLLOW THE SPACING</span>
            <ol aria-label="Card padding token dependency">
              <li>
                <code>{spacingToken}</code>
                <span>{spacing === 'roomy' ? '20px' : '12px'}</span>
              </li>
              <li>
                <ArrowRight size={14} aria-hidden="true" />
                <code>--layout-card-padding</code>
              </li>
              <li>
                <ArrowRight size={14} aria-hidden="true" />
                <code>CardContent</code>
                <span>padding</span>
              </li>
            </ol>
            <p>Change the setting here. Every card in the preview follows.</p>
          </div>
        </div>
        <div
          className={`marketing-token-preview ${dark ? 'dark' : 'aegis-theme-light'}`}
          data-theme={dark ? 'dark' : 'light'}
          style={
            {
              colorScheme: dark ? 'dark' : 'light',
              '--layout-card-padding': `var(${spacingToken})`,
            } as CSSProperties
          }
        >
          <div className="marketing-token-preview-heading">
            <div>
              <p>LIVE COMPONENTS</p>
              <h3>Try a system-wide decision.</h3>
            </div>
            <div className="marketing-token-theme" role="group" aria-label="Token preview theme">
              <button type="button" aria-pressed={!dark} onClick={() => setDark(false)}>
                <Sun size={14} aria-hidden="true" /> Light
              </button>
              <button type="button" aria-pressed={dark} onClick={() => setDark(true)}>
                <Moon size={14} aria-hidden="true" /> Dark
              </button>
            </div>
          </div>

          <label className="marketing-token-spacing-control">
            Card spacing
            <select
              aria-label="Card spacing"
              value={spacing}
              onChange={(event) => setSpacing(event.target.value === 'roomy' ? 'roomy' : 'default')}
            >
              <option value="default">Default · 12px</option>
              <option value="roomy">Roomy · 20px</option>
            </select>
            <span>Preview override</span>
          </label>

          <div
            className="marketing-token-role-swatches"
            role="group"
            aria-label="Live semantic token colors"
          >
            <span>
              <i className="marketing-token-swatch-surface" aria-hidden="true" /> Surface
            </span>
            <span>
              <i className="marketing-token-swatch-text" aria-hidden="true" /> Text
            </span>
            <span>
              <i className="marketing-token-swatch-action" aria-hidden="true" /> Action
            </span>
          </div>

          <div className="marketing-token-components">
            <Card elevation="flat" className="marketing-token-signal">
              <CardHeader>
                <div className="marketing-token-signal-meta">
                  <span>Sample investigation</span>
                  <SeverityBadge severity="high" />
                </div>
                <CardTitle>Unexpected privilege change</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="marketing-token-signal-description">
                  A new administrator role was granted outside the approved change window.
                </p>
                <div className="marketing-token-signal-actions">
                  <StatusBadge status={triaged ? 'triaged' : 'new'} />
                  <Button
                    size="sm"
                    intent="function"
                    emphasis="secondary"
                    leadingIcon={triaged ? <Check size={14} /> : undefined}
                    onClick={() => setTriaged((value) => !value)}
                  >
                    {triaged ? 'Undo triage' : 'Mark triaged'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <div className="marketing-token-context">
              <Card elevation="flat">
                <CardContent>
                  <span>
                    <Server size={14} aria-hidden="true" /> Entity
                  </span>
                  <strong>prod-api-03</strong>
                  <small>Host identifier</small>
                </CardContent>
              </Card>
              <Card elevation="flat">
                <CardContent>
                  <span>
                    <Layers size={14} aria-hidden="true" /> Evidence
                  </span>
                  <strong>24 events</strong>
                  <small>Sample activity</small>
                </CardContent>
              </Card>
            </div>
          </div>
          <p className="marketing-token-preview-note" aria-live="polite" role="status">
            {dark ? 'Dark' : 'Light'} preview · {spacing === 'roomy' ? 'Roomy' : 'Default'} card
            spacing · {triaged ? 'Sample marked triaged' : 'Sample awaiting review'}
          </p>
        </div>
      </div>
    </section>
  );
}
