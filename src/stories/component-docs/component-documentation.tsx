import { useEffect, useRef, useState, type ReactNode } from 'react';
import { loadComponentMetadata } from './generated';
import { authoredGuidance } from './authored-guidance';
import { inspectTokens, tokenModes } from './inspect-tokens';
import type { ComponentMetadata, ComputedBinding, DocumentationSection } from './types';
import './component-documentation.css';

const sections: { id: DocumentationSection; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'anatomy', label: 'Anatomy' },
  { id: 'types', label: 'Types' },
  { id: 'variants', label: 'Variants' },
  { id: 'intent', label: 'Intent & Emphasis' },
  { id: 'states', label: 'States' },
  { id: 'sizes', label: 'Sizes' },
  { id: 'usage', label: 'Usage & Content' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'api', label: 'API & Props' },
  { id: 'context', label: 'Use cases/In Context' },
];
function storyUrl(id: string) {
  return `?path=/story/${id}`;
}
function docsId(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '--docs'
  );
}
function sectionUrl(meta: ComponentMetadata, section: DocumentationSection) {
  return `?path=/docs/${docsId(`${meta.title}/${section === 'tokens' ? 'Tokens Used' : `Component Guidelines/${sections.find((item) => item.id === section)?.label}`}`)}`;
}
function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div
      className="component-docs-table-scroll"
      role="region"
      aria-label={`${headers[0]} reference table`}
      tabIndex={0}
    >
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th scope="col" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Specimen({
  meta,
  onInspect,
  onLoading,
}: {
  meta: ComponentMetadata;
  onInspect?: (document: Document) => void;
  onLoading?: () => void;
}) {
  const [story, setStory] = useState(meta.stories[0]?.id ?? '');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const frame = useRef<HTMLIFrameElement>(null);
  const callback = useRef(onInspect);
  callback.current = onInspect;
  const loadingCallback = useRef(onLoading);
  loadingCallback.current = onLoading;
  const [presentation, setPresentation] = useState(() => ({
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    layout: document.documentElement.getAttribute('data-layout-theme') ?? 'fundamental',
  }));
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const next = {
        theme: root.classList.contains('dark') ? 'dark' : 'light',
        layout: root.getAttribute('data-layout-theme') ?? 'fundamental',
      };
      setPresentation((previous) =>
        previous.theme === next.theme && previous.layout === next.layout ? previous : next,
      );
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class', 'data-layout-theme'] });
    return () => observer.disconnect();
  }, []);
  const source = `iframe.html?id=${story}&viewMode=story&globals=theme:${presentation.theme};layoutTheme:${presentation.layout}`;
  useEffect(() => {
    let active = true;
    setReady(false);
    setError('');
    loadingCallback.current?.();
    let count = 0;
    const timer = setInterval(() => {
      const doc = frame.current?.contentDocument;
      if (!doc) return;
      if (
        new URLSearchParams(doc.defaultView?.location.search).get('id') === story &&
        new URLSearchParams(doc.defaultView?.location.search).get('globals') ===
          `theme:${presentation.theme};layoutTheme:${presentation.layout}` &&
        (doc.querySelector('#storybook-root')?.children.length ||
          doc.querySelector('[role="dialog"], [role="menu"], [role="listbox"]') ||
          (
            doc.defaultView as
              | (Window & {
                  __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } };
                })
              | null
          )?.__STORYBOOK_PREVIEW__?.currentRender?.phase === 'finished')
      ) {
        clearInterval(timer);
        setReady(true);
        setError('');
        void doc.fonts.ready.then(() => {
          if (active) callback.current?.(doc);
        });
      } else if (++count > 80) {
        clearInterval(timer);
        setError(
          'The example is taking longer to load. Open it in the canvas or reload this page.',
        );
      }
    }, 250);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [source, story, presentation.layout, presentation.theme]);
  if (!story) return <p>No standalone specimen is registered for this family.</p>;
  return (
    <section className="component-docs-specimen" aria-label={`${meta.name} live example`}>
      <div className="component-docs-specimen-toolbar">
        <label>
          Example{' '}
          <select
            aria-label="Component example"
            value={story}
            onChange={(event) => {
              setReady(false);
              setStory(event.target.value);
            }}
          >
            {meta.stories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <a href={storyUrl(story)}>Open canvas</a>
        {onInspect && (
          <button
            type="button"
            disabled={!ready}
            onClick={() => {
              const doc = frame.current?.contentDocument;
              if (doc) onInspect(doc);
            }}
          >
            Refresh values
          </button>
        )}
      </div>
      <iframe
        ref={frame}
        title={`${meta.name} example`}
        src={source}
        loading="eager"
        className="component-docs-frame"
      />
      {error && <p role="status">{error}</p>}
    </section>
  );
}
function TokenDocumentation({ meta }: { meta: ComponentMetadata }) {
  const [bindings, setBindings] = useState<ComputedBinding[]>([]),
    [query, setQuery] = useState(''),
    [expanded, setExpanded] = useState(false),
    [mode, setMode] = useState<string>(tokenModes[0]);
  const [message, setMessage] = useState('Loading the live specimen to resolve its properties…');
  const read = (document: Document) => {
    try {
      const result = inspectTokens(document);
      setBindings(result);
      setMessage(
        result.length
          ? `${result.length} matched token bindings measured across four theme and mode combinations.`
          : 'This specimen currently has no visible elements with token-bound declarations. Open its control or choose another example, then refresh.',
      );
    } catch {
      setMessage(
        'Live inspection is unavailable for this specimen. Its complete source declaration inventory is below.',
      );
    }
  };
  const matched = bindings.filter((binding) =>
    `${binding.element} ${binding.property} ${binding.tokens.join(' ')}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const declared = meta.css.filter((row) =>
    `${row.selector} ${row.property} ${row.value} ${row.file}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const tokenNames = [...new Set(meta.css.flatMap((row) => row.tokens))];
  return (
    <>
      <p>
        Inspect every matched token binding in the selected example, including nested components.
        Effective values come from the browser after the CSS cascade. The declaration inventory also
        covers variants and conditions that are not active in the preview.
      </p>
      <Specimen
        meta={meta}
        onInspect={read}
        onLoading={() => {
          setBindings([]);
          setMessage('Loading the live specimen to resolve its properties…');
        }}
      />
      <div className="component-docs-controls">
        <label>
          Find a property or token
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setExpanded(false);
            }}
            placeholder="background, radius, --color…"
          />
        </label>
        <label>
          Resolved values
          <select value={mode} onChange={(event) => setMode(event.target.value)}>
            {tokenModes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="component-docs-note" role="status">
        {message}
      </p>
      <h2>Live resolved properties</h2>
      <p className="component-docs-note">
        Multiple declarations can match one property. The effective value shows the final computed
        result, including overrides. Open a menu or dialog in the preview and refresh to inspect its
        surface. CSS custom properties can retain functions; the corresponding regular property
        shows the resolved color, length, or other value.
      </p>
      <Table headers={['Element / property', 'Token binding', 'Raw effective value']}>
        {(expanded ? matched : matched.slice(0, 80)).map((row) => (
          <tr key={row.id}>
            <th scope="row">
              <code>{row.property}</code>
              <small>{row.element}</small>
              <details>
                <summary>Matching selector</summary>
                <code>{row.selector}</code>
              </details>
            </th>
            <td>
              <code>{row.declaration}</code>
              {row.tokens.map((token) => (
                <small key={token}>
                  <code>{token}</code> ={' '}
                  {row.tokenValues[mode]?.[token] ?? 'Not matched in this mode'}
                </small>
              ))}
            </td>
            <td>
              <code>{row.values[mode] ?? 'Not matched in this mode'}</code>
              <details>
                <summary>Compare modes</summary>
                {tokenModes.map((item) => (
                  <small key={item}>
                    {item}: <code>{row.values[item] ?? 'Not matched'}</code>
                  </small>
                ))}
              </details>
            </td>
          </tr>
        ))}
      </Table>
      {matched.length > 80 && (
        <button className="component-docs-text-action" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show fewer' : `Show all ${matched.length} bindings`}
        </button>
      )}
      <h2>Complete declaration inventory</h2>
      <p>
        {tokenNames.length} token names across {meta.css.length} declarations. Each row retains its
        source file, selector, and conditions. Literal values are shown explicitly so untokenized
        geometry is visible.
      </p>
      <details>
        <summary>Browse all declarations ({declared.length})</summary>
        <Table headers={['Property', 'Declared value / tokens', 'Selector / source']}>
          {declared.map((row, index) => (
            <tr key={index}>
              <th scope="row">
                <code>{row.property}</code>
              </th>
              <td>
                <code>{row.value}</code>
                <small>
                  {row.tokens.length ? row.tokens.join(', ') : 'Literal value; no token binding'}
                </small>
              </td>
              <td>
                <code>{row.selector}</code>
                <small>{row.conditions.join(' · ')}</small>
                <small>{row.file}</small>
              </td>
            </tr>
          ))}
        </Table>
      </details>
    </>
  );
}
const enumProps = (meta: ComponentMetadata) =>
  meta.props.filter((prop) => /"[^"]+"\s*\||'[^']+'\s*\|/.test(prop.type) && !prop.inherited);
