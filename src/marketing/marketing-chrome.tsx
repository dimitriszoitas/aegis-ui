import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Rows3, Shield, X } from '@/components/icon';
import './marketing-site.css';

export const marketingLinks = {
  components: '?view=components',
  console: '?view=console',
  docs: 'https://dimitriszoitas.github.io/aegis-ui/',
  repository: 'https://github.com/dimitriszoitas/aegis-ui',
};

export function MarketingHeader({ active = 'home' }: { active?: 'home' | 'components' }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    }
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [open]);
  return (
    <>
      <a className="marketing-skip" href="#main">
        Skip to content
      </a>
      <header className="marketing-header">
        <div className="marketing-container marketing-nav">
          <a className="marketing-brand" href="?view=home" aria-label="Aegis home">
            <span className="marketing-brand-mark">
              <Shield size={23} strokeWidth={1.6} />
            </span>
            Aegis<span className="marketing-brand-detail">Design system</span>
          </a>
          <nav
            id="marketing-navigation"
            className="marketing-nav-links"
            data-open={open}
            aria-label="Main navigation"
          >
            <a
              href={marketingLinks.components}
              aria-current={active === 'components' ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              Components
            </a>
            <a
              href={active === 'home' ? '#foundations' : '?view=home#foundations'}
              onClick={() => setOpen(false)}
            >
              Tokens
            </a>
            <a href={marketingLinks.console}>
              Live console <ArrowUpRight size={12} />
            </a>
          </nav>
          <a className="marketing-nav-cta" href={marketingLinks.docs}>
            Documentation <ArrowUpRight size={14} />
          </a>
          <button
            ref={toggle}
            className="marketing-menu-toggle"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open}
            aria-controls="marketing-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={21} /> : <Rows3 size={21} />}
          </button>
        </div>
      </header>
    </>
  );
}

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="marketing-container">
        <div className="marketing-footer-top">
          <a className="marketing-brand" href="?view=home" aria-label="Aegis home">
            <Shield size={24} strokeWidth={1.5} />
            Aegis
          </a>
          <p>A design system for technical work.</p>
          <nav aria-label="Footer navigation">
            <a href={marketingLinks.components}>Components</a>
            <a href={marketingLinks.docs}>
              Documentation <ArrowUpRight size={13} />
            </a>
            <a href={marketingLinks.repository}>
              GitHub <ArrowUpRight size={13} />
            </a>
          </nav>
        </div>
        <div className="marketing-footer-bottom">
          <span>© {new Date().getFullYear()} Aegis</span>
          <span>React / TypeScript / MIT source</span>
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
