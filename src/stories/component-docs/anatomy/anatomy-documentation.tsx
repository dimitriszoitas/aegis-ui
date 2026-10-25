import { useEffect, useId, useRef, useState } from 'react';
import type { ComponentMetadata } from '../types';
import type { AnatomyPart } from './types';
import './anatomy.css';

interface MeasuredPart extends AnatomyPart {
  number: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  bounds: { x: number; y: number; width: number; height: number };
}
interface SpecimenData {
  componentId: string;
  parts: AnatomyPart[];
  height: number;
  note?: string;
}

function measureParts(
  doc: Document,
  parts: AnatomyPart[],
  width: number,
  height: number,
  scale: number,
) {
  const measured: MeasuredPart[] = [];
  for (const [index, part] of parts.entries()) {
    const element = Array.from(doc.querySelectorAll(part.selector)).find((node) => {
      const rect = node.getBoundingClientRect();
      const style = doc.defaultView?.getComputedStyle(node);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style?.visibility !== 'hidden' &&
        style?.display !== 'none'
      );
    });
    if (!element) continue;
    const rect = element.getBoundingClientRect();
    const bounds = {
      x: rect.left * scale,
      y: rect.top * scale,
      width: rect.width * scale,
      height: rect.height * scale,
    };
    const anchor = part.anchor ?? 'top';
    let targetX = bounds.x + bounds.width / 2;
    let targetY = bounds.y + bounds.height / 2;
    if (anchor.includes('left')) targetX = bounds.x;
    if (anchor.includes('right')) targetX = bounds.x + bounds.width;
    if (anchor.includes('top')) targetY = bounds.y;
    if (anchor.includes('bottom')) targetY = bounds.y + bounds.height;
    let x = targetX + (anchor.includes('left') ? -24 : anchor.includes('right') ? 24 : 0);
    let y =
      targetY +
      (anchor.includes('bottom') ? 26 : anchor === 'left' || anchor === 'right' ? 0 : -26);
    const clampX = (value: number) => Math.max(18, Math.min(width - 18, value));
    const clampY = (value: number) => Math.max(18, Math.min(height - 18, value));
    x = clampX(x);
    y = clampY(y);
    // Keep small, adjacent slots legible without covering a neighboring badge.
    const baseX = x,
      baseY = y;
    for (
      let attempt = 0;
      measured.some((other) => Math.hypot(other.x - x, other.y - y) < 35) && attempt < 40;
      attempt++
    ) {
      const ring = Math.floor(attempt / 8) + 1;
      const angle = ((attempt % 8) * Math.PI) / 4;
      x = clampX(baseX + Math.cos(angle) * ring * 36);
      y = clampY(baseY + Math.sin(angle) * ring * 36);
    }
    measured.push({ ...part, number: index + 1, x, y, targetX, targetY, bounds });
  }
  return measured;
}

