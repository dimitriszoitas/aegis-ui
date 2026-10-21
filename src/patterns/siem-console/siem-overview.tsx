import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, ShieldCheck, Sparkles } from '@/components/icon';
import { Button } from '@/components/button';
import { IconButton } from '@/components/icon-button';
import { ChartMetricCard, MetricCard } from '@/components/metric-card';
import { SeverityBadge } from '@/components/severity-badge';
import { Tag, type TagProps } from '@/components/tag';
import { DataGrid } from '@/components/data-grid';
import { EmptyState } from '@/components/empty-state';
import { TimeRangePicker, type TimeRange } from '@/components/time-range-picker';
import type { Alert } from '@/sample-data';
import { siemExampleTime, siemSystemErrors, siemStateLabels } from '@/sample-data/siem-example';
import { getOverviewActivity } from './siem-overview-activity';
import './siem-example.css';

const detectionWeeklyDelta = 364.3;

const alertStateIntents: Record<Alert['status'], NonNullable<TagProps['intent']>> = {
  new: 'function',
  triaged: 'default',
  'in-progress': 'warning',
  resolved: 'success',
  'false-positive': 'default',
};
function systemStateIntent(state: string): TagProps['intent'] {
  if (['closed', 'resolved'].includes(state.toLowerCase())) return 'success';
  if (state.toLowerCase() === 'retrying') return 'warning';
  return 'function';
}

