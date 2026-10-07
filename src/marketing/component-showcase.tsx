import { useRef, useState, type ReactNode } from 'react';
import { Accordion } from '@/components/accordion';
import { AiCard } from '@/components/ai-card';
import { Avatar, AvatarGroup } from '@/components/avatar';
import { Breadcrumb } from '@/components/breadcrumb';
import { Button } from '@/components/button';
import { Checkbox } from '@/components/checkbox';
import { CountBadge } from '@/components/count-badge';
import { ArrowRight, Check, Layers, Rows3, Shield, Sparkles } from '@/components/icon';
import { SeverityBadge, type Severity } from '@/components/severity-badge';
import { StatusBadge } from '@/components/status-badge';
import { Switch } from '@/components/switch';
import { Tabs } from '@/components/tabs';
import { Tag } from '@/components/tag';
import './component-showcase.css';

type Context = 'signals' | 'investigation' | 'review';
type ReviewDecision = 'pending' | 'accepted' | 'dismissed';
interface SampleSignal {
  id: string;
  title: string;
  entity: string;
  severity: Severity;
  time: string;
}
const sampleSignals: readonly SampleSignal[] = [
  {
    id: '1042',
    title: 'PowerShell launched by Office',
    entity: 'DC-ATH-02 · Endpoint',
    severity: 'critical',
    time: '09:42',
  },
  {
    id: '1041',
    title: 'Unusual outbound connection',
    entity: 'DC-ATH-02 · Network',
    severity: 'high',
    time: '09:41',
  },
  {
    id: '1040',
    title: 'New administrator session',
    entity: 'a.papadopoulos · Identity',
    severity: 'high',
    time: '09:38',
  },
  {
    id: '1039',
    title: 'Repeated authentication failures',
    entity: 'SRV-DB-04 · Identity',
    severity: 'medium',
    time: '09:35',
  },
  {
    id: '1038',
    title: 'New sign-in location',
    entity: 'r.patel · Identity',
    severity: 'low',
    time: '09:31',
  },
];
const stories: Record<
  Context,
  {
    number: string;
    title: string;
    description: string;
    annotations: { name: string; benefit: string }[];
    hint: string;
  }
> = {
  signals: {
    number: '01',
    title: 'Find what matters first.',
    description:
      'Dense information needs a clear reading order. Give urgency, state, and action their own visual roles.',
    annotations: [
      { name: 'SeverityBadge + StatusBadge', benefit: 'Separate the risk from the workflow.' },
      { name: 'Checkbox + Button', benefit: 'Make selection lead to an explicit action.' },
      { name: 'Tag + Switch', benefit: 'Narrow the view and adjust its density.' },
    ],
    hint: 'Filter high-priority signals, select a row, then triage it.',
  },
  investigation: {
    number: '02',
    title: 'Stay oriented as you go deeper.',
    description:
      'Keep the entity, ownership, and evidence together. Reveal detail when it helps the investigation.',
    annotations: [
      { name: 'Breadcrumb', benefit: 'Keep the route back in view.' },
      { name: 'Accordion', benefit: 'Let evidence unfold at the right level.' },
      { name: 'Avatar + Tag', benefit: 'Give people and entities a clear place.' },
    ],
    hint: 'Open the evidence groups or assign the sample investigation.',
  },
  review: {
    number: '03',
    title: 'Make assistance recognizable.',
    description:
      'AI suggestions need visible provenance and a clear decision point. Keep the evidence and the person in control.',
    annotations: [
      { name: 'AiCard + ConfidenceBadge', benefit: 'Distinguish a suggestion from a verdict.' },
      { name: 'Accordion + Tag', benefit: 'Keep supporting context within reach.' },
      { name: 'Button', benefit: 'Make accepting, dismissing, and undoing explicit.' },
    ],
    hint: 'Review the sample evidence, then accept or dismiss the suggestion.',
  },
};