function VariantTable({
  meta,
  filter = () => true,
}: {
  meta: ComponentMetadata;
  filter?: (name: string) => boolean;
}) {
  const props = enumProps(meta).filter((prop) => filter(prop.name));
  const variants = meta.variants.filter(
    (variant) => filter(variant.name) && !props.some((prop) => prop.name === variant.name),
  );
  return props.length || variants.length ? (
    <Table headers={['Property', 'Supported values', 'Default']}>
      {props.map((prop) => (
        <tr key={`${prop.component}-${prop.name}`}>
          <th scope="row">
            {prop.name}
            <small>{prop.component}</small>
          </th>
          <td>
            <code>{prop.type}</code>
            {prop.description && <small>{prop.description}</small>}
          </td>
          <td>
            <code>{prop.defaultValue ?? 'Caller supplied / not declared'}</code>
          </td>
        </tr>
      ))}
      {variants.map((variant) => (
        <tr key={variant.name}>
          <th scope="row">{variant.name}</th>
          <td>{variant.values.join(' · ')}</td>
          <td>{variant.default ?? 'Not declared'}</td>
        </tr>
      ))}
    </Table>
  ) : (
    <p>
      This component has no dedicated property in this category. Use its documented content and
      composition API; nested components keep their own variants.
    </p>
  );
}
function Guidelines({ meta, section }: { meta: ComponentMetadata; section: DocumentationSection }) {
  const guidance = authoredGuidance[meta.name] ?? authoredGuidance[meta.title];
  const notes = (items?: string[]) =>
    items?.length ? (
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    ) : null;
  const uniqueProps = [...new Map(meta.props.map((prop) => [prop.name, prop])).values()];
  const sourceStates = [
    ...new Set(
      meta.css
        .map((row) => row.selector)
        .filter((selector) =>
          /:(hover|focus|active|disabled|checked)|\[.*(?:state|disabled|invalid|selected|loading|expanded|checked|open)/.test(
            selector,
          ),
        ),
    ),
  ];
  const facts = meta.accessibility;
  switch (section) {
    case 'overview':
      return (
        <>
          <p className="component-docs-lead">
            {guidance?.overview || meta.purpose || meta.description}
          </p>
          <Specimen meta={meta} />
          <h2>When to use it</h2>
          {notes(guidance?.usage)}
          <p>
            {meta.usage ||
              `Use ${meta.name} when the interaction in the live example matches the task. Keep data and application decisions in the host.`}
          </p>
          <h2>Composition</h2>
          <p>
            {meta.relatedComponents?.length
              ? `This family composes ${meta.relatedComponents.join(', ')}. Their own pages describe their tokens and behavior.`
              : 'This family provides the structure shown in the examples. Use its public properties to configure it.'}
          </p>
          <h2>Explore the family</h2>
          <div className="component-docs-link-grid">
            {sections.slice(1).map((item) => (
              <a key={item.id} href={sectionUrl(meta, item.id)}>
                {item.label}
              </a>
            ))}
            <a href={sectionUrl(meta, 'tokens')}>Tokens Used</a>
          </div>
        </>
      );
    case 'anatomy':
      return (
        <>
          <p>
            The numbered parts describe the component’s content hierarchy. Match each part to the
            live specimen, then inspect its implementation hooks below.
          </p>
          <Specimen meta={meta} />
          <ol className="component-docs-anatomy">
            {(meta.anatomy.length ? meta.anatomy : (meta.exportNames ?? [meta.name])).map(
              (part, index) => (
                <li key={`${part}-${index}`}>
                  <span aria-hidden="true">{index + 1}</span>
                  <div>{part}</div>
                </li>
              ),
            )}
          </ol>
          <h2>Implementation hooks</h2>
          <p>
            These classes come from the family source. They identify structure and state rather than
            public replacement APIs.
          </p>
          <div className="component-docs-code-tags">
            {meta.cssClasses?.map((name) => (
              <code key={name}>{name}</code>
            ))}
          </div>
        </>
      );
    case 'types':
      return (
        <>
          <p>
            Types are the exported pieces of this family. Variants and states are documented
            separately.
          </p>
          <Table headers={['Export', 'Role / source']}>
            {(meta.exportNames ?? [meta.name]).map((name) => (
              <tr key={name}>
                <th scope="row">
                  <code>{name}</code>
                </th>
                <td>
                  {name.endsWith('Props')
                    ? 'Public component properties'
                    : name.endsWith('Context')
                      ? 'Context type'
                      : 'Exported family API'}
                  <small>{meta.sourceFiles.find((file) => !file.endsWith('.css'))}</small>
                </td>
              </tr>
            ))}
          </Table>
          <h2>Related building blocks</h2>
          <p>
            {meta.relatedComponents?.join(', ') ||
              'No nested design-system component import is declared in this family.'}
          </p>
        </>
      );
    case 'variants':
      return (
        <>
          <p>
            Configure supported visual and behavioral options with these properties. The list comes
            from the public type definitions and curated component catalogue.
          </p>
          <VariantTable meta={meta} />
          <Specimen meta={meta} />
        </>
      );
    case 'intent':
      return (
        <>
          <p>
            Intent communicates meaning; emphasis controls visual weight. Use only the options this
            component exposes. Keep destructive actions explicit, and avoid assigning meaning
            through color alone.
          </p>
          <VariantTable
            meta={meta}
            filter={(name) => /intent|emphasis|tone|variant|color/i.test(name)}
          />
          {notes(guidance?.intent)}
          <h2>Composed controls</h2>
          <p>
            {meta.relatedComponents?.length
              ? `When composing ${meta.relatedComponents.join(', ')}, configure each child through its own properties. The parent does not add an undocumented intent or emphasis.`
              : 'If this family has no intent or emphasis property, use its default hierarchy. Do not create extra color meanings by overriding internal classes.'}
          </p>
        </>
      );
    case 'states':
      return (
        <>
          <p>
            State is driven by interaction, controlled properties, and data. The inventory below
            preserves the selectors used by the implementation.
          </p>
          <h2>State properties</h2>
          <Table headers={['Property', 'Type', 'Meaning / default']}>
            {uniqueProps
              .filter((prop) =>
                /disabled|loading|invalid|open|checked|selected|expanded|error|busy|readOnly|generating/.test(
                  prop.name,
                ),
              )
              .map((prop) => (
                <tr key={prop.name}>
                  <th scope="row">{prop.name}</th>
                  <td>
                    <code>{prop.type}</code>
                  </td>
                  <td>
                    {prop.description ||
                      'Supplied by the host or maintained by the component when uncontrolled.'}
                    <small>
                      {prop.defaultValue === undefined
                        ? 'No explicit default in the component signature'
                        : `Default: ${prop.defaultValue}`}
                    </small>
                  </td>
                </tr>
              ))}
          </Table>
          <h2>Styled states</h2>
          {sourceStates.length ? (
            <ul
              className="component-docs-selector-list"
              tabIndex={0}
              aria-label="Styled state selectors"
            >
              {sourceStates.map((selector) => (
                <li key={selector}>
                  <code>{selector}</code>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              No separate state selector is declared for this family. Nested controls retain their
              own states.
            </p>
          )}
          <Specimen meta={meta} />
        </>
      );
    case 'sizes': {
      const geometry = meta.css.filter((row) =>
        /^(?:min-|max-)?(?:width|height)$|padding|gap|font-size|border-radius/.test(row.property),
      );
      return (
        <>
          <p>
            Choose the documented size or density before changing layout. Use the source geometry
            below together with Tokens Used for current resolved values.
          </p>
          <VariantTable
            meta={meta}
            filter={(name) => /size|density|width|height|orientation|columns|placement/.test(name)}
          />
          <Table headers={['Property', 'Value', 'Condition / selector']}>
            {geometry.map((row, index) => (
              <tr key={index}>
                <th scope="row">
                  <code>{row.property}</code>
                </th>
                <td>
                  <code>{row.value}</code>
                </td>
                <td>
                  <code>{row.selector}</code>
                  <small>{row.conditions.join(' · ')}</small>
                </td>
              </tr>
            ))}
          </Table>
        </>
      );
    }
    case 'usage':
      return (
        <>
          <p className="component-docs-lead">{meta.usage || meta.description}</p>
          {notes(guidance?.usage)}
          <h2>Content contract</h2>
          <Table headers={['Content property', 'Purpose', 'Value shape']}>
            {uniqueProps
              .filter((prop) =>
                /^(children|label|title|description|placeholder|helperText|helpText|emptyMessage|items|data|options|message|name|value|text|tasks)$/.test(
                  prop.name,
                ),
              )
              .map((prop) => (
                <tr key={prop.name}>
                  <th scope="row">{prop.name}</th>
                  <td>
                    {prop.description ||
                      `Provide ${prop.name} appropriate to the user’s current task.`}
                  </td>
                  <td>
                    <code>{prop.type}</code>
                  </td>
                </tr>
              ))}
          </Table>
          <h2>Writing and layout</h2>
          <ul>
            <li>
              Use familiar business terms and concrete labels. Match related labels across the page.
            </li>
            <li>
              Keep essential meaning in visible text. Icons, color, and placeholder text supplement
              the label.
            </li>
            <li>Keep identifiers and complete values available when visual text is truncated.</li>
            <li>
              Show a useful empty or error message when the supplied data cannot produce the normal
              view.
            </li>
          </ul>
          <Specimen meta={meta} />
        </>
      );
    case 'accessibility':
      return (
        <>
          {notes(guidance?.accessibility)}
          <p>
            These facts are extracted from the implementation. Review the live interaction in the
            context where you compose it; host-provided labels and content remain part of the
            accessibility contract.
          </p>
          <Table headers={['Implementation evidence', 'Declared values']}>
            <tr>
              <th scope="row">Native elements</th>
              <td>
                {facts?.nativeElements.join(', ') || 'See composed component implementations.'}
              </td>
            </tr>
            <tr>
              <th scope="row">Explicit roles</th>
              <td>{facts?.roles.join(', ') || 'Uses native semantics or composed primitives.'}</td>
            </tr>
            <tr>
              <th scope="row">ARIA attributes</th>
              <td>
                {facts?.ariaAttributes.join(', ') ||
                  'No direct ARIA attribute found in the family source.'}
              </td>
            </tr>
            <tr>
              <th scope="row">Explicit key handling</th>
              <td>
                {facts?.keyboardKeys.join(', ') ||
                  'No component-owned key handler declared; native or composed controls provide their behavior.'}
              </td>
            </tr>
            <tr>
              <th scope="row">Behavior dependencies</th>
              <td>
                {facts?.dependencies.join(', ') || 'No external interaction primitive imported.'}
              </td>
            </tr>
          </Table>
          <h2>Integration checks</h2>
          <ul>
            <li>Provide a visible or programmatic name for every interactive instance.</li>
            <li>
              Navigate the live example using Tab and Shift+Tab, then test the keys named above.
            </li>
            <li>
              Keep focus visible and restore it after closing or removing the focused surface.
            </li>
            <li>
              Confirm labels, descriptions, and errors describe the actual data supplied by the
              host.
            </li>
            <li>Check both modes, reduced motion, long text, and a narrow viewport.</li>
          </ul>
          <Specimen meta={meta} />
        </>
      );
    case 'api':
      return <ApiTable meta={meta} />;
    case 'context':
      return (
        <>
          {notes(guidance?.context)}
          <p>
            These examples are registered for this family. Use the canvas link to explore the full
            interaction, controls, and theme modes.
          </p>
          <Specimen meta={meta} />
          <Table headers={['Example', 'Open']}>
            {meta.stories.map((story) => (
              <tr key={story.id}>
                <th scope="row">{story.name}</th>
                <td>
                  <a href={storyUrl(story.id)}>Open {story.name}</a>
                </td>
              </tr>
            ))}
          </Table>
          <h2>In the application</h2>
          <p>
            <a href="?path=/story/console-application-demo--demo">Open Application Demo</a> to
            explore the shared visual language in dashboards, data grids, records, profiles, and
            workspace settings.
          </p>
        </>
      );
    default:
      return null;
  }
}
function ApiTable({ meta }: { meta: ComponentMetadata }) {
  const [query, setQuery] = useState(''),
    [inherited, setInherited] = useState(false);
  const props = meta.props.filter(
    (prop) =>
      (inherited || !prop.inherited) &&
      `${prop.component} ${prop.name} ${prop.type}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <p>
        Properties are read from the TypeScript public API. Defaults are included only when declared
        in source; an omitted value is not assumed to be false or empty.
      </p>
      <div className="component-docs-controls">
        <label>
          Find a property
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="size, onChange, disabled…"
          />
        </label>
        <label className="component-docs-checkbox">
          <input
            type="checkbox"
            checked={inherited}
            onChange={(event) => setInherited(event.target.checked)}
          />
          Include inherited platform properties
        </label>
      </div>
      <Table headers={['Component / property', 'Type', 'Required / default', 'Description']}>
        {props.map((prop) => (
          <tr key={`${prop.component}.${prop.name}`}>
            <th scope="row">
              <small>{prop.component}</small>
              <code>{prop.name}</code>
            </th>
            <td>
              <code>{prop.type}</code>
            </td>
            <td>
              {prop.required ? 'Required' : 'Optional'}
              <small>
                {prop.defaultValue === undefined ? 'No explicit default' : prop.defaultValue}
              </small>
            </td>
            <td>
              {prop.description ||
                'See the property type and working examples for the supported value.'}
            </td>
          </tr>
        ))}
      </Table>
      <h2>Source files</h2>
      <ul>
        {meta.sourceFiles.map((file) => (
          <li key={file}>
            <code>{file}</code>
          </li>
        ))}
      </ul>
    </>
  );
}
export function ComponentDocumentation({
  componentId,
  section,
}: {
  componentId: string;
  section: DocumentationSection;
}) {
  const [meta, setMeta] = useState<ComponentMetadata>();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setMeta(undefined);
    setError('');
    loadComponentMetadata(componentId)
      .then((value) => {
        if (active) setMeta(value);
      })
      .catch(() => {
        if (active) setError(`Component documentation is unavailable for ${componentId}.`);
      });
    return () => {
      active = false;
    };
  }, [componentId]);
  if (error) return <p role="alert">{error}</p>;
  if (!meta) return <p role="status">Loading component documentation…</p>;
  const name =
    section === 'tokens' ? 'Tokens Used' : sections.find((item) => item.id === section)?.label;
  return (
    <article className="component-docs">
      <header className="component-docs-heading">
        <p>
          {meta.category} / {meta.name}
        </p>
        <h1>{name}</h1>
        <div className="component-docs-page-links">
          <a href={sectionUrl(meta, 'overview')}>Component Guidelines</a>
          <a href={sectionUrl(meta, 'tokens')}>Tokens Used</a>
        </div>
      </header>
      {section === 'tokens' ? (
        <TokenDocumentation key={componentId} meta={meta} />
      ) : (
        <Guidelines key={`${componentId}-${section}`} meta={meta} section={section} />
      )}
    </article>
  );
}
