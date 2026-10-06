import { useMemo, useRef, useState } from 'react';
import { RotateCcw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/button';
import { Kbd } from '@/components/kbd';
import { Select } from '@/components/select';
import { Separator } from '@/components/separator';
import { AlertsExplorer } from '@/patterns/alerts-explorer';
import { AlertDetailSheet } from '@/patterns/alert-detail-sheet';
import { AiPanel } from '@/patterns/ai-panel';
import { applyAlertFilters, createDefaultFilters } from '@/lib/filters';
import type { AiContextItem, AiRequest } from '@/lib/ai';
import {
  alerts as fixtures,
  analysts,
  generateAlerts,
  referenceTime,
  rules,
  type Alert,
} from '@/sample-data';
import type { GridDensity } from './data-grid';

const largeDataset = generateAlerts(1000, 2026);
type PresentationState = 'ready' | 'loading' | 'empty' | 'error';
type PresentationMode = 'pages' | 'virtual';
export interface DataGridPresentationProps {
  initialCount?: 150 | 1000;
  initialMode?: PresentationMode;
}
const contextFor = (alert: Alert): AiContextItem => ({
  id: alert.id,
  label: `${alert.id} · ${alert.title}`,
  kind: 'alert',
  description: `${alert.severity} severity; ${alert.status}; ${alert.eventCount} events; ${alert.entity.name}; ${alert.source}; ${alert.mitre.id}`,
});

/** A complete local investigation using the same filters and actions as the SIEM console. */
export function DataGridPresentation({
  initialCount = 150,
  initialMode = 'pages',
}: DataGridPresentationProps) {
  const [count, setCount] = useState<150 | 1000>(initialCount);
  const [records, setRecords] = useState(initialCount === 1000 ? largeDataset : fixtures);
  const [mode, setMode] = useState<PresentationMode>(initialMode);
  const [state, setState] = useState<PresentationState>('ready');
  const [density, setDensity] = useState<GridDensity>('default');
  const [filters, setFilters] = useState(createDefaultFilters);
  const [selected, setSelected] = useState<Alert[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const [aiOpen, setAiOpen] = useState(false);
  const [request, setRequest] = useState<AiRequest>();
  const [context, setContext] = useState<AiContextItem[]>([]);
  const [session, setSession] = useState(0);
  const [notice, setNotice] = useState('Changes stay in this local demo.');
  const requestSequence = useRef(0);
  const visible = useMemo(
    () => applyAlertFilters(records, filters, referenceTime),
    [records, filters],
  );
  const activeAlert = records.find((record) => record.id === activeId);

  function reset(nextCount = count, nextMode = mode) {
    setCount(nextCount);
    setRecords(nextCount === 1000 ? largeDataset : fixtures);
    setMode(nextMode);
    setState('ready');
    setDensity('default');
    setFilters(createDefaultFilters());
    setSelected([]);
    setActiveId(undefined);
    setAiOpen(false);
    setRequest(undefined);
    setContext([]);
    setSession((value) => value + 1);
    setNotice('Changes stay in this local demo.');
  }
  function updateRecords(next: Alert[]) {
    const changed = next.filter((record, index) => record !== records[index]).length;
    setRecords(next);
    setSelected((previous) =>
      next.filter((record) => previous.some((item) => item.id === record.id)),
    );
    setNotice(
      `${changed} ${changed === 1 ? 'alert updated' : 'alerts updated'} in this local demo.`,
    );
  }
  function explain(alerts: Alert[]) {
    const next = alerts.map(contextFor);
    setActiveId(undefined);
    setContext(next);
    setRequest({
      id: `grid-investigation-${++requestSequence.current}`,
      prompt:
        alerts.length === 1
          ? 'Explain this alert, summarize the supporting evidence, and suggest what to investigate next.'
          : 'Summarize these selected alerts, identify shared signals, and suggest a triage order.',
      context: next,
    });
    setAiOpen(true);
  }
  return (
    <main
      style={{ padding: 'var(--space-5)', display: 'grid', gap: 'var(--space-4)', minWidth: 0 }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div className="row" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <ShieldAlert
              size={21}
              style={{ color: 'var(--color-function-fg)' }}
              aria-hidden="true"
            />
            <h1 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 600 }}>
              Alert investigation workspace
            </h1>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: 'var(--text-sm)' }}>
            Narrow the evidence, triage selected alerts, and open a complete investigation.
          </p>
        </div>
        <Button
          emphasis="soft"
          size="sm"
          leadingIcon={<RotateCcw size={14} />}
          onClick={() => reset()}
        >
          Restore demo
        </Button>
      </header>

      <section
        aria-label="Presentation options"
        className="surface"
        style={{
          display: 'flex',
          alignItems: 'end',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
          padding: 'var(--space-3) var(--space-4)',
        }}
      >
        <Select
          label="Demo records"
          size="sm"
          value={String(count)}
          options={[
            { value: '150', label: '150 security alerts' },
            { value: '1000', label: '1,000 security alerts' },
          ]}
          onValueChange={(next) => reset(next === '1000' ? 1000 : 150)}
        />
        <Select
          label="Browsing mode"
          size="sm"
          value={mode}
          options={[
            { value: 'pages', label: 'Paginated results' },
            { value: 'virtual', label: 'Continuous virtual scrolling' },
          ]}
          onValueChange={(next) => {
            setMode(next as PresentationMode);
          }}
        />
        <Select
          label="Result state"
          size="sm"
          value={state}
          options={[
            { value: 'ready', label: 'Ready' },
            { value: 'loading', label: 'Loading skeletons' },
            { value: 'empty', label: 'No matching alerts' },
            { value: 'error', label: 'Connection error' },
          ]}
          onValueChange={(next) => {
            setState(next as PresentationState);
            setSelected([]);
            setSession((value) => value + 1);
          }}
        />
        <div
          role="status"
          aria-live="polite"
          style={{
            marginLeft: 'auto',
            paddingBottom: 'var(--space-1)',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--text-xs)',
          }}
        >
          {state === 'empty' ? 0 : visible.length.toLocaleString()} matching alerts
          <Separator
            variant="dot"
            style={{ margin: '0 var(--space-2)', verticalAlign: 'middle' }}
          />
          {selected.length} selected
        </div>
      </section>

      <AlertsExplorer
        key={session}
        alerts={state === 'empty' ? [] : records}
        analysts={analysts}
        onAlertsChange={updateRecords}
        filters={filters}
        onFiltersChange={setFilters}
        now={referenceTime}
        onOpenAlert={(alert) => {
          setAiOpen(false);
          setActiveId(alert.id);
        }}
        onAskAi={explain}
        onSelectionChange={setSelected}
        defaultPanelOpen
        density={density}
        onDensityChange={setDensity}
        pagination={mode === 'pages'}
        virtualize={mode === 'virtual'}
        height={560}
        loading={state === 'loading'}
        error={
          state === 'error'
            ? 'The event service could not be reached. Retry to restore the same investigation.'
            : undefined
        }
        onRetry={() => {
          setState('ready');
          setNotice('Connection restored. Your filters and alerts are preserved.');
        }}
      />

      <footer
        style={{
          display: 'grid',
          gap: 'var(--space-2)',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-xs)',
        }}
      >
        <p style={{ margin: 0 }} role="status">
          {notice}
        </p>
        <details>
          <summary
            style={{ cursor: 'pointer', color: 'var(--color-text-primary)', fontWeight: 500 }}
          >
            Explore every table interaction
          </summary>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 'var(--space-4)',
              paddingTop: 'var(--space-3)',
            }}
          >
            <p style={{ margin: 0 }}>
              <strong>Filter with saved views</strong>
              <br />
              Use search, time range, saved views, quick chips, or Add filter. The push panel shares
              the same severity, status, source and assignee filters. Remove a chip to update both
              views.
            </p>
            <p style={{ margin: 0 }}>
              <strong>Shape the table</strong>
              <br />
              Use the density and column controls above the grid. Click a column to sort;{' '}
              <Kbd>Shift</Kbd> + click adds another sort. Drag a header divider or double-click it
              to fit its contents.
            </p>
            <p style={{ margin: 0 }}>
              <strong>Investigate and triage</strong>
              <br />
              Expand a row for event evidence and raw JSON. Open a row for details, rule YAML and
              editing. Select records to assign an analyst, change status, or ask AI for a grounded
              summary.
            </p>
            <p style={{ margin: 0 }}>
              <strong>Work from the keyboard</strong>
              <br />
              <Kbd>↑</Kbd> <Kbd>↓</Kbd> move through rows; <Kbd>Space</Kbd> selects;{' '}
              <Kbd>Enter</Kbd> opens details. <Kbd>←</Kbd> <Kbd>→</Kbd> expand or collapse a row, or
              resize a focused header divider.
            </p>
          </div>
        </details>
      </footer>
      <AlertDetailSheet
        alert={activeAlert}
        alerts={visible}
        analysts={analysts}
        rules={rules}
        now={referenceTime}
        open={!!activeAlert}
        onOpenChange={(open) => {
          if (!open) setActiveId(undefined);
        }}
        onNavigate={(alert) => setActiveId(alert.id)}
        onUpdate={(alert) =>
          updateRecords(records.map((record) => (record.id === alert.id ? alert : record)))
        }
        onExplain={(alert) => explain([alert])}
      />
      <AiPanel
        key={`assistant-${session}`}
        open={aiOpen}
        onOpenChange={setAiOpen}
        context={context}
        request={request}
        scopeLabel="Selected grid evidence"
        availableContext={visible.map(contextFor)}
        onEvidenceClick={(item) => {
          if (records.some((record) => record.id === item.id)) {
            setAiOpen(false);
            setActiveId(item.id);
          }
        }}
      />
    </main>
  );
}
