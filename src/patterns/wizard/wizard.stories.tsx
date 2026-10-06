import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Play, ShieldCheck } from '@/components/icon';
import { Wizard, type WizardStep } from './wizard';
import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { Checkbox } from '@/components/checkbox';
import { EmptyState } from '@/components/empty-state';
import { Field } from '@/components/field';
import { TextInput } from '@/components/text-input';
import { Textarea } from '@/components/textarea';

const meta = {
  title: 'Patterns/Wizard/Detection rule setup',
  component: Wizard,
  tags: ['autodocs'],
} satisfies Meta<typeof Wizard>;
export default meta;
const initialLogic = `selection:
  Image|endswith: '\\powershell.exe'
  CommandLine|contains:
    - ' -enc '
    - ' -EncodedCommand '
condition: selection`;

function DetectionSetup({
  orientation = 'horizontal',
}: {
  orientation?: 'horizontal' | 'vertical';
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('Encoded PowerShell execution');
  const [description, setDescription] = useState(
    'Detects encoded PowerShell launched on Windows endpoints for investigation under MITRE ATT&CK T1059.001.',
  );
  const [logic, setLogic] = useState(initialLogic);
  const [tested, setTested] = useState(false);
  const [testing, setTesting] = useState(false);
  const [approved, setApproved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [finished, setFinished] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  async function testRule() {
    setTesting(true);
    await new Promise((resolve) => setTimeout(resolve, 550));
    setTested(true);
    setTesting(false);
  }
  function restart() {
    setCurrentStep(0);
    setFinished(false);
    setCancelled(false);
    setDirty(false);
    setTested(false);
    setApproved(false);
  }
  const steps: WizardStep[] = [
    {
      id: 'define',
      title: 'Define',
      description: 'Describe the detection',
      validate: () =>
        name.trim().length >= 8 && description.trim().length >= 20
          ? true
          : 'Add a descriptive rule name (at least 8 characters) and a description (at least 20 characters).',
      content: (
        <div className="stack">
          <Field
            label="Rule name"
            required
            helpText="Use a clear name that helps analysts understand what this rule detects."
          >
            <TextInput
              value={name}
              onValueChange={(value) => {
                setName(value);
                setDirty(true);
              }}
            />
          </Field>
          <Field label="Description" required>
            <Textarea
              value={description}
              onValueChange={(value) => {
                setDescription(value);
                setDirty(true);
              }}
              rows={3}
              maxLength={500}
              showCount
            />
          </Field>
          <Banner intent="info">
            This rule monitors Windows process creation events mapped to T1059.001 — PowerShell.
          </Banner>
        </div>
      ),
    },
    {
      id: 'logic',
      title: 'Logic',
      description: 'Set detection conditions',
      validate: async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return logic.includes('condition:') && logic.includes('selection:')
          ? true
          : 'The detection must include a selection and a condition before it can be tested.';
      },
      content: (
        <div className="stack">
          <Field
            label="Detection logic"
            required
            helpText="The selection matches encoded command-line arguments in Windows process creation telemetry."
          >
            <Textarea
              value={logic}
              onValueChange={(value) => {
                setLogic(value);
                setTested(false);
                setApproved(false);
                setDirty(true);
              }}
              rows={8}
              textareaClassName="mono"
            />
          </Field>
          <Banner intent="warning" title="Review expected automation">
            Encoded commands may also be used by approved administration tools. Test this rule
            before enabling it.
          </Banner>
        </div>
      ),
    },
    {
      id: 'test',
      title: 'Test',
      description: 'Check recent events',
      validate: () => tested || 'Run the detection against the sample events before continuing.',
      content: (
        <div className="stack">
          <p className="muted">
            Validate against 1,284 process creation events collected from your Windows endpoints in
            the last 24 hours.
          </p>
          <div>
            <Button
              intent="function"
              emphasis="secondary"
              leadingIcon={<Play size={15} />}
              loading={testing}
              onClick={testRule}
            >
              {tested ? 'Run test again' : 'Run detection test'}
            </Button>
          </div>
          {tested && (
            <Banner intent="success" title="Test completed: 3 matching events">
              The rule matched encoded PowerShell on WS-ATH-114 and WS-LON-042. Two events
              originated from Office processes and one from an approved deployment agent.
            </Banner>
          )}
          <div className="surface">
            <p className="muted" style={{ marginBottom: 'var(--space-2)' }}>
              Representative event
            </p>
            <code
              style={{
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                fontSize: 'var(--text-xs)',
              }}
            >
              WS-ATH-114 · WINWORD.EXE → powershell.exe -EncodedCommand SQBFAFgA · a.patel
            </code>
          </div>
        </div>
      ),
    },
    {
      id: 'review',
      title: 'Review and enable',
      description: 'Approve the rule',
      validate: () => approved || 'Confirm that you reviewed the detection logic and test results.',
      content: (
        <div className="stack">
          <dl
            className="surface"
            style={{
              margin: 0,
              display: 'grid',
              gridTemplateColumns: '140px 1fr',
              gap: 'var(--space-3)',
            }}
          >
            <dt className="muted">Rule name</dt>
            <dd style={{ margin: 0 }}>{name}</dd>
            <dt className="muted">Log source</dt>
            <dd style={{ margin: 0 }}>Windows process creation</dd>
            <dt className="muted">Technique</dt>
            <dd style={{ margin: 0 }}>T1059.001 — PowerShell</dd>
            <dt className="muted">Test result</dt>
            <dd style={{ margin: 0 }}>3 matches across 1,284 events</dd>
          </dl>
          <Checkbox
            checked={approved}
            onCheckedChange={(value) => {
              setApproved(value === true);
              setDirty(true);
            }}
            label="I reviewed the detection logic and test results"
            description="Enabling this rule starts evaluating new events immediately."
          />
        </div>
      ),
    },
  ];
  if (finished || cancelled)
    return (
      <div className="surface" style={{ maxWidth: 900 }}>
        <EmptyState
          icon={<ShieldCheck size={25} />}
          title={finished ? 'Detection rule enabled' : 'Setup cancelled'}
          description={
            finished
              ? `${name} is now monitoring Windows process events. New matching activity will appear in the alert queue.`
              : 'The unfinished rule was discarded. Existing detections were not changed.'
          }
          action={
            <Button intent="function" onClick={restart}>
              Create another rule
            </Button>
          }
        />
      </div>
    );
  return (
    <Wizard
      title="Create detection rule"
      description="Turn suspicious behavior into reliable detection coverage."
      steps={steps}
      currentStep={currentStep}
      onStepChange={(step) => {
        setCurrentStep(step);
        setDirty(true);
      }}
      onFinish={async () => {
        await new Promise((resolve) => setTimeout(resolve, 450));
        setDirty(false);
        setFinished(true);
      }}
      onCancel={() => {
        setDirty(false);
        setCancelled(true);
      }}
      dirty={dirty}
      finishLabel="Enable detection rule"
      orientation={orientation}
    />
  );
}
export const GuidedSetup: StoryObj = { render: () => <DetectionSetup /> };
export const VerticalLayout: StoryObj = { render: () => <DetectionSetup orientation="vertical" /> };
export const ValidationAndDirtyGuard: StoryObj = {
  render: () => (
    <div className="stack">
      <Banner title="Try the validation and exit guard">
        Clear the rule name and continue to see validation. Edit any field, then select Cancel to
        choose whether to discard your changes.
      </Banner>
      <DetectionSetup />
    </div>
  ),
};
