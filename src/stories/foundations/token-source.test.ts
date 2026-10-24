import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseTokenSources } from './token-source';

describe('foundation token specimens', () => {
  it('uses canonical overrides in both colors and preserves shared aliases', () => {
    const values = parseTokenSources(
      ':root { --surface: white; --space: 4px; } .dark { --surface: black; }',
      ":is([data-layout-theme='fundamental'], [data-layout-theme='fundamental-floating']) { --surface: light-dark(white, gray); --nested: var(--space); }",
    );
    expect(values.light).toEqual({
      '--surface': 'white',
      '--space': '4px',
      '--nested': 'var(--space)',
    });
    expect(values.dark).toEqual({
      '--surface': 'gray',
      '--space': '4px',
      '--nested': 'var(--space)',
    });
  });

  it('selects nested color functions correctly without applying conditional rules', () => {
    const values = parseTokenSources(
      ':root { --size: 28px; } @media (max-width: 640px) { :root { --size: 20px; } }',
      "[data-layout-theme='fundamental'] { --fill: light-dark(color-mix(in srgb, red 20%, white), rgb(10, 20, 30)); } @media (max-width: 640px) { [data-layout-theme='fundamental'] { --size: 16px; } }",
    );
    expect(values.light['--fill']).toBe('color-mix(in srgb, red 20%, white)');
    expect(values.dark['--fill']).toBe('rgb(10, 20, 30)');
    expect(values.light['--size']).toBe('28px');
    expect(values.dark['--size']).toBe('28px');
  });

  it('documents the shared Fundamental component geometry rather than the legacy base', () => {
    const tokenValues = parseTokenSources(
      readFileSync(new URL('../../styles/tokens.css', import.meta.url), 'utf8'),
      readFileSync(new URL('../../styles/fundamental-tokens.css', import.meta.url), 'utf8'),
    );
    expect(tokenValues.light['--surface-radius']).toBe('8px');
    expect(tokenValues.dark['--surface-radius']).toBe('8px');
    expect(tokenValues.light['--button-radius-sm']).toBe('5px');
    expect(tokenValues.light['--layout-page-padding']).toBe('var(--space-7)');
    expect(tokenValues.light['--color-bg-canvas']).not.toBe(tokenValues.dark['--color-bg-canvas']);
    expect(tokenValues.light['--color-bg-canvas']).not.toContain('light-dark(');
  });
});
