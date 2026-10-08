import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Copy, Plus, Search } from '@/components/icon';
import { Button } from '@/components/button';
import { Kbd } from '@/components/kbd';
import { SeverityBadge } from '@/components/severity-badge';
import { StatusBadge } from '@/components/status-badge';
import { Sparkline } from '@/components/sparkline';
import { applyTheme } from '@/lib/theme';
import { ComponentShowcase } from './component-showcase';
import { ComponentCanvas } from './component-canvas';
import { TokenStory } from './token-story';
import { MarketingHeader, MarketingFooter, marketingLinks } from './marketing-chrome';
import './marketing-site.css';

const clone = 'git clone https://github.com/dimitriszoitas/aegis-ui.git';

function CollectionPreview() {
  return (
    <section
      id="components"
      className="marketing-collection marketing-container"
      aria-labelledby="collection-title"
    >
      <div className="marketing-collection-heading">
        <div>
          <p className="marketing-section-label">THE COMPONENT COLLECTION</p>
          <h2 id="collection-title">
            Small details.
            <br />A complete system.
          </h2>
          <p className="marketing-heading-description">
            From the first input to the thousandth row. Components that share a language, at every
            scale.
          </p>
        </div>
        <a className="marketing-underlined-link" href={marketingLinks.components}>
          Browse all components <ArrowUpRight size={17} />
        </a>
      </div>
      <div className="marketing-specimens">
        <a className="marketing-specimen" data-tone="blue" href="?view=components&component=button">
          <div
            className="marketing-specimen-art marketing-specimen-controls"
            inert
            aria-hidden="true"
          >
            <div className="marketing-specimen-inner">
              <div className="marketing-specimen-field">
                <span>Rule name</span>
                <div>
                  <Search size={15} />
                  Suspicious process activity<Kbd>⌘ K</Kbd>
                </div>
              </div>
              <div className="marketing-specimen-buttons">
                <Button size="md" leadingIcon={<Plus size={15} />}>
                  Create rule
                </Button>
                <Button size="md" emphasis="tertiary">
                  Save draft
                </Button>
              </div>
              <div className="marketing-specimen-inline">
                <i />
                <span>Changes saved</span>
                <span>just now</span>
              </div>
            </div>
          </div>
          <div className="marketing-specimen-caption">
            <span>Actions & input</span>
            <ArrowUpRight size={18} />
            <p>Buttons, fields, selection, and command menus.</p>
          </div>
        </a>
        <a
          className="marketing-specimen"
          data-tone="coral"
          href="?view=components&component=severity-badge"
        >
          <div
            className="marketing-specimen-art marketing-specimen-signal"
            inert
            aria-hidden="true"
          >
            <div className="marketing-specimen-inner">
              <div className="marketing-specimen-metric">
                <span>Signals in the last hour</span>
                <div>
                  <strong>1,284</strong>
                  <Sparkline
                    data={[4, 6, 5, 8, 7, 12, 9, 18, 14, 17, 15, 23]}
                    width={140}
                    height={44}
                  />
                </div>
              </div>
              <div className="marketing-specimen-badges">
                <SeverityBadge severity="critical" />
                <SeverityBadge severity="high" />
                <SeverityBadge severity="medium" />
              </div>
              <div className="marketing-specimen-status">
                <StatusBadge status="new" />
                <StatusBadge status="in-progress" />
                <StatusBadge status="resolved" />
              </div>
            </div>
          </div>
          <div className="marketing-specimen-caption">
            <span>Data & signal</span>
            <ArrowUpRight size={18} />
            <p>Grids, metrics, charts, and semantic status.</p>
          </div>
        </a>
        <a
          className="marketing-specimen"
          data-tone="purple"
          href="?view=components&component=diff-view"
        >
          <div className="marketing-specimen-art marketing-specimen-code" aria-hidden="true">
            <div className="marketing-specimen-inner">
              <div className="marketing-specimen-code-tab">
                <span>rule.yaml</span>
                <span>2 changes</span>
              </div>
              <div className="marketing-specimen-code-lines">
                <p>
                  <i>14</i>
                  <span>selection:</span>
                </p>
                <p>
                  <i>15</i>
                  <span> event.category: process</span>
                </p>
                <p className="marketing-line-remove">
                  <i>−</i>
                  <span> threshold: 50</span>
                </p>
                <p className="marketing-line-add">
                  <i>+</i>
                  <span> threshold: 25</span>
                </p>
                <p>
                  <i>18</i>
                  <span>condition: selection</span>
                </p>
              </div>
            </div>
          </div>
          <div className="marketing-specimen-caption">
            <span>Code & context</span>
            <ArrowUpRight size={18} />
            <p>Editors, diffs, structured data, and evidence.</p>
          </div>
        </a>
      </div>
      <div className="marketing-collection-tail">
        <p>Real React components. Light and dark. Ready to inspect.</p>
        <a href={marketingLinks.components}>
          Open the library <ArrowRight size={16} />
        </a>
      </div>
    </section>
  );
}

