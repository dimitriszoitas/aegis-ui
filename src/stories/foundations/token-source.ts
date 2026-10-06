import tokenSource from '../../styles/tokens.css?raw';

export type TokenTheme = 'light' | 'dark';
export type TokenValues = Record<string, string>;

/** Documentation reads the same declarations shipped to components. */
function parseTokens(): Record<TokenTheme, TokenValues> {
  const light: TokenValues = {};
  const dark: TokenValues = {};
  const source = tokenSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\}\s*\}/g, '');
  for (const rule of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = rule[1] ?? '';
    const body = rule[2] ?? '';
    const isDark = /\.dark\b|\[data-theme\s*=\s*["']?dark/.test(selector);
    if (!isDark && !selector.includes(':root')) continue;
    const destination = isDark ? dark : light;
    for (const declaration of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      const name = declaration[1];
      const value = declaration[2];
      if (name && value) destination[name] = value.trim();
    }
  }
  return { light, dark: { ...light, ...dark } };
}

export const tokenValues = parseTokens();
export function tokenNames(prefix: string): string[] {
  return Object.keys(tokenValues.light).filter((name) => name.startsWith(prefix));
}
