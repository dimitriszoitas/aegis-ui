import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowUpDown,
  Link2,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  X,
} from '@/components/icon';
import { Button } from '@/components/button';
import { IconButton } from '@/components/icon-button';
import { CopyButton } from '@/components/copy-button';
import { Tabs } from '@/components/tabs';
import { Select } from '@/components/select';
import { SearchInput } from '@/components/search-input';
import { Textarea } from '@/components/textarea';
import { Avatar } from '@/components/avatar';
import { Card } from '@/components/card';
import { SeverityBadge, severityLabels, type Severity } from '@/components/severity-badge';
import { StatusDot, statusLabels, type AlertStatus } from '@/components/status-badge';
import { RelativeTime } from '@/components/relative-time';
import { JsonViewer } from '@/components/json-viewer';
import { EmptyState } from '@/components/empty-state';
import { cn } from '@/lib/utils';
import type { Alert, Analyst, DetectionRule } from '@/sample-data/types';
const detailStateLabels = { ...statusLabels, new: 'Open', resolved: 'Closed' };
import './alert-detail.css';

export interface AlertDetailFact {
  label: string;
  value: string;
}
export interface AlertDetailSignal {
  id: string;
  title: string;
  ruleId: string;
  ruleName: string;
  ruleVersion?: string;
  severity: Severity;
  eventTime: string;
  detectedTime: string;
  actors?: AlertDetailFact[];
  resources?: AlertDetailFact[];
  context?: Record<string, unknown>;
  record: Record<string, unknown>;
}
export interface AlertDetailComment {
  id: string;
  author: Analyst;
  body: string;
  createdAt: string;
}
export interface AlertDetailContext {
  description?: string;
  classification?: string;
  runAs?: string;
  ruleVersion?: string;
}
export interface AlertDetailPageProps {
  alert: Alert;
  analysts: Analyst[];
  rules?: DetectionRule[];
  onBack: () => void;
  onUpdate?: (alert: Alert) => void | Promise<void>;
  onTriage?: (alert: Alert) => void;
  context?: AlertDetailContext;
  /** Defaults to the alert's actual evidence events; no synthetic rows are added. */
  signals?: AlertDetailSignal[];
  comments?: AlertDetailComment[];
  onAddComment?: (comment: AlertDetailComment) => void | Promise<void>;
  currentAnalyst?: Analyst;
  alertHref?: string;
  now?: Date | number;
  defaultTab?: 'overview' | 'signals';
  className?: string;
}
const unassigned = '__unassigned__';
const localAnalyst: Analyst = {
  id: 'current-analyst',
  name: 'You',
  initials: 'YO',
  role: 'Analyst',
};
const textValue = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim()
    ? value
    : typeof value === 'number'
      ? String(value)
      : undefined;
const facts = (values: [string, string | undefined][]): AlertDetailFact[] =>
  values.flatMap(([label, value]) => (value ? [{ label, value }] : []));

