import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AiMessage } from './ai-message';
import { AiHighlight } from '@/components/ai-card';
import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { streamMockResponse, type AiContextItem, type AiMessageData } from '@/lib/ai';
import { aiTranscripts, referenceTime } from '@/sample-data';

const fixture = aiTranscripts[0];
const evidence: AiContextItem[] = fixture.evidence.map((id) => ({
  id,
  label: id,
  kind: id.startsWith('DET') ? 'rule' : 'alert',
}));
const completeMessage: AiMessageData = {
  id: 'triage',
  role: 'assistant',
  content: fixture.response,
  status: 'complete',
  context: evidence,
  citations: evidence,
  steps: fixture.steps.map((step, index) => ({ ...step, id: `step-${index}` })),
  timestamp: new Date(referenceTime).toISOString(),
  provenance: 'Local demo · Selected alert evidence',
};
const meta = {
  title: 'Components/AI/AiMessage',
  component: AiMessage,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
  args: { message: completeMessage },
} satisfies Meta<typeof AiMessage>;
export default meta;
function CompleteResponse() {
  const [opened, setOpened] = useState<AiContextItem>();
  const [message, setMessage] = useState(completeMessage);
  return (
    <div className="stack">
      <AiMessage
        message={message}
        onCitationClick={setOpened}
        onFeedback={(feedback) => setMessage((value) => ({ ...value, feedback }))}
        resultCards={
          <AiHighlight confidence="medium" provenance="Analyst validation needed">
            The two alerts reference different entities. Compare their timelines before linking them
            into one incident.
          </AiHighlight>
        }
      />
      {opened && (
        <Banner
          title={`${opened.kind === 'rule' ? 'Detection rule' : 'Alert'} ${opened.id}`}
          onDismiss={() => setOpened(undefined)}
        >
          {opened.kind === 'rule'
            ? 'Encoded PowerShell detection · inspect the Office parent condition.'
            : opened.id === 'ALR-1048'
              ? 'Impossible travel for k.nakamura · verify travel or VPN use.'
              : 'Encoded PowerShell on WS-LON-082 · preserve the process timeline.'}
        </Banner>
      )}
    </div>
  );
}
export const CompleteWithEvidence: StoryObj<typeof meta> = {
  render: () => <CompleteResponse />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Reviewed 3 evidence steps'));
    await expect(canvas.getByText('Reviewed authentication and endpoint evidence')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Open alert: ALR-1048' }));
    await expect(canvas.getByText('Alert ALR-1048')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Helpful response' }));
    await expect(canvas.getByRole('button', { name: 'Helpful response' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  },
};
export const Streaming: StoryObj<typeof meta> = {
  args: {
    message: {
      ...completeMessage,
      status: 'streaming',
      content:
        '## Reviewing the selected evidence\n\nThe encoded PowerShell process has an **Office parent**. Compare the command line with approved',
      citations: [],
      steps: [
        { id: 'read', label: 'Reviewed the endpoint process payload', status: 'complete' },
        {
          id: 'compare',
          label: 'Comparing the parent and child process context',
          status: 'working',
        },
        { id: 'summary', label: 'Preparing an analyst summary', status: 'pending' },
      ],
    },
  },
};
export const Thinking: StoryObj<typeof meta> = {
  args: {
    message: {
      ...completeMessage,
      status: 'streaming',
      content: '',
      citations: [],
      steps: [{ id: 'scope', label: 'Reading the selected alert context', status: 'working' }],
    },
  },
};
export const Stopped: StoryObj<typeof meta> = {
  args: {
    message: {
      ...completeMessage,
      status: 'stopped',
      content:
        'The selected activity spans identity and endpoint telemetry. Compare timestamps and entity identifiers before',
      citations: [],
    },
  },
};
function RecoverableResponse({ message: initial }: { message: AiMessageData }) {
  const [message, setMessage] = useState(initial);
  return (
    <AiMessage
      message={message}
      onRegenerate={() => setMessage({ ...completeMessage, id: 'recovered' })}
    />
  );
}
export const Error: StoryObj<typeof meta> = {
  render: (args) => <RecoverableResponse message={args.message} />,
  args: {
    message: {
      ...completeMessage,
      status: 'error',
      error: 'The local response was interrupted. Retry to generate a new summary.',
      content: 'I reviewed the selected alert identifiers.',
      steps: [
        { id: 'context', label: 'Read the selected context', status: 'complete' },
        { id: 'summary', label: 'Could not finish the summary', status: 'error' },
      ],
    },
  },
};
export const UserMessage: StoryObj<typeof meta> = {
  args: {
    message: {
      ...completeMessage,
      role: 'user',
      content: 'Triage these two alerts and show the evidence behind your recommendations.',
      steps: [],
      citations: [],
    },
  },
};
function StreamDemo({ slowFirstResponse = false }: { slowFirstResponse?: boolean }) {
  const [message, setMessage] = useState<AiMessageData>();
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const [notice, setNotice] = useState('');
  useEffect(() => () => controller.current?.abort(), []);
  async function start() {
    controller.current?.abort();
    const active = new AbortController();
    controller.current = active;
    setNotice('');
    setMessage({
      ...completeMessage,
      id: `live-${++generation.current}`,
      content: '',
      steps: [],
      citations: [],
      status: 'streaming',
      feedback: undefined,
    });
    try {
      for await (const event of streamMockResponse(
        { id: 'triage-live', prompt: 'Triage the selected alerts', context: evidence },
        {
          signal: active.signal,
          delayMs: slowFirstResponse && generation.current === 1 ? 100 : 14,
        },
      )) {
        if (controller.current !== active) break;
        setMessage((current) => {
          if (!current) return current;
          if (event.type === 'token') return { ...current, content: current.content + event.text };
          if (event.type === 'step')
            return {
              ...current,
              steps: [...current.steps.filter((step) => step.id !== event.step.id), event.step],
            };
          if (event.type === 'citation')
            return { ...current, citations: [...current.citations, event.citation] };
          return { ...current, status: 'complete' };
        });
      }
    } catch (error) {
      if (controller.current !== active) return;
      setMessage((current) =>
        current
          ? {
              ...current,
              status: active.signal.aborted ? 'stopped' : 'error',
              error:
                error instanceof globalThis.Error
                  ? error.message
                  : 'Could not finish this response',
            }
          : current,
      );
    }
  }
  return (
    <div className="stack">
      <div className="row">
        <Button intent="ai" onClick={start} disabled={message?.status === 'streaming'}>
          {message ? 'Generate another summary' : 'Generate triage summary'}
        </Button>
        {message?.status === 'streaming' && (
          <Button emphasis="ghost" onClick={() => controller.current?.abort()}>
            Stop generation
          </Button>
        )}
      </div>
      {message ? (
        <AiMessage
          key={message.id}
          message={message}
          onRegenerate={start}
          onCitationClick={(item) => setNotice(`Opened ${item.kind} ${item.label}`)}
          onFeedback={(feedback) =>
            setMessage((current) => (current ? { ...current, feedback } : current))
          }
        />
      ) : (
        <AiHighlight provenance="Local demo · No network or security actions">
          Generate a response from the supplied alert and rule references. Stop at any time; your
          partial response remains available.
        </AiHighlight>
      )}
      {notice && <p role="status">{notice}</p>}
    </div>
  );
}
export const InteractiveStreaming: StoryObj<typeof meta> = { render: () => <StreamDemo /> };
export const StoppedBeforeFirstToken: StoryObj<typeof meta> = {
  render: () => <StreamDemo slowFirstResponse />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Generate triage summary' }));
    await userEvent.click(await canvas.findByRole('button', { name: 'Stop generation' }));
    const regenerate = await canvas.findByRole('button', { name: 'Regenerate response' });
    await expect(canvasElement.querySelector('.aegis-ai-markdown')).toBeNull();
    await expect(canvas.queryByRole('button', { name: 'Copy response' })).toBeNull();
    await userEvent.click(regenerate);
    await expect(
      await canvas.findByRole('button', { name: 'Copy response' }, { timeout: 15000 }),
    ).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Open alert: ALR-1048' })).toBeVisible();
  },
};
