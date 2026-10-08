import { useLayoutEffect, useRef } from 'react';
import { Avatar, AvatarGroup } from '@/components/avatar';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Checkbox } from '@/components/checkbox';
import { ConfidenceBadge } from '@/components/confidence-badge';
import {
  Activity,
  ArrowUpRight,
  Bell,
  ChevronDown,
  ChevronRight,
  FileCode,
  Layers,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  Sparkles,
} from '@/components/icon';
import { JsonViewer } from '@/components/json-viewer';
import { ProgressBar } from '@/components/progress-bar';
import { SeverityBadge, type Severity } from '@/components/severity-badge';
import { Sparkline } from '@/components/sparkline';
import { StatusBadge, type AlertStatus } from '@/components/status-badge';
import { Switch } from '@/components/switch';
import { Tag } from '@/components/tag';
import './component-canvas.css';

const trend = [18, 26, 22, 37, 29, 45, 39, 53, 47, 65, 54, 61, 75, 68, 84, 78];
const rows: {
  title: string;
  host: string;
  severity: Severity;
  status: AlertStatus;
  time: string;
}[] = [
  {
    title: 'Privilege escalation',
    host: 'prod-api-03',
    severity: 'critical',
    status: 'new',
    time: '2m ago',
  },
  {
    title: 'Unusual sign-in location',
    host: 'identity-eu',
    severity: 'high',
    status: 'triaged',
    time: '4m ago',
  },
  {
    title: 'New service account',
    host: 'worker-12',
    severity: 'medium',
    status: 'in-progress',
    time: '8m ago',
  },
  {
    title: 'Outbound traffic anomaly',
    host: 'gateway-04',
    severity: 'low',
    status: 'resolved',
    time: '12m ago',
  },
];
const samplePayload = {
  source: 'identity',
  actor: 'svc-deploy',
  action: 'role_updated',
  allowed: false,
};