export function MarketingSite() {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  useEffect(() => {
    applyTheme('dark', { persist: false });
    document.title = 'Aegis — A design system for technical work';
  }, []);
  async function copySource() {
    try {
      await navigator.clipboard.writeText(clone);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
      setCopied(false);
    }
  }
  return (
    <div className="aegis-marketing marketing-home" id="top">
      <MarketingHeader active="home" />
      <main id="main">
        <section className="marketing-hero marketing-container" aria-labelledby="hero-title">
          <div className="marketing-hero-label">
            <span>
              <i /> Aegis Design System
            </span>
            <span>Open source</span>
          </div>
          <div className="marketing-hero-intro">
            <h1 id="hero-title">
              Clarity for the
              <br />
              <span>deeply technical.</span>
            </h1>
            <p className="marketing-hero-description">
              A React design system for data-heavy products.{' '}
              <br className="marketing-desktop-break" />
              Give your SIEM, developer platform, or engineering tool a clearer interface.
            </p>
            <div className="marketing-hero-actions">
              <a
                className="marketing-link-button marketing-link-primary"
                href={marketingLinks.components}
              >
                Explore components <ArrowRight size={18} />
              </a>
              <a
                className="marketing-link-button marketing-link-secondary"
                href={marketingLinks.docs}
              >
                Read the docs <ArrowUpRight size={18} />
              </a>
            </div>
            <p className="marketing-hero-meta">
              84 components <span>·</span> Semantic tokens <span>·</span> React + TypeScript
            </p>
          </div>
          <ComponentCanvas />
        </section>
        <div className="marketing-purpose-band">
          <div className="marketing-container">
            <p>
              Made for interfaces
              <br />
              <strong>where the details matter.</strong>
            </p>
            <ul aria-label="Platforms Aegis is designed for">
              <li>SIEM & security</li>
              <li>Developer platforms</li>
              <li>Cloud & infrastructure</li>
              <li>Data & observability</li>
            </ul>
          </div>
        </div>
        <CollectionPreview />
        <TokenStory />
        <section
          className="marketing-workflows marketing-container"
          aria-labelledby="workflows-title"
        >
          <div className="marketing-collection-heading">
            <div>
              <p className="marketing-section-label">BETTER TOGETHER</p>
              <h2 id="workflows-title">
                The parts are good.
                <br />
                The whole is the point.
              </h2>
            </div>
            <p className="marketing-heading-description">
              Move from a signal to its evidence, then review an AI suggestion. This is Aegis in
              use. Try it.
            </p>
          </div>
          <ComponentShowcase />
        </section>
        <section className="marketing-source" aria-labelledby="source-title">
          <div className="marketing-container marketing-source-grid">
            <div>
              <p className="marketing-section-label">YOUR NEXT BUILD</p>
              <h2 id="source-title">
                Take it apart.
                <br />
                Make it your own.
              </h2>
              <p>
                Typed components, shared CSS tokens, and working patterns. Start with the source,
                then connect your own data and workflows.
              </p>
              <a className="marketing-underlined-link" href={marketingLinks.repository}>
                Explore the repository <ArrowUpRight size={17} />
              </a>
            </div>
            <div className="marketing-source-panel">
              <div className="marketing-source-panel-heading">
                <span>Start with the source</span>
                <span>Terminal</span>
              </div>
              <pre>
                <code>
                  <span className="marketing-code-muted">$ </span>
                  {clone}
                  {'\n\n'}
                  <span className="marketing-code-muted">$ </span>cd aegis-ui{'\n'}
                  <span className="marketing-code-muted">$ </span>pnpm install{'\n'}
                  <span className="marketing-code-muted">$ </span>pnpm storybook
                </code>
              </pre>
              <div className="marketing-source-panel-footer">
                <span>MIT licensed source</span>
                <button
                  onClick={() => void copySource()}
                  aria-label={copied ? 'Clone command copied' : 'Copy clone command'}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}{' '}
                  {copied ? 'Copied' : 'Copy command'}
                </button>
              </div>
              <p role="status" className={copyError ? 'marketing-copy-error' : 'sr-only'}>
                {copyError
                  ? 'Select the command above to copy it manually.'
                  : copied
                    ? 'Clone command copied.'
                    : ''}
              </p>
            </div>
          </div>
        </section>
        <section className="marketing-faq marketing-container" aria-labelledby="faq-title">
          <h2 id="faq-title">A few practical details.</h2>
          <div>
            <details>
              <summary>What is included?</summary>
              <p>
                A library of React components, semantic tokens for light and dark themes, and
                working technical-interface patterns. The component catalogue shows the whole
                collection; Storybook documents individual states and APIs.
              </p>
            </details>
            <details>
              <summary>Can I use Aegis in my own product?</summary>
              <p>
                Yes. The Aegis source is MIT licensed. Third-party fonts, icons, and AWS marks keep
                their own licenses. The React package is available as a local archive; it has not
                yet been published to the npm registry.
              </p>
            </details>
            <details>
              <summary>Are these live services?</summary>
              <p>
                The examples use local sample data. AI responses and suggestions are illustrative;
                the demos do not contact a model or modify external services.
              </p>
            </details>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