export function SiemSystemErrors() {
  return (
    <EmptyState
      className="siem-system-errors-empty"
      preset="no-data"
      icon={<ShieldCheck size={25} />}
      title="No system errors"
      description="Collection and processing issues will appear here when they need your attention."
    />
  );
}
export interface SiemOverviewProps {
  alerts: Alert[];
  onOpenAlert: (alert: Alert) => void;
  onShowAlerts: () => void;
  onShowSystemErrors?: () => void;
  onAskAi: (prompt: string) => void;
}
export function SiemOverview({
  alerts,
  onOpenAlert,
  onShowAlerts,
  onShowSystemErrors,
  onAskAi,
}: SiemOverviewProps) {
  const [prompt, setPrompt] = useState('');
  const [activityRange, setActivityRange] = useState<TimeRange>({ mode: 'relative', preset: '7d' });
  const activity = getOverviewActivity(activityRange);
  const ingestedTotal = activity.ingestion.reduce((sum, datum) => sum + datum.value, 0);
  const detectionTotal = activity.detection.reduce((sum, datum) => sum + datum.value, 0);
  const queuesRef = useRef<HTMLDivElement>(null);
  const [nameWidth, setNameWidth] = useState(260);
  useLayoutEffect(() => {
    const section = queuesRef.current?.firstElementChild;
    if (!section) return;
    const observer = new ResizeObserver(([entry]) => {
      setNameWidth(Math.max(160, Math.floor(entry.contentRect.width) - 248));
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  const active = alerts.filter((a) => !['resolved', 'false-positive'].includes(a.status));
  const urgent = active
    .filter((a) => ['critical', 'high'].includes(a.severity))
    .sort((a, b) => Date.parse(b.lastSeen) - Date.parse(a.lastSeen))
    .slice(0, 5);
  const errorSources = new Set(siemSystemErrors.map((error) => error.source)).size;
  const unassigned = active.filter((alert) => !alert.assignee).length;
  return (
    <div className="siem-overview">
      <form
        className="siem-genie-prompt"
        onSubmit={(event) => {
          event.preventDefault();
          if (prompt.trim()) {
            onAskAi(prompt.trim());
            setPrompt('');
          }
        }}
      >
        <Sparkles size={20} />
        <input
          className="siem-genie-input"
          type="text"
          aria-label="Ask Genie"
          placeholder="Ask Genie about your environment…"
          value={prompt}
          onChange={(event) => setPrompt(event.currentTarget.value)}
        />
        <IconButton
          className="siem-genie-submit"
          aria-label="Ask Genie"
          intent="ai"
          emphasis="secondary"
          type="submit"
          disabled={!prompt.trim()}
        >
          <ArrowRight size={18} />
        </IconButton>
      </form>
      <section aria-labelledby="siem-activity-title">
        <div className="siem-section-heading">
          <h2 id="siem-activity-title">Data and detection activity</h2>
          <TimeRangePicker
            label="Activity time range"
            value={activityRange}
            onValueChange={setActivityRange}
            now={siemExampleTime}
          />
          <p className="siem-activity-coverage" role="status">
            {activity.emptyMessage ?? activity.coverageLabel}
          </p>
        </div>
        <div className="siem-overview-charts">
          <ChartMetricCard
            className="siem-overview-chart-card"
            label="Events ingested"
            metric={activity.ingestion.length ? ingestedTotal : '—'}
            data={activity.ingestion}
            period={activity.periodLabel}
            height={144}
          />
          <ChartMetricCard
            className="siem-overview-chart-card"
            label="Detection signals"
            metric={activity.detection.length ? detectionTotal : '—'}
            delta={activity.isFullWeek ? detectionWeeklyDelta : undefined}
            trendIsPositive
            data={activity.detection}
            period={activity.periodLabel}
            height={144}
          />
        </div>
      </section>
      <div className="siem-overview-queues" ref={queuesRef}>
        <section className="siem-overview-queue" aria-labelledby="siem-security-alerts-title">
          <div className="siem-overview-section-heading">
            <h2 id="siem-security-alerts-title">Alerts</h2>
            <Button
              size="sm"
              emphasis="ghost"
              trailingIcon={<ArrowRight size={15} />}
              onClick={onShowAlerts}
            >
              View all active
            </Button>
          </div>
          <div className="siem-overview-metrics">
            <MetricCard label="Open" value={active.length} />
            <MetricCard label="Unassigned" value={unassigned} />
          </div>
          <DataGrid
            className="siem-overview-table"
            label="Latest high and critical alerts"
            noun="alerts"
            data={urgent}
            getRowId={(alert) => alert.id}
            rowLabel={(alert) => alert.title}
            onRowClick={onOpenAlert}
            density="default"
            enableSelection={false}
            height="auto"
            pagination={false}
            renderToolbar={() => null}
            emptyTitle="No high or critical alerts"
            emptyDescription="The current queue has no active high-priority investigations."
            columns={[
              {
                accessorKey: 'title',
                header: 'Name',
                size: nameWidth,
                minSize: 160,
                enableHiding: false,
                enablePinning: false,
                cell: ({ row }) => <span title={row.original.title}>{row.original.title}</span>,
              },
              {
                accessorKey: 'severity',
                header: 'Severity',
                size: 128,
                minSize: 128,
                enableHiding: false,
                enablePinning: false,
                cell: ({ row }) => <SeverityBadge severity={row.original.severity} />,
              },
              {
                accessorKey: 'status',
                header: 'Status',
                size: 120,
                minSize: 112,
                enableHiding: false,
                enablePinning: false,
                cell: ({ row }) => (
                  <Tag
                    variant="status"
                    intent={alertStateIntents[row.original.status]}
                    dotColor={
                      row.original.status === 'triaged'
                        ? 'var(--color-status-triaged-fg)'
                        : undefined
                    }
                  >
                    {siemStateLabels[row.original.status]}
                  </Tag>
                ),
              },
            ]}
          />
        </section>
        <section className="siem-overview-errors" aria-labelledby="siem-system-errors-title">
          <div className="siem-overview-section-heading">
            <h2 id="siem-system-errors-title">System errors</h2>
            {onShowSystemErrors && (
              <Button
                size="sm"
                emphasis="ghost"
                trailingIcon={<ArrowRight size={15} />}
                onClick={onShowSystemErrors}
              >
                View all errors
              </Button>
            )}
          </div>
          <div className="siem-overview-metrics">
            <MetricCard label="Issues" value={siemSystemErrors.length} />
            <MetricCard label="Sources" value={errorSources} />
          </div>
          <DataGrid
            className="siem-overview-table siem-overview-system-table"
            label="Latest system errors"
            noun="errors"
            data={siemSystemErrors}
            getRowId={(error) => error.id}
            density="default"
            enableSelection={false}
            height="auto"
            pagination={false}
            renderToolbar={() => null}
            columns={[
              {
                accessorKey: 'source',
                header: 'Source',
                size: nameWidth,
                minSize: 160,
                enableHiding: false,
                enablePinning: false,
                cell: ({ row }) => (
                  <span
                    className="siem-overview-source-issue"
                    title={`${row.original.source}: ${row.original.message}`}
                  >
                    <strong>{row.original.source}</strong>
                    <span aria-hidden="true">·</span>
                    <span>{row.original.message}</span>
                  </span>
                ),
              },
              {
                accessorKey: 'severity',
                header: 'Severity',
                size: 128,
                minSize: 128,
                enableHiding: false,
                enablePinning: false,
                cell: ({ row }) => <SeverityBadge severity={row.original.severity} />,
              },
              {
                accessorKey: 'state',
                header: 'Status',
                size: 120,
                minSize: 112,
                enableHiding: false,
                enablePinning: false,
                cell: ({ row }) => (
                  <Tag variant="status" intent={systemStateIntent(row.original.state)}>
                    {row.original.state}
                  </Tag>
                ),
              },
            ]}
          />
        </section>
      </div>
    </div>
  );
}
