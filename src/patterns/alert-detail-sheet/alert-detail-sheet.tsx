import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, Pencil, Sparkles } from 'lucide-react';
import { SideSheet, SideSheetField, SideSheetSection } from '@/components/side-sheet';
import { Modal } from '@/components/modal';
import { Button } from '@/components/button';
import { Tabs } from '@/components/tabs';
import { SeverityBadge } from '@/components/severity-badge';
import { StatusBadge, statusLabels, type AlertStatus } from '@/components/status-badge';
import { Tag } from '@/components/tag';
import { RelativeTime } from '@/components/relative-time';
import { Timeline, type TimelineEntry } from '@/components/timeline';
import { YamlPresenter } from '@/components/yaml-presenter';
import { AiCard } from '@/components/ai-card';
import { EmptyState } from '@/components/empty-state';
import { Select } from '@/components/select';
import { Textarea } from '@/components/textarea';
import { Field } from '@/components/field';
import { CopyButton } from '@/components/copy-button';
import { AlertEventsTable } from '@/patterns/alerts-explorer';
import type { Alert, Analyst, DetectionRule } from '@/sample-data';
import { cn } from '@/lib/utils';
import './alert-detail-sheet.css';

export type AlertDetailTab = 'overview' | 'events' | 'rule';
export interface AlertDetailSheetProps {
  /** The latest record is canonical; alerts supplies only the filtered navigation order. */
  alert?: Alert;
  alerts: Alert[];
  analysts: Analyst[];
  rules?: DetectionRule[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (alert: Alert) => void;
  onUpdate?: (alert: Alert) => void | Promise<void>;
  onOpenInvestigation?: (alert: Alert) => void;
  onExplain?: (alert: Alert) => void;
  now?: Date | number;
  defaultTab?: AlertDetailTab;
  className?: string;
}
const unassigned = '__aegis_unassigned__';
const statusOptions = (Object.keys(statusLabels) as AlertStatus[]).map((value) => ({
  value,
  label: statusLabels[value],
}));
function AlertEditor({
  alert,
  analysts,
  onSave,
  onClose,
}: {
  alert: Alert;
  analysts: Analyst[];
  onSave: (alert: Alert) => void | Promise<void>;
  onClose: () => void;
}) {
  const [status, setStatus] = useState(alert.status);
  const [assigneeId, setAssigneeId] = useState(alert.assignee?.id ?? unassigned);
  const [note, setNote] = useState(alert.analystNote ?? '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const mounted = useRef(true);
  const formId = useId();
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const choices =
    alert.assignee && !analysts.some((analyst) => analyst.id === alert.assignee?.id)
      ? [alert.assignee, ...analysts]
      : analysts;
  const dirty =
    status !== alert.status ||
    assigneeId !== (alert.assignee?.id ?? unassigned) ||
    note.trim() !== (alert.analystNote ?? '').trim();
  async function save() {
    if (submitting.current || !dirty) return;
    submitting.current = true;
    setPending(true);
    setError('');
    try {
      await onSave({
        ...alert,
        status,
        assignee:
          assigneeId === unassigned
            ? undefined
            : choices.find((analyst) => analyst.id === assigneeId),
        analystNote: note.trim() || undefined,
      });
      if (mounted.current) onClose();
    } catch (cause) {
      if (mounted.current)
        setError(
          cause instanceof Error
            ? cause.message
            : 'The alert could not be saved. Your changes are preserved.',
        );
    } finally {
      submitting.current = false;
      if (mounted.current) setPending(false);
    }
  }
  return (
    <Modal
      open
      onOpenChange={(next) => {
        if (!next && !submitting.current) onClose();
      }}
      title={`Edit ${alert.id}`}
      description="Update the triage status, assign an analyst, and record your investigation note."
      size="sm"
      showClose={!pending}
      closeOnOutsideClick={false}
      footer={
        <>
          <Button emphasis="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={pending} disabled={!dirty} intent="function">
            Save changes
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className="aegis-alert-editor"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <Field label="Status" disabled={pending}>
          <Select
            value={status}
            options={statusOptions}
            onValueChange={(next) => {
              if (next in statusLabels) setStatus(next as AlertStatus);
            }}
          />
        </Field>
        <Field label="Assignee" disabled={pending}>
          <Select
            value={assigneeId}
            onValueChange={setAssigneeId}
            options={[
              { value: unassigned, label: 'Unassigned' },
              ...choices.map((analyst) => ({
                value: analyst.id,
                label: analyst.name,
                description: analyst.role,
              })),
            ]}
          />
        </Field>
        <Field
          label="Analyst note"
          optional
          disabled={pending}
          helpText="Record evidence and the next investigation step. This note stays with the alert."
        >
          <Textarea
            value={note}
            onValueChange={setNote}
            autoGrow
            rows={4}
            maxRows={8}
            maxLength={2000}
            showCount
            placeholder="What did you verify, and what should the next analyst check?"
          />
        </Field>
        {error && (
          <p className="aegis-alert-editor-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
function AlertOverview({ alert, now }: { alert: Alert; now?: Date | number }) {
  const timeline: TimelineEntry[] = [
    {
      id: `${alert.id}-detected`,
      type: 'detection' as const,
      title: 'Alert detected',
      description: `${alert.source} · ${alert.mitre.id} ${alert.mitre.name}`,
      timestamp: alert.firstSeen,
    },
    ...alert.events.map((event) => ({
      id: event.id,
      type: 'event' as const,
      title: event.action,
      description: `${event.host} · ${event.sourceIp} → ${event.destinationIp}`,
      timestamp: event.timestamp,
    })),
  ].sort((left, right) => +new Date(left.timestamp) - +new Date(right.timestamp));
  return (
    <div className="aegis-alert-overview">
      <SideSheetSection title="Triage details">
        <SideSheetField label="Severity">
          <SeverityBadge severity={alert.severity} />
        </SideSheetField>
        <SideSheetField label="Status">
          <StatusBadge status={alert.status} />
        </SideSheetField>
        <SideSheetField label="Assignee">{alert.assignee?.name ?? 'Unassigned'}</SideSheetField>
        <SideSheetField label="Entity">
          <div className="aegis-alert-entity">
            <code>{alert.entity.name}</code>
            <span>{alert.entity.detail}</span>
          </div>
        </SideSheetField>
        <SideSheetField label="MITRE ATT&CK">
          <span className="aegis-alert-technique">
            <code>{alert.mitre.id}</code>
            {alert.mitre.name}
          </span>
        </SideSheetField>
        <SideSheetField label="Source">{alert.source}</SideSheetField>
        <SideSheetField label="Observed events">{alert.eventCount.toLocaleString()}</SideSheetField>
        <SideSheetField label="First seen">
          <RelativeTime value={alert.firstSeen} now={now} />
        </SideSheetField>
        <SideSheetField label="Last seen">
          <RelativeTime value={alert.lastSeen} now={now} />
        </SideSheetField>
        <SideSheetField label="Tags">
          <div className="aegis-alert-tags">
            {alert.tags.length ? (
              alert.tags.map((tag) => (
                <Tag key={tag} size="sm">
                  {tag}
                </Tag>
              ))
            ) : (
              <span>No tags</span>
            )}
          </div>
        </SideSheetField>
      </SideSheetSection>
      {alert.analystNote && (
        <SideSheetSection title="Analyst note">
          <p className="aegis-alert-note">{alert.analystNote}</p>
        </SideSheetSection>
      )}
      <AiCard
        title="Suggested triage summary"
        confidence={
          alert.aiVerdict.confidence >= 0.85
            ? 'high'
            : alert.aiVerdict.confidence >= 0.6
              ? 'medium'
              : 'low'
        }
        provenance={`Fixture suggestion · ${alert.id} · analyst review required`}
      >
        <p>
          <strong>{alert.aiVerdict.verdict}</strong>
        </p>
        <p>
          Review the {alert.source} evidence for <code>{alert.entity.name}</code> and validate the
          observed {alert.mitre.name.toLowerCase()} activity before changing the alert verdict.
        </p>
      </AiCard>
      <SideSheetSection title="Observed activity">
        <Timeline items={timeline} now={now} label={`Observed activity for ${alert.id}`} />
      </SideSheetSection>
    </div>
  );
}
function DetailContent({
  alert,
  analysts,
  rules,
  now,
  defaultTab,
  editing,
  onEditClose,
  onUpdate,
}: {
  alert: Alert;
  analysts: Analyst[];
  rules?: DetectionRule[];
  now?: Date | number;
  defaultTab: AlertDetailTab;
  editing: boolean;
  onEditClose: () => void;
  onUpdate?: (alert: Alert) => void | Promise<void>;
}) {
  const [tab, setTab] = useState<AlertDetailTab>(defaultTab);
  const rule = rules?.find((item) => item.id === alert.ruleId);
  return (
    <>
      <Tabs
        label={`Views for ${alert.id}`}
        value={tab}
        onValueChange={(next) => setTab(next as AlertDetailTab)}
        items={[
          {
            value: 'overview',
            label: 'Overview',
            content: <AlertOverview alert={alert} now={now} />,
          },
          {
            value: 'events',
            label: `Events (${alert.events.length})`,
            content: alert.events.length ? (
              <AlertEventsTable alert={alert} now={now} />
            ) : (
              <EmptyState
                compact
                preset="no-data"
                title="No evidence events attached"
                description="Original event records will appear here when they are available."
              />
            ),
          },
          {
            value: 'rule',
            label: 'Rule',
            content: rule ? (
              <div className="aegis-alert-rule">
                <h3>{rule.name}</h3>
                <p>{rule.description}</p>
                <div className="aegis-alert-rule-meta">
                  <Tag size="sm">{rule.source}</Tag>
                  <Tag size="sm">{rule.technique}</Tag>
                  <code>{rule.id}</code>
                </div>
                <YamlPresenter
                  value={rule.yaml}
                  filename={`${rule.id}.yaml`}
                  label={`Detection rule ${rule.name}`}
                  wrapLines
                  maxHeight={520}
                />
              </div>
            ) : (
              <EmptyState
                compact
                preset="no-data"
                title="Detection rule unavailable"
                description={`Rule ${alert.ruleId} is not included in this view.`}
              />
            ),
          },
        ]}
      />
      {editing && onUpdate && (
        <AlertEditor alert={alert} analysts={analysts} onSave={onUpdate} onClose={onEditClose} />
      )}
    </>
  );
}
/** A canonical alert with filtered-list navigation and explicit analyst mutations. */
export function AlertDetailSheet({
  alert,
  alerts,
  analysts,
  rules,
  open,
  onOpenChange,
  onNavigate,
  onUpdate,
  onOpenInvestigation,
  onExplain,
  now,
  defaultTab = 'overview',
  className,
}: AlertDetailSheetProps) {
  const [editingId, setEditingId] = useState<string>();
  const [savedId, setSavedId] = useState<string>();
  useEffect(() => {
    setEditingId(undefined);
  }, [open, alert?.id]);
  const position = alert ? alerts.findIndex((item) => item.id === alert.id) : -1;
  function changeOpen(next: boolean) {
    if (!next) setEditingId(undefined);
    onOpenChange(next);
  }
  const editing = open && editingId === alert?.id;
  return (
    <SideSheet
      open={open}
      onOpenChange={changeOpen}
      title={alert?.title ?? 'Alert details'}
      description={
        alert ? `${alert.id} · ${alert.source}` : 'Select an alert to inspect its evidence.'
      }
      size="md"
      className={cn('aegis-alert-detail', className)}
      position={position >= 0 ? position + 1 : undefined}
      total={position >= 0 ? alerts.length : undefined}
      onPrevious={
        onNavigate && position > 0
          ? () => {
              setEditingId(undefined);
              onNavigate(alerts[position - 1]);
            }
          : undefined
      }
      onNext={
        onNavigate && position >= 0 && position < alerts.length - 1
          ? () => {
              setEditingId(undefined);
              onNavigate(alerts[position + 1]);
            }
          : undefined
      }
      actions={
        alert && (
          <>
            {onUpdate && (
              <Button
                size="sm"
                emphasis="ghost"
                leadingIcon={<Pencil size={14} />}
                onClick={() => setEditingId(alert.id)}
              >
                Edit
              </Button>
            )}
            {onOpenInvestigation && (
              <Button
                size="sm"
                emphasis="soft"
                leadingIcon={<ArrowUpRight size={14} />}
                onClick={() => {
                  changeOpen(false);
                  onOpenInvestigation(alert);
                }}
              >
                Open investigation
              </Button>
            )}
          </>
        )
      }
      footer={
        alert && (
          <>
            <span className="aegis-alert-save-status" role="status">
              {savedId === alert.id ? 'Changes saved.' : ''}
            </span>
            {onExplain && (
              <Button
                size="sm"
                intent="ai"
                leadingIcon={<Sparkles size={15} />}
                onClick={() => {
                  changeOpen(false);
                  onExplain(alert);
                }}
              >
                Explain with AI
              </Button>
            )}
          </>
        )
      }
    >
      {alert ? (
        <>
          <div className="aegis-alert-detail-meta">
            <div>
              <SeverityBadge severity={alert.severity} />
              <StatusBadge status={alert.status} />
            </div>
            <CopyButton text={alert.id} aria-label={`Copy alert ID ${alert.id}`} size="sm" />
          </div>
          {position < 0 && (
            <p className="aegis-alert-outside-view">
              This alert is outside the current filtered results.
            </p>
          )}
          <DetailContent
            key={alert.id}
            alert={alert}
            analysts={analysts}
            rules={rules}
            now={now}
            defaultTab={defaultTab}
            editing={editing}
            onEditClose={() => setEditingId(undefined)}
            onUpdate={
              onUpdate
                ? async (updated) => {
                    await onUpdate(updated);
                    setSavedId(updated.id);
                  }
                : undefined
            }
          />
        </>
      ) : (
        <EmptyState
          compact
          preset="no-data"
          title="No alert selected"
          description="Choose a row in the alert list to review its details."
        />
      )}
    </SideSheet>
  );
}
