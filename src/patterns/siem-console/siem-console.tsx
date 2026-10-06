import { useCallback, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  Activity,
  FileChartColumn,
  FlaskConical,
  LayoutDashboard,
  Plus,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { Avatar } from '@/components/avatar';
import { Breadcrumb } from '@/components/breadcrumb';
import { Button } from '@/components/button';
import { CommandPalette, type CommandAction } from '@/components/command-palette';
import type { GridDensity } from '@/components/data-grid';
import { EventHistogram } from '@/components/event-histogram';
import { IconButton } from '@/components/icon-button';
import { MetricCard } from '@/components/metric-card';
import { ConfirmDialog } from '@/components/modal';
import { Separator } from '@/components/separator';
import { SideNav, type NavSection } from '@/components/side-nav';
import { Tabs } from '@/components/tabs';
import { TimeRangePicker } from '@/components/time-range-picker';
import { Toaster, showToast } from '@/components/toast';
import { Tooltip } from '@/components/tooltip';
import { AiPanel } from '@/patterns/ai-panel';
import { AlertDetailSheet } from '@/patterns/alert-detail-sheet';
import { AlertsExplorer } from '@/patterns/alerts-explorer';
import {
  ConsoleOverview,
  ConsoleIncidents,
  ConsoleHunting,
  ConsoleRules,
  ConsoleReports,
  ConsoleSettings,
} from '@/patterns/console-views';
import { DetectionRuleWizard, type CreatedDetectionRule } from '@/patterns/detection-rule-wizard';
import type { AiContextItem, AiRequest } from '@/lib/ai';
import { applyAlertFilters, createDefaultFilters, type AlertFilterState } from '@/lib/filters';
import { formatTimeRange, resolveTimeRange } from '@/lib/time-range';
import type { Theme } from '@/lib/theme';
import {
  alerts as fixtureAlerts,
  analysts,
  referenceTime,
  rules as fixtureRules,
  timeSeries,
  type Alert,
  type DetectionRule,
} from '@/sample-data';
import './siem-console.css';

export type ConsolePage =
  'overview' | 'alerts' | 'incidents' | 'hunting' | 'rules' | 'reports' | 'settings';
export interface SiemConsoleProps {
  initialPage?: ConsolePage;
  defaultNavCollapsed?: boolean;
  defaultAiOpen?: boolean;
  defaultFilterPanelOpen?: boolean;
  theme?: Theme;
  onThemeChange?: (theme: Theme) => void;
}
const pageLabels: Record<ConsolePage, string> = {
  overview: 'Overview',
  alerts: 'Alerts',
  incidents: 'Incidents',
  hunting: 'Hunting',
  rules: 'Detection rules',
  reports: 'Reports',
  settings: 'Settings',
};
const pageDescriptions: Record<ConsolePage, string> = {
  overview: 'A clear view of your security posture.',
  alerts: 'Investigate signals. Find what matters.',
  incidents: 'Follow related signals across your environment.',
  hunting: 'Explore the evidence behind every signal.',
  rules: 'Detection logic, ready for human review.',
  reports: 'Turn investigation activity into a clear handoff.',
  settings: 'Make the workspace feel right for you.',
};
function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (notify: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', notify);
      return () => media.removeEventListener('change', notify);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
function alertContext(alert: Alert): AiContextItem {
  return {
    id: alert.id,
    label: alert.id,
    kind: 'alert',
    description: `${alert.title} · ${alert.severity} · ${alert.status} · ${alert.eventCount} events`,
  };
}

/** A working local workspace. Mutations live in memory; fixture telemetry stays reproducible. */
export function SiemConsole({
  initialPage = 'alerts',
  defaultNavCollapsed = false,
  defaultAiOpen = false,
  defaultFilterPanelOpen = false,
  theme = 'light',
  onThemeChange,
}: SiemConsoleProps) {
  const compact = useMediaQuery('(max-width: 1000px)');
  const dockAssistant = useMediaQuery('(min-width: 1280px)');
  const [page, setPage] = useState<ConsolePage>(initialPage);
  const [collapsed, setCollapsed] = useState(defaultNavCollapsed);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>(() => fixtureAlerts.map((alert) => ({ ...alert })));
  const [rules, setRules] = useState<DetectionRule[]>(fixtureRules);
  const [filters, setFilters] = useState(createDefaultFilters);
  const [density, setDensity] = useState<GridDensity>('default');
  const [selected, setSelected] = useState<Alert[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [detailIds, setDetailIds] = useState<string[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(defaultAiOpen);
  const [request, setRequest] = useState<AiRequest | undefined>(() =>
    defaultAiOpen
      ? {
          id: 'initial-console-briefing',
          prompt: 'Help me prioritize these three alerts for the morning handoff.',
          context: fixtureAlerts.slice(0, 3).map(alertContext),
        }
      : undefined,
  );
  const [aiContext, setAiContext] = useState<AiContextItem[]>(() =>
    fixtureAlerts.slice(0, 3).map(alertContext),
  );
  const [commandOpen, setCommandOpen] = useState(false);
  const [creatingRule, setCreatingRule] = useState(false);
  const [wizardDirty, setWizardDirty] = useState(false);
  const [pendingPage, setPendingPage] = useState<ConsolePage>();
  const [wizardOrientation, setWizardOrientation] = useState<'horizontal' | 'vertical'>('vertical');
  const [huntQuery, setHuntQuery] = useState('');
  const contentRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mainId = useId();
  const scopeLabel = formatTimeRange(filters.timeRange);
  const scopedAlerts = useMemo(
    () =>
      applyAlertFilters(
        alerts,
        { ...createDefaultFilters(), timeRange: filters.timeRange },
        referenceTime,
      ),
    [alerts, filters.timeRange],
  );
  const filteredAlerts = useMemo(
    () => applyAlertFilters(alerts, filters, referenceTime),
    [alerts, filters],
  );
  const selectedAlert = alerts.find((alert) => alert.id === selectedId);
  const detailAlerts = detailIds.flatMap((id) => {
    const alert = alerts.find((item) => item.id === id);
    return alert ? [alert] : [];
  });
  const selectedRecords = alerts.filter((alert) => selected.some((item) => item.id === alert.id));
  const { from: trendFrom, to: trendTo } = resolveTimeRange(filters.timeRange, referenceTime);
  function metricTrend(matches: (alert: Alert) => boolean, events = false) {
    const bins = Array<number>(24).fill(0);
    const duration = Math.max(1, +trendTo - +trendFrom);
    for (const alert of scopedAlerts.filter(matches)) {
      const index = Math.min(
        23,
        Math.max(0, Math.floor(((Date.parse(alert.lastSeen) - +trendFrom) / duration) * 24)),
      );
      bins[index] += events ? alert.eventCount : 1;
    }
    return bins;
  }
  const openAlerts = scopedAlerts.filter(
    (alert) => !['resolved', 'false-positive'].includes(alert.status),
  );
  const tab =
    filters.assignees.length === 1 &&
    filters.assignees[0] === analysts[0].id &&
    filters.statuses.length === 0
      ? 'mine'
      : filters.statuses.length === 1 &&
          filters.statuses[0] === 'new' &&
          filters.assignees.length === 0
        ? 'review'
        : 'all';
  const tabScope = applyAlertFilters(
    alerts,
    { ...filters, statuses: [], assignees: [] },
    referenceTime,
  );

  function focusHeading() {
    requestAnimationFrame(() => {
      contentRef.current?.scrollTo({ top: 0 });
      headingRef.current?.focus();
    });
  }
  function performNavigation(next: ConsolePage) {
    setPage(next);
    setCreatingRule(false);
    setMobileExpanded(false);
    setSelected([]);
    focusHeading();
  }
  function navigate(next: ConsolePage) {
    if (creatingRule && wizardDirty) setPendingPage(next);
    else performNavigation(next);
  }
  function updateFilters(next: AlertFilterState) {
    setFilters(next);
    setSelected([]);
  }
  function openAlert(alert: Alert, visible: Alert[] = scopedAlerts) {
    setSelectedId(alert.id);
    setDetailIds(
      (visible.some((item) => item.id === alert.id) ? visible : [alert, ...visible]).map(
        (item) => item.id,
      ),
    );
    setDetailOpen(true);
  }
  function askAi(records: Alert[], prompt?: string) {
    const context = records.map(alertContext);
    context.push({
      id: 'current-time-range',
      kind: 'scope',
      label: scopeLabel,
      description: 'Fixture snapshot: 6 October 2026, 08:30 UTC',
    });
    setAiContext(context);
    setRequest({
      id: crypto.randomUUID(),
      prompt:
        prompt ||
        (records.length === 1
          ? `Explain ${records[0].id} and suggest the next investigation steps.`
          : `Summarize these ${records.length} alerts for an analyst handoff.`),
      context,
    });
    setDetailOpen(false);
    setAiOpen(true);
  }
  function startRule() {
    setPage('rules');
    setCreatingRule(true);
    setWizardDirty(false);
    setAiOpen(false);
    setMobileExpanded(false);
    focusHeading();
  }
  function saveRule(rule: CreatedDetectionRule) {
    setRules((current) => [...current, rule]);
    showToast({
      title: rule.enabled ? 'Detection rule enabled' : 'Detection rule saved',
      description: rule.name,
      intent: 'success',
    });
  }
  function openEvidence(item: AiContextItem) {
    const alert = alerts.find((record) => record.id === item.id);
    if (alert) {
      if (!dockAssistant) setAiOpen(false);
      openAlert(alert);
    } else if (item.kind === 'rule') navigate('rules');
  }
  const sections: NavSection[] = [
    {
      label: 'Workspace',
      items: [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard /> },
        { id: 'alerts', label: 'Alerts', icon: <ShieldAlert />, count: openAlerts.length },
        { id: 'incidents', label: 'Incidents', icon: <Activity /> },
        { id: 'hunting', label: 'Hunting', icon: <FlaskConical /> },
      ],
    },
    {
      label: 'Manage',
      items: [
        { id: 'rules', label: 'Detection rules', icon: <ShieldCheck /> },
        { id: 'reports', label: 'Reports', icon: <FileChartColumn /> },
      ],
    },
  ];
  const actions: CommandAction[] = [
    ...sections
      .flatMap((section) => section.items)
      .map((item) => ({
        id: item.id,
        label: `Go to ${item.label.toLowerCase()}`,
        group: 'Navigation',
        icon: item.icon,
        onSelect: () => navigate(item.id as ConsolePage),
      })),
    {
      id: 'create-rule',
      label: 'Create detection rule',
      group: 'Actions',
      icon: <Plus />,
      onSelect: startRule,
    },
    {
      id: 'settings',
      label: 'Workspace settings',
      group: 'Navigation',
      icon: <Settings />,
      onSelect: () => navigate('settings'),
    },
    ...alerts.slice(0, 6).map((alert) => ({
      id: alert.id,
      label: `${alert.id} · ${alert.title}`,
      keywords: [alert.entity.name, alert.mitre.id],
      group: 'Recent alerts',
      icon: <ShieldAlert />,
      onSelect: () => openAlert(alert),
    })),
  ];
  // A document-level palette must not intercept shortcuts while a modal owns focus.
  const paletteShortcut = !detailOpen && !(aiOpen && !dockAssistant) && !creatingRule;
  const alertWorkspace = (
    <AlertsExplorer
      alerts={alerts}
      analysts={analysts}
      onAlertsChange={setAlerts}
      filters={filters}
      onFiltersChange={updateFilters}
      now={referenceTime}
      onOpenAlert={openAlert}
      onAskAi={askAi}
      onSelectionChange={setSelected}
      defaultPanelOpen={defaultFilterPanelOpen}
      density={density}
      onDensityChange={setDensity}
      height={480}
    />
  );

  return (
    <div className="aegis-console" data-ai-open={aiOpen && dockAssistant}>
      <a className="aegis-console-skip" href={`#${mainId}`}>
        Skip to workspace
      </a>
      <SideNav
        sections={sections}
        activeId={page}
        onNavigate={(id) => navigate(id as ConsolePage)}
        collapsed={compact ? !mobileExpanded : collapsed}
        onCollapsedChange={(next) => (compact ? setMobileExpanded(!next) : setCollapsed(next))}
        onSearch={() => setCommandOpen(true)}
        footer={(small) => (
          <>
            <Tooltip content="Workspace settings">
              <button
                type="button"
                className={`nav-item ${small ? 'nav-icon' : ''} ${page === 'settings' ? 'is-active' : ''}`}
                aria-label={small ? 'Workspace settings' : undefined}
                aria-current={page === 'settings' ? 'page' : undefined}
                onClick={() => navigate('settings')}
              >
                <Settings size={17} />
                {!small && <span>Settings</span>}
              </button>
            </Tooltip>
            <div className="aegis-console-user">
              <Avatar
                name={analysts[0].name}
                initials={analysts[0].initials}
                size="sm"
                status="online"
              />
              {!small && (
                <div>
                  <strong>{analysts[0].name}</strong>
                  <span>Security analyst</span>
                </div>
              )}
            </div>
          </>
        )}
      />
      <main id={mainId} ref={contentRef} tabIndex={-1} className="aegis-console-main">
        <header className="aegis-console-header">
          <div className="aegis-console-breadcrumb-row">
            <Breadcrumb
              items={[
                { label: 'Northstar', onClick: () => navigate('overview') },
                { label: creatingRule ? 'Create detection rule' : pageLabels[page] },
              ]}
            />
            <span className="aegis-console-environment">
              <span />
              Demo workspace
            </span>
          </div>
          <div className="aegis-console-title-row">
            <div>
              <h1 ref={headingRef} tabIndex={-1}>
                {creatingRule ? 'Create detection rule' : pageLabels[page]}
              </h1>
              <p>
                {creatingRule
                  ? 'Define, test, and review before enabling.'
                  : pageDescriptions[page]}
              </p>
            </div>
            <div className="aegis-console-header-actions">
              {!creatingRule && page !== 'settings' && (
                <TimeRangePicker
                  value={filters.timeRange}
                  onValueChange={(timeRange) =>
                    updateFilters({ ...filters, timeRange, savedViewId: undefined })
                  }
                  now={referenceTime}
                />
              )}
              {onThemeChange && (
                <IconButton
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                  emphasis="ghost"
                  onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                </IconButton>
              )}
              <IconButton
                intent="ai"
                emphasis={aiOpen ? 'filled' : 'soft'}
                aria-label={aiOpen ? 'Close AI panel' : 'Open AI panel'}
                aria-pressed={aiOpen}
                onClick={() => {
                  if (!aiOpen && selectedRecords.length)
                    setAiContext(selectedRecords.map(alertContext));
                  setAiOpen(!aiOpen);
                }}
              >
                <Sparkles size={18} />
              </IconButton>
            </div>
          </div>
        </header>
        {creatingRule ? (
          <section className="aegis-console-wizard">
            <div className="aegis-console-wizard-toolbar">
              <span className="muted">Human review required</span>
              <div className="row">
                <Button
                  size="sm"
                  emphasis="ghost"
                  aria-pressed={wizardOrientation === 'vertical'}
                  onClick={() => setWizardOrientation('vertical')}
                >
                  Vertical
                </Button>
                <Button
                  size="sm"
                  emphasis="ghost"
                  aria-pressed={wizardOrientation === 'horizontal'}
                  onClick={() => setWizardOrientation('horizontal')}
                >
                  Horizontal
                </Button>
              </div>
            </div>
            <DetectionRuleWizard
              orientation={wizardOrientation}
              onCreate={saveRule}
              onDirtyChange={setWizardDirty}
              onCancel={() => performNavigation('rules')}
            />
          </section>
        ) : (
          <>
            {(page === 'alerts' || page === 'overview') && (
              <section
                className="aegis-console-metrics"
                aria-label="Security activity in selected time range"
              >
                <MetricCard
                  label="Open alerts"
                  value={openAlerts.length}
                  sparkline={metricTrend(
                    (alert) => !['resolved', 'false-positive'].includes(alert.status),
                  )}
                  sparklineLabel="Open alerts by last seen in the selected time range"
                />
                <MetricCard
                  label="Critical alerts"
                  value={scopedAlerts.filter((alert) => alert.severity === 'critical').length}
                  sparkline={metricTrend((alert) => alert.severity === 'critical')}
                  sparklineLabel="Critical alerts by last seen in the selected time range"
                />
                <MetricCard
                  label="Resolved alerts"
                  value={scopedAlerts.filter((alert) => alert.status === 'resolved').length}
                  sparkline={metricTrend((alert) => alert.status === 'resolved')}
                  sparklineLabel="Resolved alerts by last seen in the selected time range"
                />
                <MetricCard
                  label="Evidence events"
                  value={scopedAlerts.reduce((sum, alert) => sum + alert.eventCount, 0)}
                  sparklineVariant="bar"
                  sparkline={metricTrend(() => true, true)}
                  sparklineLabel="Evidence events by alert last seen in the selected time range"
                />
              </section>
            )}
            {page === 'alerts' && (
              <section
                className="aegis-console-alert-card"
                aria-label="Alert investigation workspace"
              >
                <div className="aegis-console-section-heading">
                  <div>
                    <h2>Alert activity</h2>
                    <div className="aegis-console-activity-meta">
                      <span>{filteredAlerts.length} matching alerts</span>
                      <Separator variant="dot" emphasis="light" />
                      <span>4 connected sources</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    emphasis="soft"
                    leadingIcon={<Plus size={15} />}
                    onClick={startRule}
                  >
                    Create rule
                  </Button>
                </div>
                <EventHistogram
                  data={timeSeries}
                  value={filters.timeRange}
                  now={referenceTime}
                  onValueChange={(timeRange) =>
                    updateFilters({ ...filters, timeRange, savedViewId: undefined })
                  }
                  brush
                  height={112}
                  title="Event volume · UTC"
                  description=""
                  className="aegis-console-histogram"
                />
                <Tabs
                  label="Alert queues"
                  value={tab}
                  onValueChange={(next) =>
                    updateFilters({
                      ...filters,
                      statuses: next === 'review' ? ['new'] : [],
                      assignees: next === 'mine' ? [analysts[0].id] : [],
                      savedViewId: undefined,
                    })
                  }
                  listClassName="aegis-console-queue-tabs"
                  sharedContent={alertWorkspace}
                  items={[
                    {
                      value: 'all',
                      label: 'All alerts',
                      count: tabScope.length,
                      content: null,
                    },
                    {
                      value: 'review',
                      label: 'Needs review',
                      count: tabScope.filter((alert) => alert.status === 'new').length,
                      content: null,
                    },
                    {
                      value: 'mine',
                      label: 'Assigned to me',
                      count: tabScope.filter((alert) => alert.assignee?.id === analysts[0].id)
                        .length,
                      content: null,
                    },
                  ]}
                />
              </section>
            )}
            {page === 'overview' && (
              <ConsoleOverview
                alerts={scopedAlerts}
                now={referenceTime}
                onOpenAlert={openAlert}
                onShowAlerts={() => navigate('alerts')}
              />
            )}
            {page === 'incidents' && (
              <ConsoleIncidents alerts={scopedAlerts} now={referenceTime} onOpenAlert={openAlert} />
            )}
            {page === 'hunting' && (
              <ConsoleHunting
                key={huntQuery}
                alerts={scopedAlerts}
                initialQuery={huntQuery}
                now={referenceTime}
                onOpenAlert={openAlert}
              />
            )}
            {page === 'rules' && <ConsoleRules rules={rules} onCreateRule={startRule} />}
            {page === 'reports' && <ConsoleReports alerts={scopedAlerts} scopeLabel={scopeLabel} />}
            {page === 'settings' && (
              <ConsoleSettings
                theme={theme}
                onThemeChange={onThemeChange}
                density={density}
                onDensityChange={setDensity}
              />
            )}
          </>
        )}
        <footer className="aegis-console-footnote">
          <ShieldCheck size={13} />
          <span>Local demo · 6 Oct 2026, 08:30 UTC</span>
          <Separator variant="dot" emphasis="light" />
          <span>Changes last for this session</span>
        </footer>
      </main>
      <AiPanel
        open={aiOpen}
        onOpenChange={setAiOpen}
        docked={dockAssistant}
        className="aegis-console-assistant"
        context={aiContext}
        availableContext={scopedAlerts.slice(0, 12).map(alertContext)}
        request={request}
        scopeLabel={scopeLabel}
        onEvidenceClick={openEvidence}
      />
      <AlertDetailSheet
        alert={selectedAlert}
        alerts={detailAlerts}
        analysts={analysts}
        rules={rules}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        now={referenceTime}
        onNavigate={(alert) => setSelectedId(alert.id)}
        onUpdate={(updated) => {
          setAlerts((current) =>
            current.map((alert) => (alert.id === updated.id ? updated : alert)),
          );
          showToast({ title: 'Alert updated', description: updated.id, intent: 'success' });
        }}
        onExplain={(alert) => askAi([alert])}
        onOpenInvestigation={(alert) => {
          setDetailOpen(false);
          setHuntQuery(alert.entity.name);
          navigate('hunting');
        }}
      />
      <CommandPalette
        actions={actions}
        open={commandOpen}
        onOpenChange={setCommandOpen}
        shortcut={paletteShortcut}
        onAskAi={(prompt) =>
          askAi(
            selectedRecords.length ? selectedRecords : filteredAlerts.slice(0, 3),
            prompt || 'Help me prioritize this alert queue.',
          )
        }
      />
      <ConfirmDialog
        open={pendingPage !== undefined}
        onOpenChange={(open) => {
          if (!open) setPendingPage(undefined);
        }}
        title="Discard detection draft?"
        description="Your rule has not been saved. Leaving this flow discards the draft and replay results."
        confirmLabel="Discard draft"
        onConfirm={() => {
          const next = pendingPage;
          setPendingPage(undefined);
          if (next) performNavigation(next);
        }}
      />
      <Toaster />
    </div>
  );
}
