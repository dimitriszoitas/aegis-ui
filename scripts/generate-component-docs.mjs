/** Rebuild source-derived documentation. No component behavior or styles are executed. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { storyNameFromExport, toId } from 'storybook/internal/csf';

const root = process.cwd();
const require = createRequire(import.meta.url);
// Vite already supplies the parser used for this project's CSS build.
const postcss = createRequire(require.resolve('vite/package.json'))('postcss');
const output = path.join(root, 'src/stories/component-docs');
const generated = path.join(output, 'generated');
const pages = path.join(output, 'pages');
const relative = (file) => path.relative(root, file).split(path.sep).join('/');
const unique = (values) => [...new Set(values)].sort();
function walkFiles(directory, predicate) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(file, predicate) : predicate(file) ? [file] : [];
  });
}
const configPath = ts.findConfigFile(root, ts.sys.fileExists, 'tsconfig.json');
const config = ts.readConfigFile(configPath, ts.sys.readFile);
const parsedConfig = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
const checker = program.getTypeChecker();
const formatFlags =
  ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;
function unwrap(node) {
  while (
    node &&
    (ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isParenthesizedExpression(node) ||
      ts.isExpressionWithTypeArguments(node))
  )
    node = node.expression;
  return node;
}
function symbolOf(node) {
  node = unwrap(node);
  let symbol = node && checker.getSymbolAtLocation(node);
  if (symbol && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
  return symbol;
}
function resolveValue(node) {
  node = unwrap(node);
  if (node && ts.isIdentifier(node)) {
    const declaration = symbolOf(node)?.valueDeclaration;
    if (declaration && ts.isVariableDeclaration(declaration) && declaration.initializer)
      return resolveValue(declaration.initializer);
  }
  return node;
}
function property(object, name) {
  object = resolveValue(object);
  if (!object || !ts.isObjectLiteralExpression(object)) return undefined;
  const prop = object.properties.find(
    (entry) => entry.name && entry.name.getText().replace(/^['"]|['"]$/g, '') === name,
  );
  return (
    prop &&
    (ts.isPropertyAssignment(prop)
      ? prop.initializer
      : ts.isShorthandPropertyAssignment(prop)
        ? prop.name
        : undefined)
  );
}
function literal(node) {
  node = resolveValue(node);
  return node && (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node))
    ? node.text
    : undefined;
}
function exportModifier(node) {
  return node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
}
function staticDefault(node) {
  if (!node) return undefined;
  node = unwrap(node);
  if (ts.isStringLiteralLike(node)) return JSON.stringify(node.text);
  if (
    ts.isNumericLiteral(node) ||
    [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword].includes(
      node.kind,
    )
  )
    return node.getText();
  if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) return node.getText();
  if (
    ts.isArrayLiteralExpression(node) &&
    node.elements.every((item) => staticDefault(item) !== undefined)
  )
    return node.getText();
  if (
    ts.isObjectLiteralExpression(node) &&
    node.properties.every(
      (item) => ts.isPropertyAssignment(item) && staticDefault(item.initializer) !== undefined,
    )
  )
    return node.getText();
  // Dynamic expressions and imported values are deliberately not advertised as defaults.
  return undefined;
}
function defaultsIn(declaration) {
  const defaults = new Map();
  function visit(node) {
    if (
      ts.isFunctionLike(node) &&
      node.parameters?.[0] &&
      ts.isObjectBindingPattern(node.parameters[0].name)
    ) {
      for (const binding of node.parameters[0].name.elements) {
        const value = staticDefault(binding.initializer);
        if (value !== undefined)
          defaults.set(binding.propertyName?.getText() ?? binding.name.getText(), value);
      }
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(declaration);
  return defaults;
}
const propLiteralValues = new Map();
function propsFor(expression) {
  const symbol = symbolOf(expression);
  const declaration = symbol?.valueDeclaration;
  if (!symbol || !declaration) return [];
  const component = symbol.getName();
  const componentType = checker.getTypeOfSymbolAtLocation(symbol, declaration);
  const signatures = checker.getSignaturesOfType(componentType, ts.SignatureKind.Call);
  const defaults = defaultsIn(declaration);
  const properties = new Map();
  for (const signature of signatures) {
    const parameter = signature.parameters[0];
    if (!parameter) continue;
    const propsType = checker.getTypeOfSymbolAtLocation(
      parameter,
      parameter.valueDeclaration ?? declaration,
    );
    const alternatives = propsType.isUnion() ? propsType.types : [propsType];
    for (const alternative of alternatives) {
      for (const prop of checker.getPropertiesOfType(alternative)) {
        const node = prop.valueDeclaration ?? prop.declarations?.[0] ?? declaration;
        const type = checker.getTypeOfSymbolAtLocation(prop, node);
        const literals = (type.isUnion() ? type.types : [type])
          .filter((value) => value.isStringLiteral())
          .map((value) => value.value);
        if (literals.length)
          propLiteralValues.set(`${component}:${prop.getName()}`, unique(literals));
        const entry = {
          component,
          name: prop.getName(),
          type: checker.typeToString(type, node, formatFlags),
          required:
            !(prop.flags & ts.SymbolFlags.Optional) &&
            alternatives.every((item) => checker.getPropertyOfType(item, prop.getName())),
          ...(defaults.has(prop.getName()) ? { defaultValue: defaults.get(prop.getName()) } : {}),
          description: ts.displayPartsToString(prop.getDocumentationComment(checker)),
          inherited: node.getSourceFile().fileName !== declaration.getSourceFile().fileName,
        };
        const existing = properties.get(entry.name);
        if (existing && existing.type !== entry.type)
          entry.type = unique([existing.type, entry.type]).join(' | ');
        properties.set(entry.name, entry);
      }
    }
  }
  return [...properties.values()].sort(
    (a, b) => Number(a.inherited) - Number(b.inherited) || a.name.localeCompare(b.name),
  );
}
function resolveModule(specifier, from) {
  if (specifier.endsWith('.css')) {
    const target = specifier.startsWith('@/')
      ? path.join(root, 'src', specifier.slice(2))
      : path.resolve(path.dirname(from), specifier);
    return fs.existsSync(target) ? target : undefined;
  }
  return ts.resolveModuleName(specifier, from, parsedConfig.options, ts.sys).resolvedModule
    ?.resolvedFileName;
}
function sourceClosure(initial) {
  const files = new Set();
  function add(file) {
    if (
      !file ||
      files.has(file) ||
      !file.startsWith(path.join(root, 'src')) ||
      /\.stories\.|\.test\.|\/assets\//.test(file)
    )
      return;
    files.add(file);
    if (file.endsWith('.css')) return;
    const source = program.getSourceFile(file);
    if (!source) return;
    for (const statement of source.statements) {
      if (
        (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) &&
        statement.moduleSpecifier &&
        ts.isStringLiteral(statement.moduleSpecifier)
      ) {
        if (ts.isImportDeclaration(statement) && statement.importClause?.isTypeOnly) continue;
        add(resolveModule(statement.moduleSpecifier.text, file));
      }
    }
  }
  initial.forEach(add);
  return [...files].sort();
}
const cssCache = new Map();
const tokensIn = (value) =>
  unique([...value.matchAll(/var\(\s*(--[\w-]+)(?=\s*[,)])/g)].map((match) => match[1]));
function cssRows(file) {
  if (cssCache.has(file)) return cssCache.get(file);
  const rows = [];
  const stylesheet = postcss.parse(fs.readFileSync(file, 'utf8'), { from: file });
  stylesheet.walkDecls((declaration) => {
    const conditions = [],
      selectors = [];
    for (
      let parent = declaration.parent;
      parent && parent.type !== 'root';
      parent = parent.parent
    ) {
      if (parent.type === 'atrule') conditions.unshift(`@${parent.name} ${parent.params}`.trim());
      if (parent.type === 'rule') selectors.unshift(parent.selector);
    }
    let selector = selectors.shift() ?? ':root';
    for (const nested of selectors)
      selector = nested.includes('&') ? nested.replaceAll('&', selector) : `${selector} ${nested}`;
    rows.push({
      file: relative(file),
      selector,
      conditions,
      property: declaration.prop,
      value: declaration.value,
      tokens: tokensIn(declaration.value),
    });
  });
  cssCache.set(file, rows);
  return rows;
}
const globalStyles = [
  ...walkFiles(path.join(root, 'src/styles'), (file) => file.endsWith('.css')),
  path.join(root, 'src/package/styles.css'),
];
function extractSource(files) {
  const classes = new Set(),
    roles = new Set(),
    ariaAttributes = new Set(),
    nativeElements = new Set(),
    keyboardKeys = new Set(),
    dependencies = new Set(),
    relatedComponents = new Set();
  const runtime = [];
  for (const file of files.filter((item) => /\.[jt]sx?$/.test(item))) {
    const source = program.getSourceFile(file);
    if (!source) continue;
    const text = source.getFullText();
    for (const match of text.matchAll(/['"`](aegis-[\w-]+(?: [\w-]+)*)['"`]/g))
      match[1].split(/\s+/).forEach((name) => classes.add(name));
    function visit(node) {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const element = node.tagName.getText();
        if (/^[a-z][a-z\d-]*$/.test(element)) nativeElements.add(element);
        for (const attr of node.attributes.properties) {
          if (!ts.isJsxAttribute(attr)) continue;
          const name = attr.name.getText();
          if (name.startsWith('aria-')) ariaAttributes.add(name);
          if (name === 'role' && attr.initializer && ts.isStringLiteral(attr.initializer))
            roles.add(attr.initializer.text);
          if (name === 'className' && attr.initializer) {
            function classValues(value) {
              if (ts.isStringLiteralLike(value) && /^[a-zA-Z_][\w-]*(?: [\w-]+)*$/.test(value.text))
                value.text.split(/\s+/).forEach((name) => classes.add(name));
              ts.forEachChild(value, classValues);
            }
            classValues(attr.initializer);
          }
        }
      }
      const isEventKey = (value) =>
        value &&
        ((ts.isPropertyAccessExpression(value) && value.name.text === 'key') ||
          (ts.isElementAccessExpression(value) && literal(value.argumentExpression) === 'key'));
      if (
        ts.isStringLiteralLike(node) &&
        /^(Arrow(Up|Down|Left|Right)|Enter|Escape|Tab|Home|End|PageUp|PageDown|Backspace|Delete|Space| )$/.test(
          node.text,
        )
      ) {
        const parent = node.parent;
        const comparison =
          ts.isBinaryExpression(parent) && (isEventKey(parent.left) || isEventKey(parent.right));
        const switchCase =
          ts.isCaseClause(parent) &&
          ts.isSwitchStatement(parent.parent.parent) &&
          isEventKey(parent.parent.parent.expression);
        const arrayCheck =
          ts.isArrayLiteralExpression(parent) &&
          ts.isPropertyAccessExpression(parent.parent) &&
          parent.parent.name.text === 'includes' &&
          ts.isCallExpression(parent.parent.parent) &&
          parent.parent.parent.arguments.some(isEventKey);
        if (comparison || switchCase || arrayCheck)
          keyboardKeys.add(node.text === ' ' ? 'Space' : node.text);
      }
      if (
        (ts.isStringLiteralLike(node) || ts.isTemplateExpression(node)) &&
        node.getText().includes('var(--')
      ) {
        const value = ts.isStringLiteralLike(node) ? node.text : node.getText();
        runtime.push({
          file: relative(file),
          selector: `[${relative(file)}]`,
          conditions: [],
          property: 'runtime style',
          value,
          tokens: tokensIn(value),
        });
      }
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const specifier = node.moduleSpecifier.text;
        if (!specifier.startsWith('.') && !specifier.startsWith('@/')) dependencies.add(specifier);
        if (specifier.startsWith('@/components/') || specifier.startsWith('@/patterns/'))
          relatedComponents.add(specifier.split('/').slice(0, 3).join('/'));
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  return {
    cssClasses: [...classes].filter(Boolean).sort(),
    runtime,
    relatedComponents: [...relatedComponents].sort(),
    accessibility: {
      roles: [...roles].sort(),
      ariaAttributes: [...ariaAttributes].sort(),
      nativeElements: [...nativeElements].sort(),
      keyboardKeys: [...keyboardKeys].sort(),
      dependencies: [...dependencies].sort(),
    },
  };
}
const catalogueFile = path.join(root, 'src/marketing/component-catalogue.ts');
const catalogueCode = ts.transpileModule(fs.readFileSync(catalogueFile, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { componentCatalogue } = await import(
  `data:text/javascript;base64,${Buffer.from(catalogueCode).toString('base64')}`
);
const entries = [];
const storyFiles = walkFiles(path.join(root, 'src'), (file) => /\.stories\.tsx?$/.test(file));
for (const file of storyFiles) {
  const source = program.getSourceFile(file);
  if (!source) continue;
  const exported = source.statements.find(ts.isExportAssignment);
  const meta = resolveValue(exported?.expression);
  const title = literal(property(meta, 'title'));
  if (!title || (!/^(Components|Patterns)\//.test(title) && title !== 'Foundations/Icons'))
    continue;
  const id = toId(title),
    name = title.split('/').at(-1);
  const main = property(meta, 'component');
  const components = main ? [main] : [];
  if (title === 'Foundations/Icons') {
    const iconSource = program.getSourceFile(path.join(root, 'src/components/icon/index.tsx'));
    const searchExport = checker
      .getExportsOfModule(checker.getSymbolAtLocation(iconSource))
      .find((symbol) => symbol.getName() === 'Search');
    if (searchExport?.valueDeclaration?.name)
      components.splice(0, components.length, searchExport.valueDeclaration.name);
  }
  const subcomponents = resolveValue(property(meta, 'subcomponents'));
  if (subcomponents && ts.isObjectLiteralExpression(subcomponents))
    for (const entry of subcomponents.properties) {
      if (ts.isShorthandPropertyAssignment(entry)) components.push(entry.name);
      else if (ts.isPropertyAssignment(entry)) components.push(entry.initializer);
    }
  const componentNames = components
    .map((expression) => symbolOf(expression)?.getName())
    .filter(Boolean);
  const initialFiles = unique(
    components.flatMap(
      (expression) =>
        symbolOf(expression)?.declarations?.map(
          (declaration) => declaration.getSourceFile().fileName,
        ) ?? [],
    ),
  );
  if (title === 'Foundations/Icons')
    initialFiles.push(path.join(root, 'src/components/icon/index.tsx'));
  const files = sourceClosure(initialFiles);

  const extracted = extractSource(files);
  const own = extractSource(initialFiles);
  const storyMetadata = [];
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement) || !exportModifier(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      const exportName = declaration.name.getText();
      if (!declaration.initializer || exportName.startsWith('_')) continue;
      const story = resolveValue(declaration.initializer);
      if (!story || !ts.isObjectLiteralExpression(story)) continue;
      storyMetadata.push({
        id: toId(title, storyNameFromExport(exportName)),
        name: literal(property(story, 'name')) ?? storyNameFromExport(exportName),
        exportName,
        sourceFile: relative(file),
      });
    }
  }
  const curated =
    componentCatalogue.find((entry) => entry.docsUrl.includes(`${id}--docs`)) ??
    componentCatalogue.find((entry) => componentNames.includes(entry.name));
  const descriptionNode = property(property(property(meta, 'parameters'), 'docs'), 'description');
  const description =
    literal(property(descriptionNode, 'component')) ??
    curated?.description ??
    ts.displayPartsToString(symbolOf(main)?.getDocumentationComment(checker) ?? []) ??
    '';
  const css = files.filter((item) => item.endsWith('.css')).flatMap(cssRows);
  const classPattern = own.cssClasses.length
    ? new RegExp(
        `\\.(?:${own.cssClasses.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\w-])`,
      )
    : undefined;
  const ownTokens = new Set([...css, ...extracted.runtime].flatMap((row) => row.tokens));
  // Only rules tied to this family's classes, plus definitions of referenced tokens.
  const globalRows = globalStyles
    .flatMap(cssRows)
    .filter(
      (row) =>
        classPattern?.test(row.selector) ||
        /\[class(?:\^|\*)=['"] ?aegis-/.test(row.selector) ||
        ((['html', 'body', '*'].includes(row.selector) ||
          row.selector ===
            ":is([data-layout-theme='fundamental'], [data-layout-theme='fundamental-floating'])") &&
          ['font-family', 'font-size', 'line-height', 'box-sizing', 'color'].includes(
            row.property,
          )) ||
        (row.property.startsWith('--') && ownTokens.has(row.property)),
    );
  const dedup = new Map(
    [...css, ...globalRows, ...extracted.runtime].map((row) => [JSON.stringify(row), row]),
  );
  const props = components.flatMap(propsFor);
  const variants =
    curated?.variants?.map((variant) => {
      const actualDefault = props.find((prop) => prop.name === variant.name)?.defaultValue;
      return {
        name: variant.name,
        values: variant.values,
        ...(actualDefault !== undefined ? { default: actualDefault.replace(/^"|"$/g, '') } : {}),
      };
    }) ?? [];
  for (const prop of props.filter((prop) => !prop.inherited)) {
    const values = propLiteralValues.get(`${prop.component}:${prop.name}`) ?? [];
    if (
      values.length >= 2 &&
      values.length <= 24 &&
      !variants.some((variant) => variant.name === prop.name)
    )
      variants.push({
        name: prop.name,
        values: unique(values),
        ...(prop.defaultValue ? { default: prop.defaultValue.replace(/^"|"$/g, '') } : {}),
      });
  }
  const imports = components.map((expression) => {
    const componentName = symbolOf(expression)?.getName() ?? expression.getText();
    const sourceFile = symbolOf(expression)?.valueDeclaration?.getSourceFile().fileName;
    const segment = sourceFile?.match(/src\/(?:components|patterns)\/([^/]+)/)?.[1];
    return {
      name: componentName,
      path: sourceFile?.includes('/src/patterns/')
        ? '@dimitriszoitas/aegis-ui/patterns'
        : (curated?.importPath ??
          (segment
            ? `@dimitriszoitas/aegis-ui/${segment === 'icon' ? 'icons' : segment}`
            : relative(sourceFile ?? file))),
    };
  });
  entries.push({
    id,
    name,
    title,
    category: title.split('/').slice(0, -1).join('/'),
    description,
    purpose: curated?.purpose ?? description,
    usage: curated?.usage ?? '',
    anatomy: curated?.anatomy ?? own.cssClasses,
    sourceFiles: unique([...files, file].map(relative).concat(globalRows.map((row) => row.file))),
    exportNames: componentNames,
    imports,
    stories: storyMetadata,
    props,
    css: [...dedup.values()],
    variants,
    cssClasses: own.cssClasses,
    relatedComponents: extracted.relatedComponents,
    accessibility: { ...own.accessibility, dependencies: extracted.accessibility.dependencies },
  });
  // Keep compiler/source provenance in sourceFiles; no runtime inspection is claimed here.
}
entries.sort((a, b) => a.title.localeCompare(b.title));
if (!entries.length)
  throw new Error('No component families found. Refusing to replace generated docs.');
const outputs = new Map();
const sections = [
  ['tokens', 'Tokens Used'],
  ['overview', 'Component Guidelines/Overview'],
  ['anatomy', 'Component Guidelines/Anatomy'],
  ['types', 'Component Guidelines/Types'],
  ['variants', 'Component Guidelines/Variants'],
  ['intent', 'Component Guidelines/Intent & Emphasis'],
  ['states', 'Component Guidelines/States'],
  ['sizes', 'Component Guidelines/Sizes'],
  ['usage', 'Component Guidelines/Usage & Content'],
  ['accessibility', 'Component Guidelines/Accessibility'],
  ['api', 'Component Guidelines/API & Props'],
  ['context', 'Component Guidelines/Use cases/In Context'],
];
const index = [
  '// Generated by scripts/generate-component-docs.mjs. Do not edit by hand.',
  "import type { ComponentMetadata } from '../types';",
];
for (const metadata of entries) {
  outputs.set(
    path.join(generated, `${metadata.id}.json`),
    JSON.stringify(metadata, null, 2) + '\n',
  );
  const directory = path.join(pages, metadata.id);
  for (const [section, label] of sections)
    outputs.set(
      path.join(directory, `${section}.mdx`),
      `import { Meta } from '@storybook/addon-docs/blocks';\nimport { ComponentDocumentation } from '../../component-documentation';\n\n<Meta title=${JSON.stringify(`${metadata.title}/${label}`)} />\n\n<ComponentDocumentation componentId=${JSON.stringify(metadata.id)} section=${JSON.stringify(section)} />\n`,
    );
}
index.push(
  '\nexport const componentMetadata: Record<string, Pick<ComponentMetadata, "name" | "title">> = {',
);
entries.forEach((entry) =>
  index.push(
    `  ${JSON.stringify(entry.id)}: ${JSON.stringify({ name: entry.name, title: entry.title })},`,
  ),
);
index.push('};', '', 'const loaders: Record<string, () => Promise<ComponentMetadata>> = {');
entries.forEach((entry) =>
  index.push(
    `  ${JSON.stringify(entry.id)}: () => import('./${entry.id}.json').then((module) => module.default),`,
  ),
);
index.push(
  '};',
  '',
  'export function loadComponentMetadata(id: string): Promise<ComponentMetadata> {',
  '  const loader = loaders[id];',
  '  if (!loader) return Promise.reject(new Error(`Unknown component documentation: ${id}`));',
  '  return loader();',
  '}',
  '',
);
outputs.set(path.join(generated, 'index.ts'), index.join('\n'));
function fingerprint(file, text) {
  if (file.endsWith('.json')) return JSON.stringify(JSON.parse(text));
  if (file.endsWith('.mdx')) {
    const title = text.match(/<Meta\s+title="([^"]+)"\s*\/>/)?.[1];
    const componentId = text.match(/componentId="([^"]+)"/)?.[1];
    const section = text.match(/section="([^"]+)"/)?.[1];
    const imports = [...text.matchAll(/import\s+{\s*(\w+)\s*}\s+from\s+['"]([^'"]+)['"];?/g)].map(
      (match) => match.slice(1),
    );
    const remainder = text
      .replace(/import\s+{[^}]+}\s+from\s+['"][^'"]+['"];?/g, '')
      .replace(/<Meta\s+title="[^"]+"\s*\/>/, '')
      .replace(/<ComponentDocumentation\s+componentId="[^"]+"\s+section="[^"]+"\s*\/>/, '')
      .trim();
    return JSON.stringify({ title, componentId, section, imports, remainder });
  }
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, text);
  const tokens = [];
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan())
    tokens.push([token, scanner.getTokenValue() ?? scanner.getTokenText()]);
  return JSON.stringify(tokens);
}
if (process.argv.includes('--check')) {
  const stale = [];
  for (const [file, text] of outputs) {
    if (
      !fs.existsSync(file) ||
      fingerprint(file, fs.readFileSync(file, 'utf8')) !== fingerprint(file, text)
    )
      stale.push(relative(file));
  }
  for (const directory of [generated, pages])
    if (fs.existsSync(directory))
      for (const file of walkFiles(directory, () => true))
        if (!outputs.has(file)) stale.push(`Unexpected: ${relative(file)}`);
  if (stale.length) {
    console.error(
      `Component documentation is stale. Run node scripts/generate-component-docs.mjs.\n${stale.join('\n')}`,
    );
    process.exitCode = 1;
  } else
    console.log(
      'Component documentation matches current props, defaults, source styles, stories, and all 12 pages per family.',
    );
} else {
  for (const directory of [generated, pages]) {
    fs.mkdirSync(directory, { recursive: true });
    for (const file of walkFiles(directory, () => true)) if (!outputs.has(file)) fs.rmSync(file);
  }
  for (const [file, text] of outputs) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (
      !fs.existsSync(file) ||
      fingerprint(file, fs.readFileSync(file, 'utf8')) !== fingerprint(file, text)
    )
      fs.writeFileSync(file, text);
  }
}
console.log(
  `Generated ${entries.length} families, ${entries.length * sections.length} MDX pages, ${entries.reduce((total, entry) => total + entry.props.length, 0)} public props and ${entries.reduce((total, entry) => total + entry.css.length, 0)} CSS declarations.`,
);
