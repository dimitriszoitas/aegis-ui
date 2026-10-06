import { useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowRight, BellRing, ShieldCheck, Sparkles } from 'lucide-react';
import { tokenNames, tokenValues, type TokenTheme } from './token-source';
import './foundations.css';

export interface ThemeFrameProps {
  theme: TokenTheme;
  children: ReactNode;
}
export function ThemeFrame({ theme, children }: ThemeFrameProps) {
  return (
    <section
      className={`foundation-frame ${theme === 'dark' ? 'dark' : ''}`}
      data-theme={theme}
      style={{ ...tokenValues[theme], colorScheme: theme } as CSSProperties}
      aria-label={`${theme} theme examples`}
    >
      <div className="foundation-eyebrow">{theme} theme</div>
      {children}
    </section>
  );
}

export interface ColorSwatchesProps {
  prefix?: string;
}
export function ColorSwatches({ prefix = '--color-bg-' }: ColorSwatchesProps) {
  const names = tokenNames(prefix);
  return (
    <div className="foundation-theme-pair">
      {(['light', 'dark'] as const).map((theme) => (
        <ThemeFrame key={theme} theme={theme}>
          <div className="foundation-swatch-grid">
            {names.map((name) => (
              <div className="foundation-swatch" key={name}>
                <div className="foundation-swatch-color" style={{ background: `var(${name})` }} />
                <code>{name.replace('--color-', '')}</code>
                <span className="foundation-token-value">{tokenValues[theme][name]}</span>
              </div>
            ))}
          </div>
        </ThemeFrame>
      ))}
    </div>
  );
}

const intents = ['function', 'ai', 'destroy', 'success', 'warning'] as const;
export function IntentExamples() {
  return (
    <div className="foundation-theme-pair">
      {(['light', 'dark'] as const).map((theme) => (
        <ThemeFrame key={theme} theme={theme}>
          <div className="foundation-stack">
            {intents.map((intent) => (
              <div className="foundation-intent-row" key={intent}>
                <span
                  className="foundation-intent-mark"
                  style={{
                    background: `var(--color-${intent}-bg)`,
                    color: 'var(--color-on-intent)',
                  }}
                >
                  {intent === 'ai' ? (
                    <Sparkles size={16} aria-hidden />
                  ) : (
                    <ArrowRight size={16} aria-hidden />
                  )}
                </span>
                <code>{intent}</code>
                <span
                  className="foundation-soft-chip"
                  style={{
                    background: `var(--color-${intent}-soft)`,
                    color: `var(--color-${intent}-fg)`,
                  }}
                >
                  Soft surface
                </span>
              </div>
            ))}
          </div>
        </ThemeFrame>
      ))}
    </div>
  );
}

export function SeverityExamples() {
  return (
    <div className="foundation-theme-pair">
      {(['light', 'dark'] as const).map((theme) => (
        <ThemeFrame key={theme} theme={theme}>
          <div className="foundation-wrap">
            {['critical', 'high', 'medium', 'low', 'info'].map((severity) => (
              <span
                className="foundation-severity"
                key={severity}
                style={{
                  background: `var(--color-severity-${severity}-bg)`,
                  color: `var(--color-severity-${severity}-fg)`,
                  borderColor: `var(--color-severity-${severity}-border)`,
                }}
              >
                <span aria-hidden>●</span>
                {severity}
              </span>
            ))}
          </div>
        </ThemeFrame>
      ))}
    </div>
  );
}

export function SurfaceExamples() {
  return (
    <div className="foundation-theme-pair">
      {(['light', 'dark'] as const).map((theme) => (
        <ThemeFrame key={theme} theme={theme}>
          <div className="foundation-stack">
            {(['surface', 'raised', 'floating', 'overlay'] as const).map((level) => (
              <div className={`foundation-surface foundation-surface-${level}`} key={level}>
                <ShieldCheck size={18} aria-hidden />
                <div>
                  <strong>{level}</strong>
                  <span>Identity protection · 24 active detections</span>
                </div>
              </div>
            ))}
          </div>
        </ThemeFrame>
      ))}
    </div>
  );
}

export function RadiusExamples() {
  return (
    <div className="foundation-example foundation-wrap">
      {tokenNames('--radius-').map((name) => (
        <div className="foundation-radius" key={name} style={{ borderRadius: `var(${name})` }}>
          <code>{name.replace('--radius-', '')}</code>
          <span>{tokenValues.light[name]}</span>
        </div>
      ))}
    </div>
  );
}

export function SpacingExamples() {
  return (
    <div className="foundation-example foundation-stack">
      {tokenNames('--space-').map((name) => (
        <div className="foundation-spacing-row" key={name}>
          <code>{name.replace('--', '')}</code>
          <div className="foundation-spacing-track">
            <span style={{ width: `var(${name})` }} />
          </div>
          <span>{tokenValues.light[name]}</span>
        </div>
      ))}
    </div>
  );
}

export function TypographyExamples() {
  return (
    <div className="foundation-example foundation-stack">
      {tokenNames('--text-')
        .reverse()
        .map((name) => (
          <div className="foundation-type-row" key={name}>
            <code>{tokenValues.light[name]}</code>
            <span style={{ fontSize: `var(${name})` }}>Investigate with clarity</span>
          </div>
        ))}
      <div className="foundation-type-mono">
        2026-06-18 09:42:16 UTC · ALR-00842 · WS-ATH-114 · 10.12.34.18
      </div>
      <div className="foundation-type-numbers">1,284 events · 24 detections · 98.4% coverage</div>
    </div>
  );
}

export function MotionExamples() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="foundation-example">
      <button
        className="foundation-demo-button"
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-controls="foundation-motion-panel"
      >
        {expanded ? 'Close' : 'Open'} investigation panel
      </button>
      <div className="foundation-motion-stage">
        <div
          id="foundation-motion-panel"
          className={`foundation-motion-panel ${expanded ? 'is-open' : ''}`}
          aria-hidden={!expanded}
        >
          <BellRing size={20} aria-hidden />
          <strong>Impossible travel detected</strong>
          <span>k.nakamura · T1078 · 6 correlated events</span>
        </div>
      </div>
      <div className="foundation-wrap">
        {tokenNames('--motion-').map((name) => (
          <code key={name}>
            {name}: {tokenValues.light[name]}
          </code>
        ))}
      </div>
      <p>
        Motion follows the device’s reduced-motion preference. Focus stays on the trigger in this
        visual demonstration.
      </p>
    </div>
  );
}

export function AiLanguageExample() {
  return (
    <div className="foundation-example foundation-ai-card">
      <div className="foundation-ai-label">
        <Sparkles size={16} aria-hidden />
        AI generated · Analyst assistant
      </div>
      <strong>Review the successful sign-in after 37 failed attempts</strong>
      <p>
        The account authenticated from a new network shortly after a burst of failures. Compare the
        device fingerprint with the employee’s known workstation before resolving the alert.
      </p>
      <div className="foundation-wrap">
        <span className="foundation-evidence">Evidence · ALR-00842</span>
        <span className="foundation-evidence">Source · Identity provider</span>
        <span className="foundation-evidence">Confidence · Medium</span>
      </div>
      <div className="foundation-ai-footnote">
        Suggested next step: verify the sign-in with the account owner. An analyst must approve any
        account suspension.
      </div>
    </div>
  );
}