function SignalPreview() {
  const [compact, setCompact] = useState(false);
  const [priority, setPriority] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [triaged, setTriaged] = useState<string[]>([]);
  const visible = sampleSignals.filter(
    (signal) => !priority || signal.severity === 'critical' || signal.severity === 'high',
  );
  const selectedVisible = visible.filter((signal) => selected.includes(signal.id)).length;
  return (
    <div className="marketing-showcase-signal" data-compact={compact}>
      <div className="marketing-showcase-view-heading">
        <div>
          <span className="marketing-showcase-overline">SECURITY OPERATIONS</span>
          <h3>
            Detection queue <CountBadge count={visible.length} label="sample signals" />
          </h3>
        </div>
        <Switch size="sm" label="Compact rows" checked={compact} onCheckedChange={setCompact} />
      </div>
      <div className="marketing-showcase-filter-row">
        <Tag variant="interactive" size="sm" selected={priority} onSelectedChange={setPriority}>
          High priority
        </Tag>
        <span>Sample signals · 09:31–09:42 UTC</span>
      </div>
      <div className="marketing-showcase-queue-head">
        <Checkbox
          size="sm"
          aria-label="Select all visible sample signals"
          checked={
            selectedVisible === visible.length ? true : selectedVisible ? 'indeterminate' : false
          }
          onCheckedChange={(checked) =>
            setSelected(checked === true ? visible.map((signal) => signal.id) : [])
          }
        />
        <span>Signal / entity</span>
        <span>Status</span>
        <span>Observed</span>
      </div>
      <ol className="marketing-showcase-queue" aria-label="Sample detection queue">
        {visible.map((signal) => (
          <li key={signal.id} data-selected={selected.includes(signal.id)}>
            <Checkbox
              size="sm"
              aria-label={`Select ${signal.title}`}
              checked={selected.includes(signal.id)}
              onCheckedChange={(checked) =>
                setSelected((current) =>
                  checked === true
                    ? [...current, signal.id]
                    : current.filter((id) => id !== signal.id),
                )
              }
            />
            <div className="marketing-showcase-signal-copy">
              <strong>{signal.title}</strong>
              <div>
                <SeverityBadge severity={signal.severity} />
                <span>{signal.entity}</span>
              </div>
            </div>
            <StatusBadge status={triaged.includes(signal.id) ? 'triaged' : 'new'} />
            <time>{signal.time}</time>
          </li>
        ))}
      </ol>
      <div className="marketing-showcase-preview-actions">
        <span role="status">
          {selected.length
            ? `${selected.length} selected`
            : triaged.length
              ? `${triaged.length} sample signals triaged`
              : 'Select a signal to take action'}
        </span>
        <div>
          <Button
            size="sm"
            emphasis="ghost"
            onClick={() => {
              setTriaged([]);
              setSelected([]);
              setPriority(false);
            }}
          >
            Reset
          </Button>
          <Button
            size="sm"
            emphasis="secondary"
            intent="function"
            leadingIcon={<Check size={14} />}
            disabled={!selected.length}
            onClick={() => {
              setTriaged((current) => [...new Set([...current, ...selected])]);
              setSelected([]);
            }}
          >
            Triage selected
          </Button>
        </div>
      </div>
    </div>
  );
}

