import { StrictMode, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@/components/button';
import { alerts } from '@/sample-data';
import {
  streamMockResponse,
  type AiContextItem,
  type AiMessageData,
  type AiRequest,
  type AiStreamFactory,
} from '@/lib/ai';
import { AiPanel } from './ai-panel';
const context: AiContextItem[] = alerts
  .slice(0, 3)
  .map((alert) => ({ id: alert.id, label: alert.id, description: alert.title, kind: 'alert' }));
const timestamp = '2026-10-06T08:30:00.000Z';
const user: AiMessageData = {
  id: 'user-example',
  role: 'user',
  content: 'Which checks should I complete before linking these alerts?',
  status: 'complete',
  context,
  steps: [],
  citations: [],
  timestamp,
};
const response: AiMessageData = {
  id: 'assistant-example',
  role: 'assistant',
  content: `## Review the selected records\n\nThe investigation currently includes **${context.map((item) => item.id).join(', ')}**. Verify entity identifiers and source timestamps before linking them.\n\n1. Inspect each original event payload.\n2. Compare the observed activity with approved changes.\n3. Record the evidence supporting your verdict.\n\nNo telemetry query or security action has been executed.`,
  status: 'complete',
  context,
  steps: [
    {
      id: 'scope',
      label: 'Scoped the response to three selected alert references',
      status: 'complete',
    },
  ],
  citations: context,
  timestamp,
  provenance: 'Local demo · selected evidence only',
};
const meta = {
  title: 'Patterns/AI/AiPanel',
  component: AiPanel,
  tags: ['autodocs'],
  args: { defaultOpen: true, context, availableContext: context },
  parameters: { layout: 'fullscreen', docs: { story: { inline: false, height: 760 } } },
} satisfies Meta<typeof AiPanel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Overlay: Story = { args: { initialMessages: [user, response] } };
export const Streaming: Story = {
  args: { request: { id: 'streaming-example', prompt: 'Explain these selected alerts.', context } },
};
export const Stopped: Story = {
  args: {
    initialMessages: [
      user,
      {
        ...response,
        status: 'stopped',
        content:
          '## Review the selected evidence\n\nStart by confirming the entity identifiers for the selected alerts.',
      },
    ],
  },
};
export const Interrupted: Story = {
  args: {
    initialMessages: [
      user,
      {
        ...response,
        status: 'error',
        error: 'The connection was interrupted. Your evidence and partial answer are preserved.',
      },
    ],
  },
};
function DockedDemo() {
  const [open, setOpen] = useState(true);
  const [evidence, setEvidence] = useState('');
  return (
    <div style={{ display: 'flex', height: 800, minWidth: 780 }}>
      <main style={{ flex: 1, padding: 24 }}>
        <h1>Investigation workspace</h1>
        <p>The assistant pushes the workspace and keeps keyboard focus unrestricted.</p>
        <Button intent="ai" onClick={() => setOpen(!open)}>
          Toggle AI panel
        </Button>
        <p role="status">{evidence}</p>
      </main>
      <AiPanel
        docked
        open={open}
        onOpenChange={setOpen}
        context={context}
        initialMessages={[user, response]}
        onEvidenceClick={(item) => setEvidence(`Inspecting ${item.id}`)}
      />
    </div>
  );
}
export const DockedPush: Story = { render: () => <DockedDemo /> };
const slowResponse: AiStreamFactory = async function* (request) {
  // Deliberately ignores abort to demonstrate that the panel rejects late events.
  yield {
    type: 'token',
    text: `Review started for ${request.context?.[0]?.id ?? 'unscoped evidence'}. `,
  };
  await new Promise((resolve) => setTimeout(resolve, 650));
  yield {
    type: 'token',
    text: `Finished only for ${request.context?.[0]?.id ?? 'unscoped evidence'}.`,
  };
  for (const citation of request.context ?? []) yield { type: 'citation', citation };
  yield { type: 'complete' };
};
function ReplacementDemo() {
  const [request, setRequest] = useState<AiRequest>();
  const [selection, setSelection] = useState([context[0]]);
  return (
    <StrictMode>
      <div style={{ display: 'flex', height: 800 }}>
        <main style={{ flex: 1, padding: 24 }}>
          <h1>Replace an active request</h1>
          <p>
            Late events from the superseded response are ignored. New selection does not alter an
            existing turn.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Button
              onClick={() =>
                setRequest({
                  id: `first-${Date.now()}`,
                  prompt: 'Explain the first alert.',
                  context: [context[0]],
                })
              }
            >
              Explain first alert
            </Button>
            <Button
              onClick={() =>
                setRequest({
                  id: `second-${Date.now()}`,
                  prompt: 'Explain the second alert.',
                  context: [context[1]],
                })
              }
            >
              Explain second alert
            </Button>
            <Button onClick={() => setSelection([context[2]])}>Change visible selection</Button>
          </div>
        </main>
        <AiPanel
          docked
          defaultOpen
          context={selection}
          request={request}
          streamResponse={slowResponse}
        />
      </div>
    </StrictMode>
  );
}
export const RequestReplacement: Story = { render: () => <ReplacementDemo /> };
const failedResponse: AiStreamFactory = async function* () {
  yield { type: 'token', text: 'The selected evidence is preserved. ' };
  throw new Error('Demo connection interrupted. Try again to regenerate the response.');
};
export const FailedStream: Story = {
  args: {
    streamResponse: failedResponse,
    request: { id: 'failed-stream', prompt: 'Explain these alerts.', context },
  },
};
const fastResponse: AiStreamFactory = (request, options) =>
  streamMockResponse(request, { ...options, delayMs: 0 });
export const StrictModeSeed: Story = {
  render: (args) => (
    <StrictMode>
      <AiPanel
        {...args}
        streamResponse={fastResponse}
        request={{
          id: 'strict-mode-seed',
          prompt: 'Explain the selected alert.',
          context: [context[0]],
        }}
      />
    </StrictMode>
  ),
};
