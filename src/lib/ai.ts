export type AiContextKind = 'alert' | 'rule' | 'event' | 'scope';
export interface AiContextItem {
  id: string;
  label: string;
  kind: AiContextKind;
  description?: string;
  href?: string;
}
export interface AiToolStep {
  id: string;
  label: string;
  status: 'pending' | 'working' | 'complete' | 'error';
}
export type AiFeedback = 'helpful' | 'unhelpful';
export interface AiMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'streaming' | 'complete' | 'stopped' | 'error';
  context: AiContextItem[];
  steps: AiToolStep[];
  citations: AiContextItem[];
  timestamp: string;
  feedback?: AiFeedback;
  error?: string;
  provenance?: string;
}
export interface AiRequest {
  /** A new id starts a new request; a repeated id is not submitted again. */
  id: string;
  prompt: string;
  context?: AiContextItem[];
}
export type AiStreamEvent =
  | { type: 'step'; step: AiToolStep }
  | { type: 'token'; text: string }
  | { type: 'citation'; citation: AiContextItem }
  | { type: 'complete' };
export interface AiStreamOptions {
  signal?: AbortSignal;
  delayMs?: number;
}
export type AiStreamFactory = (
  request: AiRequest,
  options?: AiStreamOptions,
) => AsyncIterable<AiStreamEvent>;

function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('Generation was stopped.', 'AbortError');
}
function pause(milliseconds: number, signal?: AbortSignal): Promise<void> {
  checkAbort(signal);
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException('Generation was stopped.', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, milliseconds);
    signal?.addEventListener('abort', abort, { once: true });
  });
}
const markdownLabel = (label: string) => label.replace(/[\\`*_{}[\]<>]/g, '\\$&');

/** Deterministic local demo responses reference only context supplied by the caller. */
export async function* streamMockResponse(
  request: AiRequest,
  { signal, delayMs = 22 }: AiStreamOptions = {},
): AsyncGenerator<AiStreamEvent> {
  const delay = Number.isFinite(delayMs) ? Math.max(0, Math.min(1000, delayMs)) : 22;
  const context = [
    ...new Map((request.context ?? []).map((item) => [item.id, { ...item }])).values(),
  ];
  const evidence = context.filter((item) => item.kind !== 'scope');
  const scope = context.filter((item) => item.kind === 'scope');
  const ruleRequest =
    evidence.some((item) => item.kind === 'rule') ||
    /\brule\b|\bsigma\b|\bdetection logic\b/i.test(request.prompt);
  const steps = [
    {
      id: 'scope',
      label: `Scoped the request to ${evidence.length} supplied evidence ${evidence.length === 1 ? 'reference' : 'references'}`,
    },
    {
      id: 'review',
      label: ruleRequest
        ? 'Prepared a detection-validation checklist'
        : 'Prepared an investigation checklist from the supplied context',
    },
  ];
  for (const step of steps) {
    checkAbort(signal);
    yield { type: 'step', step: { ...step, status: 'working' } };
    await pause(delay * 6, signal);
    yield { type: 'step', step: { ...step, status: 'complete' } };
  }
  const references = evidence
    .slice(0, 8)
    .map((item) => `- **${markdownLabel(item.label)}** (${markdownLabel(item.id)})`)
    .join('\n');
  const scopeLine = scope.length
    ? `\n\nScope: ${scope.map((item) => markdownLabel(item.label)).join(' · ')}.`
    : '';
  const content =
    evidence.length === 0
      ? `## Add evidence to the investigation\n\nNo alert, event, or detection rule is attached to this request.${scopeLine}\n\nAttach a relevant record so the response can refer to its identifier. In the meantime, confirm the time range, affected entity, and telemetry source before reaching a verdict.\n\nThis is a local interaction demo. No queries or security actions have been executed.`
      : `## ${ruleRequest ? 'Detection review' : 'Review the selected evidence'}\n\nThis response is scoped to ${evidence.length} supplied ${evidence.length === 1 ? 'record' : 'records'}:${scopeLine}\n\n${references}${evidence.length > 8 ? `\n- Plus ${evidence.length - 8} additional supplied references.` : ''}\n\n${
          ruleRequest
            ? 'Before changing detection logic:\n\n1. Confirm the expected threat behavior and the telemetry fields the rule requires.\n2. Compare matching events with approved automation to identify avoidable noise.\n3. Test the proposed logic against historical events, then review the YAML diff before enabling it.'
            : 'Suggested analyst checks:\n\n1. Compare source timestamps and entity identifiers before linking the records into one incident.\n2. Inspect the original event payloads and validate whether the activity matches an approved change.\n3. Document the evidence supporting a verdict and assign the next investigation step.'
        }\n\nThe attached labels and identifiers establish scope; they do not prove a shared attack sequence. This local demo has not queried telemetry or changed any rule, account, or alert. **An analyst must approve consequential actions.**`;
  for (const text of content.match(/\S+\s*/g) ?? []) {
    await pause(delay, signal);
    checkAbort(signal);
    yield { type: 'token', text };
  }
  for (const citation of evidence) {
    checkAbort(signal);
    yield { type: 'citation', citation };
  }
  checkAbort(signal);
  yield { type: 'complete' };
}