function InvestigationPreview({ onBack }: { onBack: () => void }) {
  const [assigned, setAssigned] = useState(false);
  return (
    <div className="marketing-showcase-investigation">
      <Breadcrumb
        aria-label="Sample investigation path"
        items={[{ label: 'Signals', onClick: onBack }, { label: 'ALR-1042' }]}
      />
      <div className="marketing-showcase-case-heading">
        <div className="marketing-showcase-entity-icon">
          <Shield size={22} />
        </div>
        <div>
          <h3>PowerShell launched by Office</h3>
          <p>
            DC-ATH-02 <span>·</span> Endpoint detection
          </p>
        </div>
      </div>
      <div className="marketing-showcase-case-tags">
        <SeverityBadge severity="critical" />
        <StatusBadge status="in-progress" />
        <Tag size="sm">T1059.001</Tag>
      </div>
      <dl className="marketing-showcase-metadata">
        <div>
          <dt>Host address</dt>
          <dd>10.24.16.140</dd>
        </div>
        <div>
          <dt>First observed</dt>
          <dd>09:42:08 UTC</dd>
        </div>
        <div>
          <dt>Assigned to</dt>
          <dd>
            <Avatar
              name={assigned ? 'You' : 'Elena Varga'}
              initials={assigned ? 'YO' : 'EV'}
              size="sm"
            />
            {assigned ? 'You' : 'Elena Varga'}
          </dd>
        </div>
      </dl>
      <Accordion
        type="multiple"
        defaultValue={['process']}
        variant="divided"
        items={[
          {
            value: 'process',
            title: 'Process chain',
            count: 3,
            content: (
              <div className="marketing-showcase-process">
                <code>WINWORD.EXE</code>
                <ArrowRight size={13} />
                <code>powershell.exe</code>
                <ArrowRight size={13} />
                <code>cmd.exe</code>
                <p>Office started a script interpreter with an encoded command.</p>
              </div>
            ),
          },
          {
            value: 'network',
            title: 'Network evidence',
            count: 1,
            content: (
              <p className="marketing-showcase-evidence-copy">
                An outbound TLS connection from DC-ATH-02 to <code>203.0.113.42:443</code> followed
                18 seconds later. The destination is a documentation address in this sample.
              </p>
            ),
          },
          {
            value: 'identity',
            title: 'Identity context',
            count: 1,
            content: (
              <p className="marketing-showcase-evidence-copy">
                The process ran in the session of <strong>a.papadopoulos</strong>. No administrator
                elevation appears in these sample events.
              </p>
            ),
          },
        ]}
      />
      <div className="marketing-showcase-preview-actions">
        <AvatarGroup
          size="sm"
          label="Sample collaborators"
          avatars={[
            { name: 'Elena Varga', initials: 'EV' },
            { name: 'Marcus Chen', initials: 'MC' },
          ]}
        />
        <Button
          size="sm"
          emphasis="secondary"
          intent="function"
          onClick={() => setAssigned(!assigned)}
        >
          {assigned ? 'Assigned to you · undo' : 'Assign to me'}
        </Button>
      </div>
      <span className="sr-only" role="status">
        {assigned
          ? 'Sample investigation assigned to you.'
          : 'Sample investigation assigned to Elena Varga.'}
      </span>
    </div>
  );
}