/** Decorative, locally themed React composition. Motion follows the visitor; it never loops. */
export function ComponentCanvas() {
  const viewport = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(pointer: fine)');
    let visible = false;
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const measure = () => {
      const width = element.clientWidth;
      const small = width < 640;
      const sceneWidth = small ? 860 : 1240;
      const sceneHeight = small ? 900 : 680;
      const scale = (small ? width : Math.max(1, width - 60)) / sceneWidth;
      element.style.setProperty('--canvas-scale', String(scale));
      element.style.setProperty('--canvas-height', `${scale * sceneHeight + (small ? 0 : 18)}px`);
      element.dataset.compact = String(small);
    };
    const update = () => {
      frame = 0;
      if (!visible || motion.matches) return;
      const bounds = element.getBoundingClientRect();
      const progress = Math.max(
        0,
        Math.min(1, (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height)),
      );
      element.style.setProperty('--canvas-pitch', `${15 - progress * 12 + pointerY * 1.4}deg`);
      element.style.setProperty('--canvas-yaw', `${-7 + progress * 5 + pointerX * 1.8}deg`);
      element.style.setProperty('--canvas-lift', `${18 - progress * 30}px`);
      element.style.setProperty('--canvas-depth', `${progress * 18}px`);
    };
    const schedule = () => {
      if (!visible || motion.matches || frame) return;
      frame = requestAnimationFrame(update);
    };
    const reset = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      pointerX = 0;
      pointerY = 0;
      for (const property of ['--canvas-pitch', '--canvas-yaw', '--canvas-lift', '--canvas-depth'])
        element.style.removeProperty(property);
      schedule();
    };
    const move = (event: PointerEvent) => {
      if (!finePointer.matches || motion.matches) return;
      const bounds = element.getBoundingClientRect();
      pointerX = Math.max(
        -1,
        Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2),
      );
      pointerY = Math.max(
        -1,
        Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2),
      );
      schedule();
    };
    const leave = () => {
      pointerX = 0;
      pointerY = 0;
      schedule();
    };
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      schedule();
    });
    const resize = new ResizeObserver(() => {
      measure();
      schedule();
    });
    measure();
    intersection.observe(element);
    resize.observe(element);
    window.addEventListener('scroll', schedule, { passive: true });
    element.addEventListener('pointermove', move, { passive: true });
    element.addEventListener('pointerleave', leave);
    motion.addEventListener('change', reset);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      intersection.disconnect();
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', leave);
      motion.removeEventListener('change', reset);
    };
  }, []);

  return (
    <figure className="component-canvas">
      <div ref={viewport} className="component-canvas-viewport">
        <div className="component-canvas-scaler">
          <div className="component-canvas-scene dark" data-theme="dark" aria-hidden="true" inert>
            <div className="component-canvas-orbit component-canvas-orbit-one" />
            <div className="component-canvas-orbit component-canvas-orbit-two" />
            <div className="component-canvas-plane">
              <div className="component-canvas-workspace component-canvas-panel">
                <div className="component-canvas-windowbar">
                  <span className="component-canvas-windowdots">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span>
                    <Layers size={13} /> Aegis / React workspace
                  </span>
                  <span className="component-canvas-windowhint">⌘ K</span>
                </div>
                <div className="component-canvas-appbar">
                  <span className="component-canvas-appmark">
                    <Shield size={17} />
                  </span>
                  <span>
                    Workspace <ChevronRight size={12} /> Security overview
                  </span>
                  <div className="component-canvas-app-actions">
                    <Search size={15} />
                    <Bell size={15} />
                    <Avatar name="Alex Morgan" size="sm" />
                  </div>
                </div>
                <div className="component-canvas-workspace-body">
                  <div className="component-canvas-pageheading">
                    <div>
                      <span className="component-canvas-kicker">PRODUCTION / EU-WEST-1</span>
                      <h3>Signal, without the noise.</h3>
                    </div>
                    <Button
                      size="sm"
                      intent="function"
                      leadingIcon={<SlidersHorizontal size={13} />}
                    >
                      Configure view
                    </Button>
                  </div>
                  <div className="component-canvas-overview">
                    <Card className="component-canvas-activity-card">
                      <div className="component-canvas-card-heading">
                        <span>
                          <Activity size={14} /> Event activity
                        </span>
                        <Tag size="sm">Last 24 hours</Tag>
                      </div>
                      <div className="component-canvas-chart">
                        <div className="component-canvas-chart-guides">
                          <span>800</span>
                          <span>400</span>
                          <span>0</span>
                        </div>
                        <Sparkline
                          data={trend}
                          width={480}
                          height={95}
                          variant="area"
                          intent="function"
                          label="Illustrative event activity"
                        />
                      </div>
                      <div className="component-canvas-chart-axis">
                        <span>00:00</span>
                        <span>06:00</span>
                        <span>12:00</span>
                        <span>18:00</span>
                        <span>23:59</span>
                      </div>
                    </Card>
                    <Card className="component-canvas-sources">
                      <div className="component-canvas-card-heading">
                        Connected sources <span>3</span>
                      </div>
                      {[
                        ['Identity', 82],
                        ['Endpoint', 64],
                        ['Network', 45],
                      ].map(([label, value]) => (
                        <div className="component-canvas-source" key={label}>
                          <span>{label}</span>
                          <ProgressBar
                            label={String(label)}
                            value={Number(value)}
                            size="sm"
                            intent={
                              label === 'Identity'
                                ? 'function'
                                : label === 'Endpoint'
                                  ? 'success'
                                  : 'warning'
                            }
                          />
                        </div>
                      ))}
                    </Card>
                  </div>
                  <div className="component-canvas-table-heading">
                    <span>
                      Priority signals{' '}
                      <Tag size="sm" variant="counter" count={12}>
                        Open
                      </Tag>
                    </span>
                    <span>
                      <Search size={13} /> Search signals… <SlidersHorizontal size={13} />
                    </span>
                  </div>
                  <table className="component-canvas-table">
                    <thead>
                      <tr>
                        <th>
                          <Checkbox
                            size="sm"
                            aria-label="Select all sample signals"
                            checked="indeterminate"
                          />
                        </th>
                        <th>Signal</th>
                        <th>Severity</th>
                        <th>Status</th>
                        <th>Detected</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => (
                        <tr key={row.title}>
                          <td>
                            <Checkbox
                              size="sm"
                              aria-label={`Select ${row.title}`}
                              checked={index === 1}
                            />
                          </td>
                          <td>
                            <strong>{row.title}</strong>
                            <span>{row.host}</span>
                          </td>
                          <td>
                            <SeverityBadge severity={row.severity} />
                          </td>
                          <td>
                            <StatusBadge status={row.status} />
                          </td>
                          <td>{row.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="component-canvas-workspace-footer">
                  <span>
                    <span className="component-canvas-online" /> All systems connected
                  </span>
                  <span>Illustrative workspace · Native React components</span>
                </div>
              </div>

              <div className="component-canvas-library component-canvas-panel">
                <div className="component-canvas-panel-header">
                  <span>
                    <Layers size={15} /> Components
                  </span>
                  <span>React</span>
                </div>
                <div className="component-canvas-library-search">
                  <Search size={13} /> Find a component <span>⌘ K</span>
                </div>
                <div className="component-canvas-library-label">YOUR BUILDING BLOCKS</div>
                <div className="component-canvas-library-items">
                  {[
                    [Layers, 'Foundations'],
                    [Shield, 'Data display'],
                    [SlidersHorizontal, 'Inputs'],
                    [Sparkles, 'AI patterns'],
                  ].map(([Icon, label]) => {
                    const Glyph = Icon as typeof Layers;
                    return (
                      <div key={String(label)} data-active={label === 'Data display'}>
                        <Glyph size={14} />
                        <span>{String(label)}</span>
                        <ChevronRight size={11} />
                      </div>
                    );
                  })}
                </div>
                <div className="component-canvas-library-samples">
                  <span>One visual language.</span>
                  <div>
                    <Button size="sm" intent="function">
                      Create rule
                    </Button>
                    <Button size="sm" emphasis="secondary">
                      Cancel
                    </Button>
                  </div>
                  <div>
                    <Tag size="sm" intent="success">
                      Production
                    </Tag>
                    <Tag size="sm" intent="function">
                      Identity
                    </Tag>
                  </div>
                  <div>
                    <Switch size="sm" checked label="Live updates" />
                    <Checkbox size="sm" checked label="Selected" />
                  </div>
                </div>
                <div className="component-canvas-panel-note">
                  <FileCode size={12} /> Built with typed React components
                </div>
              </div>

              <div className="component-canvas-inspector component-canvas-panel">
                <div className="component-canvas-panel-header">
                  <span>
                    <Settings size={15} /> Tokens
                  </span>
                  <ChevronDown size={13} />
                </div>
                <div className="component-canvas-inspector-section">
                  <span className="component-canvas-inspector-label">APPEARANCE</span>
                  <div className="component-canvas-token-mode">
                    <span>Dark</span>
                    <span>Light</span>
                  </div>
                  <div className="component-canvas-token-row">
                    <span>Surface</span>
                    <i className="component-canvas-swatch-surface" />
                    <code>surface</code>
                  </div>
                  <div className="component-canvas-token-row">
                    <span>Action</span>
                    <i className="component-canvas-swatch-blue" />
                    <code>function</code>
                  </div>
                  <div className="component-canvas-token-row">
                    <span>Positive</span>
                    <i className="component-canvas-swatch-mint" />
                    <code>success</code>
                  </div>
                </div>
                <div className="component-canvas-inspector-section">
                  <span className="component-canvas-inspector-label">COMPONENT GEOMETRY</span>
                  <div className="component-canvas-dimension-row">
                    <span>
                      Padding <b>12</b>
                    </span>
                    <span>
                      Radius <b>10</b>
                    </span>
                  </div>
                  <div className="component-canvas-token-code">
                    <code>--layout-card-padding</code>
                    <span>var(--space-3)</span>
                  </div>
                </div>
                <div className="component-canvas-inspector-section component-canvas-payload">
                  <span className="component-canvas-inspector-label">STRUCTURED CONTEXT</span>
                  <JsonViewer
                    value={samplePayload}
                    label="Illustrative event context"
                    rootName="event"
                    defaultExpandedDepth={1}
                    maxHeight={160}
                  />
                </div>
              </div>

              <Card className="component-canvas-ai component-canvas-panel">
                <div className="component-canvas-ai-heading">
                  <span>
                    <Sparkles size={17} /> AI suggestion
                  </span>
                  <ConfidenceBadge confidence="high" />
                </div>
                <h3>Connect the evidence.</h3>
                <p>
                  Three related signals share the same identity. Review the context before taking
                  action.
                </p>
                <div className="component-canvas-ai-footer">
                  <div>
                    <Tag size="sm">3 signals</Tag>
                    <AvatarGroup
                      avatars={[{ name: 'Alex Morgan' }, { name: 'Maya Chen' }]}
                      max={2}
                    />
                  </div>
                  <Button size="sm" intent="ai" emphasis="tertiary">
                    Review <ArrowUpRight size={13} />
                  </Button>
                </div>
              </Card>
              <Card className="component-canvas-metric component-canvas-panel">
                <div className="component-canvas-metric-label">
                  <span className="component-canvas-metric-symbol">
                    <Activity size={15} />
                  </span>
                  Events processed <Tag size="sm">24h</Tag>
                </div>
                <div className="component-canvas-metric-value">
                  <strong>24,802</strong>
                  <span>
                    <ArrowUpRight size={12} /> 12.8%
                  </span>
                </div>
                <Sparkline
                  data={[3, 8, 5, 12, 9, 15, 13, 18, 15, 24, 20, 28]}
                  width={202}
                  height={35}
                  intent="success"
                  variant="area"
                />
              </Card>
              <span className="component-canvas-cursor">
                <svg width="19" height="22" viewBox="0 0 19 22" fill="currentColor">
                  <path d="M1 1 18 12l-8 1-4 8Z" />
                </svg>
                <span>Component / Card</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      <figcaption>
        <span className="component-canvas-caption-mark">
          <Layers size={14} />
        </span>{' '}
        Real React components. Shared tokens. One coherent system.
        <span className="component-canvas-caption-note">Illustrative data</span>
      </figcaption>
    </figure>
  );
}