export function AnatomyDocumentation({ meta }: { meta: ComponentMetadata }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const tooltipId = useId();
  const [width, setWidth] = useState(900);
  const [height, setHeight] = useState(320);
  const [parts, setParts] = useState<MeasuredPart[]>([]);
  const [definition, setDefinition] = useState<SpecimenData>();
  const [active, setActive] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [presentation, setPresentation] = useState(() => ({
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    layout: document.documentElement.getAttribute('data-layout-theme') ?? 'fundamental',
  }));
  const viewportWidth = Math.max(720, width);
  const scale = width / viewportWidth;
  const source = `iframe.html?id=documentation-anatomy-specimen--specimen&viewMode=story&args=componentId:${meta.id}&globals=theme:${presentation.theme};layoutTheme:${presentation.layout}`;
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    if (stage.current) observer.observe(stage.current);
    const themeObserver = new MutationObserver(() => {
      const next = {
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
        layout: document.documentElement.getAttribute('data-layout-theme') ?? 'fundamental',
      };
      setPresentation((previous) =>
        previous.theme === next.theme && previous.layout === next.layout ? previous : next,
      );
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-layout-theme'],
    });
    return () => {
      observer.disconnect();
      themeObserver.disconnect();
    };
  }, []);
  useEffect(() => {
    setParts([]);
    setDefinition(undefined);
    setActive(null);
    setPinned(null);
    setError('');
    setHeight(320);
  }, [source]);
  useEffect(() => {
    let attempts = 0;
    const inspect = () => {
      const doc = frame.current?.contentDocument;
      const node = doc?.querySelector<HTMLElement>('[data-anatomy-definition]');
      if (!doc || !node?.dataset.anatomyDefinition) {
        if (++attempts === 100)
          setError('The component example could not load. Reload this page to try again.');
        return;
      }
      const next: SpecimenData = JSON.parse(node.dataset.anatomyDefinition);
      if (next.componentId !== meta.id) return;
      const nextHeight = Math.max(next.height, Math.ceil(node.getBoundingClientRect().height));
      setHeight(nextHeight);
      setDefinition((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
      const nextParts = measureParts(doc, next.parts, width, nextHeight * scale, scale);
      setParts((previous) =>
        JSON.stringify(previous) === JSON.stringify(nextParts) ? previous : nextParts,
      );
      setError('');
    };
    // Portals, fonts, and asynchronous content can settle after the story renders.
    // Re-measure quietly so badges also follow responsive layout and scrolling.
    const timer = window.setInterval(inspect, 300);
    inspect();
    return () => window.clearInterval(timer);
  }, [source, meta.id, width, scale]);
  const selected = parts.find((part) => part.number === (active ?? pinned));
  const showPart = (number: number) => {
    clearTimeout(hoverTimer.current);
    setActive(number);
  };
  const hidePart = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      const focused = stage.current?.querySelector<HTMLElement>('.anatomy-marker:focus');
      setActive(focused ? Number(focused.dataset.part) : null);
    }, 150);
  };
  useEffect(() => () => clearTimeout(hoverTimer.current), []);
  const dismiss = (key: string) => {
    if (key === 'Escape') {
      clearTimeout(hoverTimer.current);
      setActive(null);
      setPinned(null);
    }
  };
  return (
    <div className="anatomy-documentation" onKeyDown={(event) => dismiss(event.key)}>
      <p>
        Hover or focus a numbered badge to identify a part. Match its number to the description
        below.
      </p>
      <div
        ref={stage}
        className="anatomy-stage"
        style={{ height: height * scale }}
        aria-label={`${meta.name} annotated anatomy`}
      >
        <iframe
          ref={frame}
          title={`${meta.name} anatomy specimen`}
          src={source}
          tabIndex={-1}
          aria-hidden="true"
          inert
          style={{ width: viewportWidth, height, transform: `scale(${scale})` }}
        />
        <svg
          className="anatomy-connectors"
          aria-hidden="true"
          width={width}
          height={height * scale}
        >
          {selected && (
            <rect
              className="anatomy-highlight"
              x={selected.bounds.x - 3}
              y={selected.bounds.y - 3}
              width={selected.bounds.width + 6}
              height={selected.bounds.height + 6}
              rx="5"
            />
          )}
          {parts.map((part) => (
            <line
              key={part.number}
              x1={part.x}
              y1={part.y}
              x2={part.targetX}
              y2={part.targetY}
              className={selected?.number === part.number ? 'is-active' : undefined}
            />
          ))}
        </svg>
        {parts.map((part) => (
          <button
            key={part.number}
            type="button"
            className="anatomy-marker"
            data-part={part.number}
            data-active={selected?.number === part.number || undefined}
            style={{ left: part.x, top: part.y }}
            aria-label={`${part.number}. ${part.name}`}
            aria-describedby={selected?.number === part.number ? tooltipId : undefined}
            aria-pressed={pinned === part.number}
            onMouseEnter={() => showPart(part.number)}
            onMouseLeave={hidePart}
            onFocus={() => showPart(part.number)}
            onBlur={hidePart}
            onClick={() => {
              setPinned(pinned === part.number ? null : part.number);
              setActive(null);
            }}
          >
            {part.number}
          </button>
        ))}
        {selected && (
          <div
            role="tooltip"
            id={tooltipId}
            className="anatomy-tooltip"
            onMouseEnter={() => showPart(selected.number)}
            onMouseLeave={hidePart}
            style={{
              left: Math.max(12, Math.min(width - Math.min(280, width - 24) - 12, selected.x - 30)),
              top: selected.y + 22,
            }}
          >
            <strong>
              {selected.number}. {selected.name}
            </strong>
            <span>{selected.description}</span>
          </div>
        )}
        {!definition && (
          <div className="anatomy-loading" role="status">
            {error || 'Loading component anatomy…'}
          </div>
        )}
      </div>
      {definition?.note && <p className="anatomy-note">{definition.note}</p>}
      <ol className="anatomy-legend" aria-label={`${meta.name} parts`}>
        {definition?.parts.map((part, index) => (
          <li key={part.name} data-active={selected?.number === index + 1 || undefined}>
            <span className="anatomy-legend-number" aria-hidden="true">
              {index + 1}
            </span>
            <div>
              <strong>{part.name}</strong>
              <p>{part.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
