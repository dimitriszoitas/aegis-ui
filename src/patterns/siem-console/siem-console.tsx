import {
  useCallback,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type Ref,
} from 'react';
import {
  CircleAlert,
  Database,
  FileCode,
  FlaskConical,
  Folder,
  LayoutDashboard,
  Plus,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from '@/components/icon';
import { Avatar } from '@/components/avatar';
import { BottomSheet } from '@/components/bottom-sheet';
import { SeverityBadge } from '@/components/severity-badge';
import { Breadcrumb } from '@/components/breadcrumb';
import { Button } from '@/components/button';
import { CommandPalette, type CommandAction } from '@/components/command-palette';
import type { GridDensity } from '@/components/data-grid';
import { EmptyState } from '@/components/empty-state';
import { ConfirmDialog } from '@/components/modal';
import { Separator } from '@/components/separator';
import { Select } from '@/components/select';
import { SideNav, type NavSection } from '@/components/side-nav';
import { TimeRangePicker } from '@/components/time-range-picker';
import { Toaster, showToast } from '@/components/toast';
import { Tooltip } from '@/components/tooltip';
import { AiPanel } from '@/patterns/ai-panel';
import { AlertDetailPage, type AlertDetailComment } from '@/patterns/alert-detail';
import { SiemAlertsTable } from './siem-alerts-table';
import { SiemOverview, SiemSystemErrors } from './siem-overview';
import { SiemSettings } from './siem-settings';
import { ConsoleDatasources } from '@/patterns/console-views/console-datasources';
import { ConsoleDetections } from '@/patterns/console-views/console-detections';
import {
  siemExampleAlerts as fixtureAlerts,
  siemExampleRules as fixtureRules,
  siemExampleTime as referenceTime,
} from '@/sample-data/siem-example';
import {
  ConsoleIncidents,
  ConsoleHunting,
  ConsoleReports,
  ConsoleSettings,
} from '@/patterns/console-views';
import { DetectionRuleWizard, type CreatedDetectionRule } from '@/patterns/detection-rule-wizard';
import type { AiContextItem, AiRequest } from '@/lib/ai';
import { applyAlertFilters, createDefaultFilters, type AlertFilterState } from '@/lib/filters';
import { formatTimeRange } from '@/lib/time-range';
import type { Theme } from '@/lib/theme';
import { type LayoutTheme } from '@/lib/layout-theme';
import { analysts, type Alert, type DetectionRule } from '@/sample-data';
import './siem-console.css';

export type ConsolePage =
  | 'overview'
  | 'alerts'
  | 'system-errors'
  | 'hunting'
  | 'datasources'
  | 'rules'
  | 'content-library'
  | 'parsers'
  | 'settings'
  | 'incidents'
  | 'reports';
type ConsoleDestination = ConsolePage | 'genie';
export interface SiemConsoleProps {
  initialPage?: ConsolePage;
  defaultNavCollapsed?: boolean;
  defaultAiOpen?: boolean;
  defaultBottomOpen?: boolean;
  defaultFilterPanelOpen?: boolean;
  theme?: Theme;
  onThemeChange?: (theme: Theme) => void;
  layoutTheme?: LayoutTheme;
  onLayoutThemeChange?: (theme: LayoutTheme) => void;
}
const pageLabels: Record<ConsolePage, string> = {
  overview: 'Overview',
  alerts: 'Alerts',
  'system-errors': 'System errors',
  incidents: 'Incidents',
  hunting: 'Query',
  datasources: 'Datasources',
  rules: 'Detection rules',
  'content-library': 'Content library',
  parsers: 'Parsers',
  reports: 'Reports',
  settings: 'Settings',
};
const pageDescriptions: Record<ConsolePage, string> = {
  overview: 'A clear view of your security posture.',
  alerts: 'Investigate signals. Find what matters.',
  'system-errors': 'Inspect collection and processing issues.',
  incidents: 'Follow related signals across your environment.',
  hunting: 'Explore the evidence behind every signal.',
  datasources: 'Review the sources that bring evidence into your environment.',
  rules: 'Detection logic, ready for human review.',
  'content-library': 'Reusable investigation content for your team.',
  parsers: 'Turn incoming records into structured evidence.',
  reports: 'Turn investigation activity into a clear handoff.',
  settings: 'Make the workspace feel right for you.',
};
const emptyPages: Partial<
  Record<ConsolePage, { title: string; description: string; icon: ReactNode }>
> = {
  'content-library': {
    title: 'Your content library is not connected',
    description:
      'Saved searches and reusable investigation content are not included in this local example.',
    icon: <Folder size={25} />,
  },
  parsers: {
    title: 'Parser configuration is not connected',
    description:
      'Sample events are already structured. Managing ingestion parsers requires a connected data source.',
    icon: <FileCode size={25} />,
  },
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

interface ConsoleNavigationHandle {
  closeMobile: () => void;
}
interface ConsoleNavigationProps {
  navigationRef: Ref<ConsoleNavigationHandle>;
  sections: NavSection[];
  page: ConsolePage;
  defaultCollapsed: boolean;
  onNavigate: (page: ConsoleDestination) => void;
  onSearch: () => void;
}
/** Keep rail-only state here so toggles do not render the investigation workspace. */
function ConsoleNavigation({
  navigationRef,
  sections,
  page,
  defaultCollapsed,
  onNavigate,
  onSearch,
}: ConsoleNavigationProps) {
  const compact = useMediaQuery('(max-width: 1000px)');
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  useImperativeHandle(navigationRef, () => ({ closeMobile: () => setMobileExpanded(false) }), []);
  return (
    <SideNav
      showSearch={false}
      brandName="Lakewatch"
      brandIcon={null}
      sections={sections}
      activeId={page}
      onNavigate={(id) => onNavigate(id as ConsoleDestination)}
      collapsed={compact ? !mobileExpanded : collapsed}
      onCollapsedChange={(next) => (compact ? setMobileExpanded(!next) : setCollapsed(next))}
      onSearch={onSearch}
      workspaceContent={
        <div className="aegis-console-environment">
          <Select
            label="Environment"
            value="main"
            size="sm"
            options={[{ value: 'main', label: 'Main', description: 'Local sample environment' }]}
          />
        </div>
      }
      footer={(small) => (
        <>
          <Tooltip content="Workspace settings">
            <button
              type="button"
              className={`nav-item ${small ? 'nav-icon' : ''} ${page === 'settings' ? 'is-active' : ''}`}
              aria-label={small ? 'Workspace settings' : undefined}
              aria-current={page === 'settings' ? 'page' : undefined}
              onClick={() => onNavigate('settings')}
            >
              <Settings size={17} />
              <span className="nav-item-copy" aria-hidden={small || undefined}>
                <span className="nav-item-label">Settings</span>
              </span>
            </button>
          </Tooltip>
          <div className="aegis-console-user">
            <Avatar
              name={analysts[0].name}
              initials={analysts[0].initials}
              size="sm"
              status="online"
            />
            <div className="aegis-console-user-copy" aria-hidden={small || undefined}>
              <strong>{analysts[0].name}</strong>
            </div>
          </div>
        </>
      )}
    />
  );
}

/** A working local workspace. Mutations live in memory; fixture telemetry stays reproducible. */
export function SiemConsole({
  initialPage = 'alerts',
  defaultNavCollapsed = false,
  defaultAiOpen = false,
  defaultBottomOpen = false,
  theme = 'light',
  onThemeChange,
  layoutTheme = 'floating',
  onLayoutThemeChange,
}: SiemConsoleProps) {
  const dockAssistant = useMediaQuery('(min-width: 1280px)');
  const [page, setPage] = useState<ConsolePage>(initialPage);
  const [selectedRuleId, setSelectedRuleId] = useState<string>();
  const emptyPage = emptyPages[page];
  const navigationRef = useRef<ConsoleNavigationHandle>(null);
  const [alerts, setAlerts] = useState<Alert[]>(() => fixtureAlerts.map((alert) => ({ ...alert })));
  const [rules, setRules] = useState<DetectionRule[]>(fixtureRules);
  const detailRule =
    page === 'rules' ? rules.find((rule) => rule.id === selectedRuleId) : undefined;
  const [filters, setFilters] = useState(createDefaultFilters);
  const [ruleFilter, setRuleFilter] = useState<string[]>([]);
  const [density, setDensity] = useState<GridDensity>('default');
  const [selected, setSelected] = useState<Alert[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(() =>
    typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search).get('alert') ?? undefined)
      : undefined,
  );
  const [commentsByAlert, setCommentsByAlert] = useState<Record<string, AlertDetailComment[]>>({});
  const [detailOpen, setDetailOpen] = useState(
    () => !!selectedId && fixtureAlerts.some((alert) => alert.id === selectedId),
  );
  const [aiOpen, setAiOpen] = useState(defaultAiOpen);
  const [bottomOpen, setBottomOpen] = useState(defaultBottomOpen);
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
  const contentRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const headerContentRef = useRef<HTMLDivElement>(null);
  const headerPinnedRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mainId = useId();
  useLayoutEffect(() => {
    const main = contentRef.current;
    const header = headerRef.current;
    const content = headerContentRef.current;
    if (!main || !header || !content) return;
    const measure = () => {
      const height = content.getBoundingClientRect().height;
      if (!headerPinnedRef.current) {
        // Keep the original slot when the same controls become a compact sticky bar.
        // The title continues scrolling in that slot beneath the pinned breadcrumb bar.
        header.style.setProperty('--console-header-height', `${height}px`);
        const title = headingRef.current?.parentElement;
        if (title)
          header.style.setProperty(
            '--console-title-offset',
            `${title.getBoundingClientRect().top - header.getBoundingClientRect().top}px`,
          );
      }
      main.style.setProperty(
        '--console-pinned-header-height',
        headerPinnedRef.current ? `${height}px` : '0px',
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);
  function updatePinnedHeader() {
    const scrollTop = Math.max(0, contentRef.current?.scrollTop ?? 0);
    const next = scrollTop > 0;
    contentRef.current?.style.setProperty('--console-scroll-top', `${scrollTop}px`);
    if (next !== headerPinnedRef.current) {
      headerPinnedRef.current = next;
      if (headerRef.current) headerRef.current.dataset.pinned = String(next);
    }
  }
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
  const selectedRecords = alerts.filter((alert) => selected.some((item) => item.id === alert.id));
  const openAlerts = scopedAlerts.filter(
    (alert) => !['resolved', 'false-positive'].includes(alert.status),
  );

  function focusHeading() {
    requestAnimationFrame(() => {
      contentRef.current?.scrollTo({ top: 0 });
      headerPinnedRef.current = false;
      if (headerRef.current) headerRef.current.dataset.pinned = 'false';
      contentRef.current?.style.setProperty('--console-scroll-top', '0px');
      const detailHeading = contentRef.current?.querySelector<HTMLElement>(
        '.aegis-detail-heading h1',
      );
      (detailHeading ?? headingRef.current)?.focus();
    });
  }
  function performNavigation(next: ConsolePage) {
    setSelectedRuleId(undefined);
    setPage(next);
    setDetailOpen(false);
    setCreatingRule(false);
    navigationRef.current?.closeMobile();
    setSelected([]);
    focusHeading();
  }
  function navigate(next: ConsolePage) {
    if (creatingRule && wizardDirty) setPendingPage(next);
    else performNavigation(next);
  }
  function navigateDestination(next: ConsoleDestination) {
    if (next === 'genie') {
      if (selectedRecords.length) setAiContext(selectedRecords.map(alertContext));
      navigationRef.current?.closeMobile();
      setAiOpen(true);
    } else navigate(next);
  }
  function updateFilters(next: AlertFilterState) {
    setFilters(next);
    setSelected([]);
  }
  function openAlert(alert: Alert) {
    setSelectedId(alert.id);
    setDetailOpen(true);
    focusHeading();
  }
  function askAi(records: Alert[], prompt?: string, contextScope = scopeLabel) {
    const context = records.map(alertContext);
    context.push({
      id: 'current-time-range',
      kind: 'scope',
      label: contextScope,
      description: 'Fixture snapshot: 21 October 2026, 20:10 UTC',
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
    setAiOpen(true);
  }
  function startRule() {
    setPage('rules');
    setDetailOpen(false);
    setCreatingRule(true);
    setWizardDirty(false);
    setAiOpen(false);
    navigationRef.current?.closeMobile();
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
        { id: 'genie', label: 'Genie', icon: <Sparkles /> },
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard /> },
        { id: 'alerts', label: 'Alerts', icon: <ShieldAlert />, count: openAlerts.length },
        { id: 'system-errors', label: 'System errors', icon: <CircleAlert /> },
        { id: 'hunting', label: 'Query', icon: <FlaskConical /> },
      ],
    },
    {
      label: 'Manage',
      items: [
        { id: 'datasources', label: 'Datasources', icon: <Database /> },
        { id: 'rules', label: 'Detection rules', icon: <ShieldCheck /> },
        { id: 'content-library', label: 'Content library', icon: <Folder /> },
        { id: 'parsers', label: 'Parsers', icon: <FileCode /> },
      ],
    },
  ];
  const actions: CommandAction[] = [
    ...sections
      .flatMap((section) => section.items)
      .map((item) => ({
        id: item.id,
        label: item.id === 'genie' ? 'Open Genie' : `Go to ${item.label.toLowerCase()}`,
        group: 'Navigation',
        icon: item.icon,
        onSelect: () => navigateDestination(item.id as ConsoleDestination),
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
    <SiemAlertsTable
      alerts={alerts}
      rules={rules}
      analysts={analysts}
      filters={filters}
      onFiltersChange={updateFilters}
      onAlertsChange={setAlerts}
      now={referenceTime}
      onOpenAlert={openAlert}
      onAskAi={askAi}
      onSelectionChange={setSelected}
      density={density}
      selectedRowIds={selected.map((alert) => alert.id)}
      ruleIds={ruleFilter}
      onRuleChange={(value) => {
        setRuleFilter(value);
        setSelected([]);
      }}
    />
  );

  return (
    <div
      className="aegis-console"
      data-page={page}
      data-ai-open={aiOpen && dockAssistant}
      data-layout-theme={layoutTheme}
    >
      <a className="aegis-console-skip" href={`#${mainId}`}>
        Skip to workspace
      </a>
      <ConsoleNavigation
        navigationRef={navigationRef}
        sections={sections}
        page={page}
        defaultCollapsed={defaultNavCollapsed}
        onNavigate={navigateDestination}
        onSearch={() => setCommandOpen(true)}
      />
      <div className="aegis-console-workspace aegis-bottom-sheet-workspace">
        <main
          id={mainId}
          ref={contentRef}
          tabIndex={-1}
          className="aegis-console-main"
          onScroll={updatePinnedHeader}
        >
          <header
            ref={headerRef}
            hidden={(detailOpen && !!selectedAlert) || !!detailRule}
            className="aegis-console-header"
            data-pinned="false"
          >
            <div ref={headerContentRef} className="aegis-console-header-content">
              {page !== 'overview' && (
                <div className="aegis-console-breadcrumb-row">
                  <Breadcrumb
                    items={[
                      { label: 'Northstar', onClick: () => navigate('overview') },
                      ...(detailRule
                        ? [
                            {
                              label: 'Detection rules',
                              onClick: () => setSelectedRuleId(undefined),
                            },
                            { label: detailRule.name },
                          ]
                        : [{ label: creatingRule ? 'Create detection rule' : pageLabels[page] }]),
                    ]}
                  />
                </div>
              )}
              <div className="aegis-console-title-row" hidden={!!detailRule}>
                <div className="aegis-console-title-copy">
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
                  {!creatingRule && ['hunting', 'incidents', 'reports'].includes(page) && (
                    <div className="aegis-console-header-time-range" title={scopeLabel}>
                      <TimeRangePicker
                        value={filters.timeRange}
                        onValueChange={(timeRange) => updateFilters({ ...filters, timeRange })}
                        now={referenceTime}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
          {detailOpen && selectedAlert ? (
            <AlertDetailPage
              key={selectedAlert.id}
              alert={selectedAlert}
              analysts={analysts}
              rules={rules}
              now={referenceTime}
              currentAnalyst={analysts[0]}
              comments={commentsByAlert[selectedAlert.id] ?? []}
              onAddComment={(comment) =>
                setCommentsByAlert((current) => ({
                  ...current,
                  [selectedAlert.id]: [...(current[selectedAlert.id] ?? []), comment],
                }))
              }
              onBack={() => navigate('alerts')}
              onUpdate={(updated) =>
                setAlerts((current) =>
                  current.map((alert) =>
                    alert.id === updated.id
                      ? { ...updated, updatedAt: new Date(referenceTime).toISOString() }
                      : alert,
                  ),
                )
              }
              onTriage={(alert) =>
                askAi([alert], `Triage ${alert.id}: review its signals and recommend next steps.`)
              }
            />
          ) : creatingRule ? (
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
              {page === 'overview' && (
                <SiemOverview
                  alerts={alerts}
                  onOpenAlert={openAlert}
                  onShowAlerts={() => {
                    setRuleFilter([]);
                    updateFilters({
                      ...createDefaultFilters(),
                      statuses: ['new', 'triaged', 'in-progress'],
                      timeRange: { mode: 'relative', preset: '7d' },
                    });
                    navigate('alerts');
                  }}
                  onAskAi={(prompt) => askAi(alerts.slice(0, 3), prompt, 'Last 7 days')}
                  onShowSystemErrors={() => navigate('system-errors')}
                />
              )}
              {page === 'system-errors' && <SiemSystemErrors />}
              {page === 'incidents' && (
                <ConsoleIncidents
                  alerts={scopedAlerts}
                  now={referenceTime}
                  onOpenAlert={openAlert}
                />
              )}
              {page === 'hunting' && (
                <ConsoleHunting
                  terminology="query"
                  alerts={scopedAlerts}
                  now={referenceTime}
                  onOpenAlert={openAlert}
                />
              )}
              {page === 'rules' && (
                <ConsoleDetections
                  selectedRuleId={selectedRuleId}
                  onSelectedRuleChange={setSelectedRuleId}
                  rules={rules}
                  alerts={alerts}
                  onCreateRule={startRule}
                  onOpenAlert={openAlert}
                  onRulesChange={setRules}
                  onShowContentLibrary={() => navigate('content-library')}
                  now={referenceTime}
                />
              )}
              {emptyPage && <EmptyState preset="no-data" {...emptyPage} />}
              {page === 'reports' && (
                <ConsoleReports alerts={scopedAlerts} scopeLabel={scopeLabel} />
              )}
            </>
          )}
          <div
            className="siem-persistent-view"
            hidden={page !== 'alerts' || detailOpen || creatingRule}
          >
            {alertWorkspace}
          </div>
          <div
            className="siem-persistent-view"
            hidden={page !== 'datasources' || detailOpen || creatingRule}
          >
            <ConsoleDatasources />
          </div>
          <div
            className="siem-persistent-view"
            hidden={page !== 'settings' || detailOpen || creatingRule}
          >
            <SiemSettings
              bottomOpen={bottomOpen}
              onBottomOpenChange={setBottomOpen}
              aiOpen={aiOpen}
              onAiOpenChange={setAiOpen}
              appearance={
                <ConsoleSettings
                  theme={theme}
                  onThemeChange={onThemeChange}
                  layoutTheme={layoutTheme}
                  onLayoutThemeChange={onLayoutThemeChange}
                  density={density}
                  onDensityChange={setDensity}
                />
              }
            />
          </div>
          <footer className="aegis-console-footnote">
            <ShieldCheck size={13} />
            <span>Local demo · 21 Oct 2026, 23:10 GMT+3</span>
            <Separator variant="dot" emphasis="light" />
            <span>Changes last for this session</span>
          </footer>
        </main>
        <BottomSheet
          title="Investigation queue"
          description={
            selectedRecords.length
              ? `${selectedRecords.length} selected alerts`
              : 'Alerts in the current time range'
          }
          open={bottomOpen}
          onOpenChange={setBottomOpen}
        >
          <div className="aegis-console-bottom-list">
            {(selectedRecords.length ? selectedRecords : scopedAlerts.slice(0, 6)).map((alert) => (
              <button key={alert.id} type="button" onClick={() => openAlert(alert)}>
                <SeverityBadge severity={alert.severity} />
                <span>
                  <strong>{alert.title}</strong>
                  <small>
                    {alert.id} · {alert.eventCount} evidence events
                  </small>
                </span>
                <span>View details</span>
              </button>
            ))}
            {!scopedAlerts.length && <p className="muted">No alerts in this time range.</p>}
          </div>
        </BottomSheet>
      </div>
      <AiPanel
        open={aiOpen}
        onOpenChange={setAiOpen}
        docked={dockAssistant}
        className="aegis-console-assistant"
        context={aiContext}
        availableContext={scopedAlerts.slice(0, 12).map(alertContext)}
        request={request}
        scopeLabel={aiContext.find((item) => item.id === 'current-time-range')?.label ?? scopeLabel}
        onEvidenceClick={openEvidence}
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