/** Maps supplied event evidence to the detail table without inventing additional signals. */
export function alertSignals(alert: Alert, rule?: DetectionRule): AlertDetailSignal[] {
  return alert.events.map((event) => {
    const p = event.payload;
    const severity = textValue(p.severity);
    return {
      id: event.id,
      title: event.action,
      ruleId: textValue(p.rule_id) ?? alert.ruleId,
      ruleName: textValue(p.rule_name) ?? rule?.name ?? alert.title,
      ruleVersion: textValue(p.rule_version),
      severity: severity && severity in severityLabels ? (severity as Severity) : alert.severity,
      eventTime: event.timestamp,
      detectedTime: textValue(p.detected_at) ?? alert.lastSeen,
      actors: facts([
        ['Name', textValue(p.user_name) ?? event.user],
        ['Email', textValue(p.user_email)],
        ['User ID', textValue(p.user_id)],
        ['Role', textValue(p.user_role)],
      ]),
      resources: facts([
        ['Type', textValue(p.resource_type)],
        ['Name', textValue(p.resource_name) ?? event.host],
        ['Source IP', event.sourceIp],
        ['Destination IP', event.destinationIp],
      ]),
      context: p,
      record: { ...event },
    };
  });
}
function DetailFacts({ children }: { children: ReactNode }) {
  return <dl className="aegis-detail-facts">{children}</dl>;
}
function DetailFact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
function SignalInspector({
  signal,
  now,
  onClose,
}: {
  signal: AlertDetailSignal;
  now?: Date | number;
  onClose: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const id = useId();
  useEffect(() => {
    heading.current?.focus();
  }, [signal.id]);
  return (
    <aside
      className="aegis-detail-signal-panel"
      aria-labelledby={id}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="aegis-detail-signal-panel-header">
        <h3 id={id} ref={heading} tabIndex={-1}>
          Signal details
        </h3>
        <IconButton size="sm" emphasis="ghost" aria-label="Close signal details" onClick={onClose}>
          <X />
        </IconButton>
      </div>
      <p className="aegis-detail-signal-title">{signal.title}</p>
      <div className="aegis-detail-identity">
        <code>{signal.id}</code>
        <CopyButton size="sm" text={signal.id} aria-label="Copy signal ID" />
      </div>
      <section className="aegis-detail-inspector-section">
        <h4>Actors &amp; resources</h4>
        <DetailFacts>
          {(signal.actors ?? []).map((fact) => (
            <DetailFact key={`actor-${fact.label}`} label={fact.label}>
              {fact.value}
            </DetailFact>
          ))}
          {(signal.resources ?? []).map((fact) => (
            <DetailFact key={`resource-${fact.label}`} label={fact.label}>
              {fact.value}
            </DetailFact>
          ))}
          {!signal.actors?.length && !signal.resources?.length && (
            <DetailFact label="Entities">No entity information attached</DetailFact>
          )}
        </DetailFacts>
      </section>
      <section className="aegis-detail-inspector-section">
        <h4>Detection</h4>
        <DetailFacts>
          <DetailFact label="Event time">
            <RelativeTime value={signal.eventTime} now={now} />
          </DetailFact>
          <DetailFact label="Detected">
            <RelativeTime value={signal.detectedTime} now={now} />
          </DetailFact>
          <DetailFact label="Severity">
            <SeverityBadge severity={signal.severity} />
          </DetailFact>
          <DetailFact label="Rule version">{signal.ruleVersion ?? 'Not provided'}</DetailFact>
          <DetailFact label="Rule">
            <span>{signal.ruleName}</span>
            <code>{signal.ruleId}</code>
          </DetailFact>
        </DetailFacts>
      </section>
      <details className="aegis-detail-record">
        <summary>Signal context</summary>
        <JsonViewer
          value={signal.context ?? {}}
          label={`Context for ${signal.id}`}
          maxHeight={260}
          defaultExpandedDepth={1}
        />
      </details>
      <details className="aegis-detail-record">
        <summary>Full record</summary>
        <JsonViewer
          value={signal.record}
          label={`Full record for ${signal.id}`}
          maxHeight={360}
          defaultExpandedDepth={1}
        />
      </details>
    </aside>
  );
}
function DetailPage({
  alert,
  analysts,
  rules,
  onBack,
  onUpdate,
  onTriage,
  context,
  signals: suppliedSignals,
  comments: suppliedComments,
  onAddComment,
  currentAnalyst,
  alertHref,
  now,
  defaultTab = 'overview',
  className,
}: AlertDetailPageProps) {
  const [record, setRecord] = useState(alert);
  const [tab, setTab] = useState(defaultTab);
  const [contextOpen, setContextOpen] = useState(true);
  const contextId = useId();
  const [query, setQuery] = useState('');
  const [selectedSignal, setSelectedSignal] = useState<string>();
  const [newestFirst, setNewestFirst] = useState(true);
  const [eventNewestFirst, setEventNewestFirst] = useState(true);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const commentInput = useRef<HTMLTextAreaElement>(null);
  const signalTrigger = useRef<HTMLButtonElement | null>(null);
  const savingRef = useRef(false);
  const addingRef = useRef(false);
  const author = currentAnalyst ?? analysts[0] ?? localAnalyst;
  const [comments, setComments] = useState<AlertDetailComment[]>(
    () =>
      suppliedComments ??
      (alert.analystNote
        ? [
            {
              id: `${alert.id}-note`,
              author: alert.assignee ?? author,
              body: alert.analystNote,
              createdAt: alert.lastSeen,
            },
          ]
        : []),
  );
  useEffect(() => {
    setRecord(alert);
  }, [alert]);
  useEffect(() => {
    if (suppliedComments) setComments(suppliedComments);
  }, [suppliedComments]);
  const rule = rules?.find((item) => item.id === record.ruleId);
  const signals = useMemo(
    () => suppliedSignals ?? alertSignals(record, rule),
    [suppliedSignals, record, rule],
  );
  const filteredSignals = useMemo(
    () =>
      signals
        .filter((signal) =>
          `${signal.title} ${signal.ruleName} ${signal.ruleId} ${signal.id} ${signal.severity}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
        )
        .sort(
          (a, b) =>
            (Date.parse(a.eventTime) - Date.parse(b.eventTime)) * (eventNewestFirst ? -1 : 1),
        ),
    [signals, query, eventNewestFirst],
  );
  const activeSignal = signals.find((signal) => signal.id === selectedSignal);
  const orderedComments = [...comments].sort(
    (a, b) => (Date.parse(a.createdAt) - Date.parse(b.createdAt)) * (newestFirst ? -1 : 1),
  );
  const choices =
    record.assignee && !analysts.some((analyst) => analyst.id === record.assignee?.id)
      ? [record.assignee, ...analysts]
      : analysts;
  const href =
    alertHref ??
    (typeof window === 'undefined'
      ? `?view=console&alert=${encodeURIComponent(record.id)}`
      : (() => {
          const url = new URL(window.location.href);
          url.searchParams.set('view', 'console');
          url.searchParams.set('alert', record.id);
          return url.href;
        })());
  async function update(patch: Partial<Alert>) {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError('');
    setMessage('');
    const updated = { ...record, ...patch };
    try {
      await onUpdate?.(updated);
      setRecord(updated);
      setMessage('Alert updated.');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'The alert could not be updated. Try again.',
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }
  async function addComment() {
    if (!draft.trim() || addingRef.current) return;
    addingRef.current = true;
    setAdding(true);
    setError('');
    const comment: AlertDetailComment = {
      id: `${record.id}-comment-${crypto.randomUUID()}`,
      author,
      body: draft.trim(),
      createdAt: new Date(now ?? Date.now()).toISOString(),
    };
    try {
      await onAddComment?.(comment);
      setComments((current) => [...current.filter((item) => item.id !== comment.id), comment]);
      setDraft('');
      setMessage('Comment added.');
      requestAnimationFrame(() => commentInput.current?.focus());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The comment could not be added. Your draft is preserved.',
      );
    } finally {
      addingRef.current = false;
      setAdding(false);
    }
  }
  function closeSignal() {
    setSelectedSignal(undefined);
    requestAnimationFrame(() => signalTrigger.current?.focus());
  }
  return (
    <article className={cn('aegis-alert-detail-page', className)}>
      <header className="aegis-detail-page-header">
        <Button emphasis="ghost" size="sm" leadingIcon={<ArrowLeft />} onClick={onBack}>
          Alerts
        </Button>
        <div className="aegis-detail-heading">
          <h1 tabIndex={-1}>{record.title}</h1>
          <div className="aegis-detail-identity">
            <code>{record.id}</code>
            <CopyButton size="sm" text={record.id} aria-label="Copy alert ID" />
            <a href={href} className="aegis-detail-permalink" aria-label="Link to this alert">
              <Link2 size={16} />
            </a>
          </div>
        </div>
        <div className="aegis-detail-controls">
          <Select
            label="Status"
            value={record.status}
            disabled={saving}
            size="lg"
            options={(Object.keys(statusLabels) as AlertStatus[]).map((value) => ({
              value,
              label: detailStateLabels[value],
              icon: <StatusDot status={value} label={false} />,
            }))}
            onValueChange={(status) => {
              if (status in statusLabels) void update({ status: status as AlertStatus });
            }}
          />
          <Select
            label="Severity"
            value={record.severity}
            disabled={saving}
            size="lg"
            options={(Object.keys(severityLabels) as Severity[]).map((value) => ({
              value,
              label: severityLabels[value],
              icon: <SeverityBadge severity={value} compact />,
            }))}
            onValueChange={(severity) => {
              if (severity in severityLabels) void update({ severity: severity as Severity });
            }}
          />
          <Select
            label="Assignee"
            value={record.assignee?.id ?? unassigned}
            disabled={saving}
            size="lg"
            options={[
              { value: unassigned, label: 'Unassigned' },
              ...choices.map((analyst) => ({ value: analyst.id, label: analyst.name })),
            ]}
            onValueChange={(id) => {
              void update({ assignee: choices.find((analyst) => analyst.id === id) });
            }}
          />
          {onTriage && (
            <Button
              size="lg"
              intent="ai"
              emphasis="primary"
              leadingIcon={<Sparkles />}
              onClick={() => onTriage(record)}
            >
              Triage with Genie
            </Button>
          )}
        </div>
        <div className="aegis-detail-feedback" role="status">
          {message}
        </div>
        {error && (
          <p className="aegis-detail-error" role="alert">
            {error}
          </p>
        )}
      </header>
      <Tabs
        label="Alert detail views"
        value={tab}
        onValueChange={(value) => setTab(value as 'overview' | 'signals')}
        contentClassName="aegis-detail-tab-content"
        items={[
          {
            value: 'overview',
            label: 'Overview',
            content: (
              <div className="aegis-detail-overview-grid" data-context-open={contextOpen}>
                <div className="aegis-detail-overview-main">
                  <section className="aegis-detail-description">
                    <h2>Description</h2>
                    <p>
                      {context?.description ??
                        rule?.description ??
                        `${record.source} detected ${record.title.toLowerCase()} involving ${record.entity.name}. Review the attached signals to verify the activity and determine the next action.`}
                    </p>
                  </section>
                  <section
                    className="aegis-detail-comments"
                    aria-labelledby={`comments-${record.id}`}
                  >
                    <div className="aegis-detail-section-heading">
                      <h2 id={`comments-${record.id}`}>
                        Comments <span>{comments.length}</span>
                      </h2>
                      <Button
                        size="sm"
                        emphasis="ghost"
                        leadingIcon={<ArrowUpDown />}
                        onClick={() => setNewestFirst((value) => !value)}
                        aria-label={`Sort comments: ${newestFirst ? 'newest first' : 'oldest first'}`}
                      >
                        {newestFirst ? 'Newest first' : 'Oldest first'}
                      </Button>
                    </div>
                    <form
                      className="aegis-detail-comment-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void addComment();
                      }}
                    >
                      <Textarea
                        ref={commentInput}
                        aria-label="Add a comment"
                        placeholder="Add investigation context or a handoff note…"
                        value={draft}
                        onValueChange={setDraft}
                        rows={3}
                        autoGrow
                        maxRows={7}
                        maxLength={4000}
                        disabled={adding}
                      />
                      <div>
                        <span>Comments stay with this alert.</span>
                        <Button
                          type="submit"
                          size="sm"
                          intent="function"
                          disabled={!draft.trim()}
                          loading={adding}
                        >
                          Add comment
                        </Button>
                      </div>
                    </form>
                    {orderedComments.length ? (
                      <ol className="aegis-detail-comment-list">
                        {orderedComments.map((comment) => (
                          <li key={comment.id}>
                            <Avatar
                              size="sm"
                              name={comment.author.name}
                              initials={comment.author.initials}
                            />
                            <div>
                              <div className="aegis-detail-comment-byline">
                                <strong>{comment.author.name}</strong>
                                <RelativeTime value={comment.createdAt} now={now} compact />
                              </div>
                              <p>{comment.body}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <div className="aegis-detail-no-comments">
                        <MessageSquare size={20} />
                        <span>No comments yet. Add what you know to help the next analyst.</span>
                      </div>
                    )}
                  </section>
                </div>
                <Card
                  elevation="flat"
                  className="aegis-detail-context"
                  data-collapsed={!contextOpen}
                  aria-labelledby={`${contextId}-heading`}
                >
                  <header className="aegis-detail-context-header">
                    <h2 id={`${contextId}-heading`}>Context</h2>
                    <IconButton
                      size="sm"
                      emphasis="ghost"
                      className="aegis-detail-context-toggle"
                      aria-label={contextOpen ? 'Collapse context panel' : 'Expand context panel'}
                      aria-expanded={contextOpen}
                      aria-controls={contextId}
                      onClick={() => setContextOpen((open) => !open)}
                    >
                      {contextOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
                    </IconButton>
                  </header>
                  <div id={contextId} hidden={!contextOpen}>
                    <DetailFacts>
                      <DetailFact label="Classification">
                        {context?.classification ?? record.mitre.name}
                      </DetailFact>
                      <DetailFact label="Detection rule">
                        <span>{rule?.name ?? record.title}</span>
                        <code>{record.ruleId}</code>
                      </DetailFact>
                      <DetailFact label="Run as">
                        {context?.runAs ??
                          textValue(record.events[0]?.payload.user_name) ??
                          record.events[0]?.user ??
                          record.entity.name}
                      </DetailFact>
                      <DetailFact label="Source">{record.source}</DetailFact>
                      <DetailFact label="First detected">
                        <RelativeTime value={record.firstSeen} now={now} />
                      </DetailFact>
                      <DetailFact label="Last detected">
                        <RelativeTime value={record.lastSeen} now={now} />
                      </DetailFact>
                      <DetailFact label="Created at">
                        <RelativeTime value={record.createdAt ?? record.firstSeen} now={now} />
                      </DetailFact>
                      <DetailFact label="Updated at">
                        <RelativeTime value={record.updatedAt ?? record.lastSeen} now={now} />
                      </DetailFact>
                      {context?.ruleVersion && (
                        <DetailFact label="Rule version">{context.ruleVersion}</DetailFact>
                      )}
                    </DetailFacts>
                  </div>
                </Card>
              </div>
            ),
          },
          {
            value: 'signals',
            label: (
              <span className="aegis-detail-tab-label">
                Signals <span>{signals.length}</span>
              </span>
            ),
            content: (
              <div className="aegis-detail-signals-layout" data-inspecting={!!activeSignal}>
                <section className="aegis-detail-signals" aria-label="Alert signals">
                  <div className="aegis-detail-signals-toolbar">
                    <SearchInput
                      aria-label="Search signals"
                      placeholder="Search signals, rules, or IDs…"
                      value={query}
                      onValueChange={setQuery}
                    />
                    <span role="status">
                      {filteredSignals.length} of {signals.length} signals
                    </span>
                  </div>
                  <div
                    className="aegis-detail-table-scroll"
                    role="region"
                    aria-label="Signals table"
                    tabIndex={0}
                  >
                    <table
                      className="aegis-detail-signals-table"
                      aria-label={`Signals for ${record.id}`}
                    >
                      <thead>
                        <tr>
                          <th scope="col">Signal</th>
                          <th scope="col">Severity</th>
                          <th scope="col" aria-sort={eventNewestFirst ? 'descending' : 'ascending'}>
                            <button
                              type="button"
                              onClick={() => setEventNewestFirst((value) => !value)}
                            >
                              <ArrowUpDown size={14} /> Event time
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSignals.map((signal) => (
                          <tr key={signal.id} data-selected={signal.id === selectedSignal}>
                            <td>
                              <button
                                type="button"
                                className="aegis-detail-signal-link"
                                aria-expanded={signal.id === selectedSignal}
                                onClick={(event) => {
                                  signalTrigger.current = event.currentTarget;
                                  setSelectedSignal(signal.id);
                                }}
                              >
                                <strong>{signal.title}</strong>
                                <span>{signal.ruleName}</span>
                                <code>{signal.id}</code>
                              </button>
                            </td>
                            <td>
                              <SeverityBadge severity={signal.severity} />
                            </td>
                            <td>
                              <RelativeTime value={signal.eventTime} now={now} compact />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!filteredSignals.length && (
                      <EmptyState
                        compact
                        preset={signals.length ? 'no-results' : 'no-data'}
                        title={
                          signals.length ? 'No signals match your search' : 'No signals attached'
                        }
                        description={
                          signals.length
                            ? 'Try a signal title, rule name, or event ID.'
                            : 'Evidence will appear here when attached to this alert.'
                        }
                      />
                    )}
                  </div>
                </section>
                {activeSignal && (
                  <SignalInspector signal={activeSignal} now={now} onClose={closeSignal} />
                )}
              </div>
            ),
          },
        ]}
      />
    </article>
  );
}
/** Full-page triage workspace. The legacy AlertDetailSheet remains available independently. */
export function AlertDetailPage(props: AlertDetailPageProps) {
  return <DetailPage key={props.alert.id} {...props} />;
}