function ReviewPreview() {
  const [decision, setDecision] = useState<ReviewDecision>('pending');
  const decisionActions = useRef<HTMLDivElement>(null);
  return (
    <div className="marketing-showcase-review">
      <div className="marketing-showcase-view-heading">
        <div>
          <span className="marketing-showcase-overline">INVESTIGATION ASSISTANT</span>
          <h3>Context before action.</h3>
        </div>
        <Tag size="sm">DC-ATH-02</Tag>
      </div>
      <AiCard
        title="One host. A possible connection."
        confidence="medium"
        provenance="Illustrative suggestion · 3 sample events"
      >
        <p>
          Office launched PowerShell before an unusual outbound connection on{' '}
          <strong>DC-ATH-02</strong>. Review these events together before deciding whether to
          escalate.
        </p>
        <div className="marketing-showcase-ai-tags">
          <Tag size="sm" intent="ai">
            Shared host
          </Tag>
          <Tag size="sm" intent="ai">
            18-second window
          </Tag>
        </div>
      </AiCard>
      <Accordion
        type="single"
        collapsible
        variant="divided"
        items={[
          {
            value: 'evidence',
            title: 'Inspect supporting evidence',
            count: 3,
            content: (
              <ol className="marketing-showcase-evidence-list">
                <li>
                  <time>09:42:08</time>
                  <span>Office starts PowerShell on DC-ATH-02.</span>
                </li>
                <li>
                  <time>09:42:12</time>
                  <span>An encoded command executes in the same session.</span>
                </li>
                <li>
                  <time>09:42:26</time>
                  <span>The host opens an outbound TLS connection.</span>
                </li>
              </ol>
            ),
          },
        ]}
      />
      <div className="marketing-showcase-decision" data-decision={decision} role="status">
        {decision === 'pending' ? (
          <>
            <span className="marketing-showcase-decision-dot" />
            Awaiting your review. No action taken.
          </>
        ) : decision === 'accepted' ? (
          <>
            <Check size={16} />
            Sample investigation created. Nothing was sent.
          </>
        ) : (
          <>Suggestion dismissed. The sample evidence is unchanged.</>
        )}
      </div>
      <div className="marketing-showcase-review-actions" ref={decisionActions}>
        <Button
          size="sm"
          intent={decision === 'pending' ? 'ai' : 'default'}
          emphasis={decision === 'pending' ? 'primary' : 'secondary'}
          leadingIcon={decision === 'pending' ? <Sparkles size={15} /> : undefined}
          onClick={() => setDecision(decision === 'pending' ? 'accepted' : 'pending')}
        >
          {decision === 'pending' ? 'Create investigation' : 'Undo decision'}
        </Button>
        <Button
          size="sm"
          emphasis="ghost"
          disabled={decision !== 'pending'}
          onClick={() => {
            setDecision('dismissed');
            decisionActions.current?.querySelector<HTMLButtonElement>('button')?.focus();
          }}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}

/** Curated, local interactions showing Aegis components in technical workflows. */
export function ComponentShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<Context>('signals');
  const [dark, setDark] = useState(true);
  const story = stories[active];
  const previews: Record<Context, ReactNode> = {
    signals: <SignalPreview />,
    investigation: (
      <InvestigationPreview
        onBack={() => {
          sectionRef.current
            ?.querySelector<HTMLButtonElement>('.marketing-showcase-tab-list [role="tab"]')
            ?.focus();
          setActive('signals');
        }}
      />
    ),
    review: <ReviewPreview />,
  };
  return (
    <section
      ref={sectionRef}
      className="marketing-workflow-stage"
      aria-label="Interactive Aegis investigation example"
    >
      <h2 className="sr-only">An investigation, built with Aegis</h2>
      <div className="marketing-stage-topline">
        <span>
          <i /> AEGIS / SECURITY OPERATIONS
        </span>
        <span>Working components · sample data</span>
      </div>
      <Tabs
        value={active}
        onValueChange={(value) => {
          if (value === 'signals' || value === 'investigation' || value === 'review')
            setActive(value);
        }}
        label="Component showcase workflows"
        className="marketing-showcase-tabs"
        listClassName="marketing-showcase-tab-list"
        contentClassName="marketing-showcase-tab-panel"
        items={[
          { value: 'signals', label: 'Alert queue', icon: <Rows3 size={17} />, content: null },
          {
            value: 'investigation',
            label: 'Evidence panel',
            icon: <Layers size={17} />,
            content: null,
          },
          { value: 'review', label: 'AI review', icon: <Sparkles size={17} />, content: null },
        ]}
        sharedContent={
          <div
            className={`marketing-showcase-preview${dark ? ' dark' : ''}`}
            style={{ colorScheme: dark ? 'dark' : 'light' }}
          >
            <div className="marketing-showcase-preview-bar">
              <span>01 / INTERACTIVE SPECIMEN</span>
              <Switch size="sm" label="Dark preview" checked={dark} onCheckedChange={setDark} />
            </div>
            <div className="marketing-showcase-preview-body">{previews[active]}</div>
          </div>
        }
      />
      <div className="marketing-stage-caption">
        <p>{story.hint}</p>
        <a href="?view=console">
          Open the full console <ArrowRight size={15} />
        </a>
      </div>
    </section>
  );
}
