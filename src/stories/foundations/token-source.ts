import baseSource from '../../styles/tokens.css?raw';
import fundamentalSource from '../../styles/fundamental-tokens.css?raw';

export type TokenTheme = 'light' | 'dark';
export type TokenValues = Record<string, string>;

function topLevelRules(source: string) {
  const rules: { selector: string; body: string }[] = [];
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '');
  let start = 0;
  let bodyStart = 0;
  let depth = 0;
  let selector = '';
  for (let index = 0; index < text.length; index++) {
    if (text[index] === '{') {
      if (depth === 0) {
        selector = text.slice(start, index).trim();
        bodyStart = index + 1;
      }
      depth++;
    } else if (text[index] === '}') {
      depth--;
      if (depth === 0) {
        rules.push({ selector, body: text.slice(bodyStart, index) });
        start = index + 1;
      }
    }
  }
  return rules;
}

/** Select a light-dark branch without splitting commas inside nested CSS functions. */
function themeValue(value: string, theme: TokenTheme): string {
  const start = value.indexOf('light-dark(');
  if (start === -1) return value.trim();
  const contentStart = start + 'light-dark('.length;
  let depth = 1;
  let comma = -1;
  for (let index = contentStart; index < value.length; index++) {
    if (value[index] === '(') depth++;
    else if (value[index] === ')') depth--;
    else if (value[index] === ',' && depth === 1 && comma === -1) comma = index;
    if (depth === 0 && comma !== -1) {
      const selected =
        theme === 'light' ? value.slice(contentStart, comma) : value.slice(comma + 1, index);
      return themeValue(value.slice(0, start) + selected.trim() + value.slice(index + 1), theme);
    }
  }
  return value.trim();
}

/** Read desktop/default declarations; responsive and reduced-motion rules remain runtime CSS. */
export function parseTokenSources(
  base: string,
  fundamental: string,
): Record<TokenTheme, TokenValues> {
  const light: TokenValues = {};
  const dark: TokenValues = {};
  for (const { selector, body } of topLevelRules(base)) {
    if (selector.startsWith('@')) continue;
    const isDark = /\.dark\b|\[data-theme\s*=\s*["']?dark/.test(selector);
    if (!isDark && !selector.includes(':root')) continue;
    const destination = isDark ? dark : light;
    for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      destination[name] = value.trim();
    }
  }
  const values = { light, dark: { ...light, ...dark } };
  for (const { selector, body } of topLevelRules(fundamental)) {
    if (selector.startsWith('@') || !selector.includes('data-layout-theme')) continue;
    for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      values.light[name] = themeValue(value, 'light');
      values.dark[name] = themeValue(value, 'dark');
    }
  }
  return values;
}

export const tokenValues = parseTokenSources(baseSource, fundamentalSource);
export function tokenNames(prefix: string): string[] {
  return Object.keys(tokenValues.light).filter((name) => name.startsWith(prefix));
}
