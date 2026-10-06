import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Play, Sparkles } from 'lucide-react';
import { Wizard, type WizardStep } from '@/patterns/wizard';
import { AiDiffReview } from '@/patterns/ai-diff-review';
import { AiInlineSuggestion } from '@/components/ai-inline-suggestion';
import { AiCard } from '@/components/ai-card';
import { Field } from '@/components/field';
import { Select } from '@/components/select';
import { CodeEditor } from '@/components/code-editor';
import { YamlPresenter } from '@/components/yaml-presenter';
import { BarChart } from '@/components/charts';
import { MetricCard } from '@/components/metric-card';
import { Button } from '@/components/button';
import { Banner } from '@/components/banner';
import { Checkbox } from '@/components/checkbox';
import { Switch } from '@/components/switch';
import { Tag } from '@/components/tag';
import { SeverityBadge, type Severity } from '@/components/severity-badge';
import { rules, referenceTime, type DetectionRule } from '@/sample-data';
import {
  proposeOfficeRule,
  replayDetectionRule,
  setRuleMetadata,
  validateDetectionRule,
  type ReplayResult,
} from '@/lib/detection-rule';
import './detection-rule-wizard.css';
export interface CreatedDetectionRule extends DetectionRule {
  enabled: boolean;
}
export interface DetectionRuleWizardProps {
  orientation?: 'horizontal' | 'vertical';
  onCreate?: (rule: CreatedDetectionRule) => void | Promise<void>;
  onCancel?: () => void;
  defaultStep?: number;
}
const initialName = 'Encoded PowerShell';
const initialDescription = 'Detects encoded PowerShell';
export function DetectionRuleWizard({
  orientation = 'horizontal',
  onCreate,
  onCancel,
  defaultStep = 0,
}: DetectionRuleWizardProps) {
  const [step, setStep] = useState(defaultStep);
  const [ruleId, setRuleId] = useState(() => crypto.randomUUID());
  const createdRef = useRef<HTMLElement>(null);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [severity, setSeverity] = useState<Severity>('high');
  const [yaml, setYaml] = useState(rules[2].yaml);
  const [dirty, setDirty] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [proposal, setProposal] = useState<{ original: string; proposed: string }>();
  const [proposalError, setProposalError] = useState('');
  const [test, setTest] = useState<{ yaml: string; results: ReplayResult[] }>();
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState<{ yaml: string; message: string }>();
  const [enabled, setEnabled] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [created, setCreated] = useState<CreatedDetectionRule>();
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  const prepared = useMemo(
    () => setRuleMetadata(yaml, { name, description, severity, id: ruleId }),
    [yaml, name, description, severity, ruleId],
  );
  const validation = useMemo(() => validateDetectionRule(prepared), [prepared]);
  useEffect(() => {
    if (created) createdRef.current?.focus();
  }, [created]);
  const currentTest = test?.yaml === prepared ? test : undefined;
  const currentTestError = testError?.yaml === prepared ? testError.message : undefined;
  const matching = currentTest?.results.filter((event) => event.matched) ?? [];
  function edit() {
    setDirty(true);
    setConfirmed(false);
  }
  function runTest() {
    if (testing) return;
    setTesting(true);
    setTestError(undefined);
    const snapshot = prepared;
    timer.current = setTimeout(() => {
      try {
        const results = replayDetectionRule(snapshot);
        if (mounted.current) setTest({ yaml: snapshot, results });
      } catch (error) {
        if (mounted.current)
          setTestError({
            yaml: snapshot,
            message: error instanceof Error ? error.message : 'The sample replay failed.',
          });
      } finally {
        if (mounted.current) setTesting(false);
      }
    }, 450);
  }
  const steps: WizardStep[] = [
    {
      id: 'define',
      title: 'Define',
      description: 'Name and classify the rule',
      validate: () => {
        setShowErrors(true);
        return name.trim().length < 8
          ? 'Enter a descriptive rule name with at least 8 characters.'
          : description.trim().length < 20
            ? 'Add a description with at least 20 characters.'
            : true;
      },
      content: (
        <div className="stack">
          <Field
            label="Rule name"
            required
            error={showErrors && name.trim().length < 8 ? 'Use at least 8 characters.' : undefined}
          >
            <AiInlineSuggestion
              value={name}
              onValueChange={(value) => {
                setName(value);
                setProposal(undefined);
                edit();
              }}
              suggestion="Encoded PowerShell from Microsoft Office"
              maxLength={120}
            />
          </Field>
          <Field
            label="Description"
            required
            error={
              showErrors && description.trim().length < 20
                ? 'Use at least 20 characters.'
                : undefined
            }
          >
            <AiInlineSuggestion
              as="textarea"
              value={description}
              onValueChange={(value) => {
                setDescription(value);
                setProposal(undefined);
                edit();
              }}
              suggestion="Detects encoded PowerShell launched by Microsoft Office applications, excluding approved endpoint automation."
              rows={3}
              maxLength={800}
            />
          </Field>
          <div className="aegis-rule-fields">
            <Field label="Severity" required>
              <Select
                value={severity}
                onValueChange={(value) => {
                  setSeverity(value as Severity);
                  setProposal(undefined);
                  edit();
                }}
                options={(['critical', 'high', 'medium', 'low', 'info'] as const).map((value) => ({
                  value,
                  label:
                    value === 'info' ? 'Informational' : value[0].toUpperCase() + value.slice(1),
                }))}
              />
            </Field>
            <div>
              <span className="aegis-rule-field-label">Data source</span>
              <div className="row">
                <Tag>Windows · Process creation</Tag>
                <Tag>EDR</Tag>
              </div>
            </div>
          </div>
          <div className="row">
            <span className="muted">MITRE ATT&CK</span>
            <Tag>T1059.001 · PowerShell</Tag>
          </div>
          <Banner title="Start with a reviewed template">
            The sample uses a Windows process rule. AI completions are suggestions; accepting one
            updates your draft.
          </Banner>
        </div>
      ),
    },
    {
      id: 'logic',
      title: 'Logic',
      description: 'Write and review detection logic',
      validate: () => validation.errors[0] ?? true,
      content: (
        <div className="stack">
          <div className="between">
            <p className="muted">
              Edit the Sigma-style YAML. Name, description, and severity come from Define.
            </p>
            <Button
              size="sm"
              intent="ai"
              emphasis="soft"
              leadingIcon={<Sparkles size={15} />}
              disabled={!!validation.errors.length}
              onClick={() => {
                setProposalError('');
                try {
                  setProposal({ original: prepared, proposed: proposeOfficeRule(prepared) });
                } catch (error) {
                  setProposalError(
                    error instanceof Error ? error.message : 'A proposal could not be prepared.',
                  );
                }
              }}
            >
              Suggest Office parent filter
            </Button>
          </div>
          <CodeEditor
            label="Detection rule YAML"
            value={yaml}
            onValueChange={(value) => {
              setYaml(value);
              setProposal(undefined);
              edit();
            }}
            minHeight={300}
            maxHeight={440}
            statusBar={validation.errors.length ? 'Review YAML validation' : 'YAML syntax valid'}
          />
          {!!validation.errors.length && (
            <Banner intent="destroy" title="Rule validation">
              {validation.errors[0]}
            </Banner>
          )}
          {proposalError && <Banner intent="destroy">{proposalError}</Banner>}
          {proposal && (
            <AiDiffReview
              original={proposal.original}
              proposed={proposal.proposed}
              ruleName={name}
              summary="Add a Microsoft Office parent-process selector and raise the severity to critical. This narrows matching activity to Word, Excel, or Outlook launching encoded PowerShell. Replay the revised rule before enabling it."
              provenance="Aegis demo assistant · Windows process template"
              reviewer="Elena Vasquez"
              now={referenceTime}
              confidence="medium"
              onApprove={(value) => {
                const parsed = validateDetectionRule(value);
                if (parsed.errors.length) throw new Error(parsed.errors[0]);
                setYaml(value);
                setSeverity(
                  parsed.value?.level === 'informational'
                    ? 'info'
                    : (String(parsed.value?.level) as Severity),
                );
                edit();
              }}
              onReject={() => {}}
            />
          )}
        </div>
      ),
    },
    {
      id: 'test',
      title: 'Test',
      description: 'Replay against sample events',
      validate: () =>
        currentTest ? true : 'Run the sample replay against the current rule before continuing.',
      content: (
        <div className="stack">
          <Banner title="Local sample replay">
            Evaluate eight labelled Windows process events. This demo supports the included
            PowerShell selectors; it does not query a SIEM or execute code.
          </Banner>
          <div className="between">
            <span className="muted">6 October 2026 · 08:00–09:00 UTC</span>
            <Button
              intent="function"
              leadingIcon={<Play size={15} />}
              loading={testing}
              onClick={runTest}
            >
              {currentTest ? 'Run replay again' : 'Run sample replay'}
            </Button>
          </div>
          {currentTestError && (
            <Banner intent="destroy" title="Replay unavailable">
              {currentTestError}
            </Banner>
          )}
          {test && !currentTest && (
            <Banner intent="warning" title="The rule changed">
              Run the replay again to validate this version.
            </Banner>
          )}
          {currentTest && (
            <>
              <p role="status">
                Replay complete: {matching.length} matches across {currentTest.results.length}{' '}
                events.
              </p>
              <div className="aegis-rule-metrics">
                <MetricCard label="Events replayed" value={currentTest.results.length} />
                <MetricCard label="Rule matches" value={matching.length} />
                <MetricCard
                  label="Benign matches"
                  value={matching.filter((event) => event.expected === 'benign').length}
                />
              </div>
              <BarChart
                title="Replay results"
                height={170}
                showLegend
                data={[
                  {
                    label: 'Suspicious',
                    matched: matching.filter((event) => event.expected === 'suspicious').length,
                    unmatched: currentTest.results.filter(
                      (event) => !event.matched && event.expected === 'suspicious',
                    ).length,
                  },
                  {
                    label: 'Benign',
                    matched: matching.filter((event) => event.expected === 'benign').length,
                    unmatched: currentTest.results.filter(
                      (event) => !event.matched && event.expected === 'benign',
                    ).length,
                  },
                ]}
                series={[
                  { key: 'matched', label: 'Matched', color: 'function' },
                  { key: 'unmatched', label: 'Not matched', color: 'chart-5' },
                ]}
              />
              <div
                className="aegis-rule-replay-scroll"
                role="region"
                aria-label="Sample replay evidence"
                tabIndex={0}
              >
                <table className="aegis-rule-replay">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Host</th>
                      <th>Label</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTest.results.map((event) => (
                      <tr key={event.id}>
                        <td>
                          <code>{event.id}</code>
                        </td>
                        <td>
                          <code>{event.host}</code>
                        </td>
                        <td>{event.expected === 'suspicious' ? 'Suspicious' : 'Benign'}</td>
                        <td>
                          <Tag intent={event.matched ? 'function' : 'default'}>
                            {event.matched ? 'Matched' : 'Not matched'}
                          </Tag>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      id: 'review',
      title: 'Review and enable',
      description: 'Confirm the deployment decision',
      validate: () =>
        !currentTest
          ? 'Return to Test and replay the current rule.'
          : !confirmed
            ? 'Confirm that you reviewed the rule and replay results.'
            : true,
      content: (
        <div className="stack">
          <div className="between">
            <div>
              <h4>{name}</h4>
              <p className="muted">{description}</p>
            </div>
            <SeverityBadge severity={severity} />
          </div>
          <AiCard
            title="Review coverage before enabling"
            confidence="medium"
            provenance="AI generated · Local sample replay"
          >
            <p>
              The replay matched {matching.length} of {currentTest?.results.length ?? 0} sample
              events. A narrow sample cannot establish production precision. Review missed
              suspicious events and test against your own telemetry before deployment.
            </p>
          </AiCard>
          <YamlPresenter value={prepared} filename="encoded-powershell.yml" maxHeight={330} />
          <Switch
            label="Enable rule after creation"
            description="In this demo, the setting is saved locally with the rule."
            checked={enabled}
            onCheckedChange={(value) => {
              setEnabled(value);
              edit();
            }}
          />
          <Checkbox
            label="I reviewed the detection logic and sample replay results"
            checked={confirmed}
            onCheckedChange={(value) => setConfirmed(value === true)}
          />
        </div>
      ),
    },
  ];
  if (created)
    return (
      <section
        className="aegis-rule-created surface stack"
        aria-label="Rule creation complete"
        ref={createdRef}
        tabIndex={-1}
      >
        <CheckCircle2 size={34} />
        <h2>Detection rule {created.enabled ? 'enabled' : 'saved as draft'}</h2>
        <p>{created.name}</p>
        <div className="row">
          <Tag>{created.id}</Tag>
          <SeverityBadge severity={severity} />
          <Tag intent={created.enabled ? 'success' : 'default'}>
            {created.enabled ? 'Enabled' : 'Draft'}
          </Tag>
        </div>
        <Banner intent="success" title="Saved in this demo">
          The reviewed YAML and enabled state have been passed to the workspace. No external system
          was changed.
        </Banner>
        <YamlPresenter value={created.yaml} filename="encoded-powershell.yml" maxHeight={320} />
        <div className="row">
          {onCancel && (
            <Button intent="function" onClick={onCancel}>
              Return to workspace
            </Button>
          )}
          <Button
            emphasis="ghost"
            onClick={() => {
              setCreated(undefined);
              setName(initialName);
              setDescription(initialDescription);
              setSeverity('high');
              setYaml(rules[2].yaml);
              setEnabled(true);
              setRuleId(crypto.randomUUID());
              setTestError(undefined);
              setProposalError('');
              setShowErrors(false);
              setStep(0);
              setConfirmed(false);
              setTest(undefined);
              setProposal(undefined);
              setDirty(false);
            }}
          >
            Create another rule
          </Button>
        </div>
      </section>
    );
  return (
    <Wizard
      title="Create detection rule"
      description="Define, test, and review a Windows process detection."
      orientation={orientation}
      currentStep={step}
      onStepChange={setStep}
      steps={steps}
      dirty={dirty}
      onCancel={onCancel}
      finishLabel={enabled ? 'Create and enable rule' : 'Save rule draft'}
      onFinish={async () => {
        const rule: CreatedDetectionRule = {
          id: `DET-${ruleId.slice(0, 8).toUpperCase()}`,
          name: name.trim(),
          description: description.trim(),
          source: 'EDR',
          technique: 'T1059.001',
          yaml: prepared,
          enabled,
        };
        await onCreate?.(rule);
        setDirty(false);
        setCreated(rule);
      }}
    />
  );
}
