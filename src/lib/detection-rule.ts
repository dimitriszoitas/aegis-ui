import { parseDocument } from 'yaml';

export interface RuleValidation {
  value?: Record<string, unknown>;
  errors: string[];
}
export function validateDetectionRule(source: string): RuleValidation {
  if (source.length > 200000) return { errors: ['Keep the rule below 200,000 characters.'] };
  try {
    const document = parseDocument(source, { uniqueKeys: true });
    if (document.errors.length) return { errors: document.errors.map((error) => error.message) };
    const value: unknown = document.toJS({ maxAliasCount: 100 });
    if (!isRecord(value)) return { errors: ['The rule must be a YAML mapping.'] };
    const errors: string[] = [];
    if (typeof value.title !== 'string' || !value.title.trim()) errors.push('Add a rule title.');
    if (!isRecord(value.logsource)) errors.push('Add a logsource mapping.');
    if (!isRecord(value.detection) || typeof value.detection.condition !== 'string')
      errors.push('Add a detection mapping with a condition.');
    if (!['critical', 'high', 'medium', 'low', 'informational'].includes(String(value.level)))
      errors.push('Choose a valid rule level.');
    return { value, errors };
  } catch (error) {
    return { errors: [error instanceof Error ? error.message : 'The rule could not be parsed.'] };
  }
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export interface ReplayEvent {
  id: string;
  host: string;
  time: string;
  Image: string;
  CommandLine: string;
  ParentImage: string;
  expected: 'suspicious' | 'benign';
}
const base = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
export const ruleReplayEvents: ReplayEvent[] = [
  {
    id: 'EVT-701',
    host: 'WS-ATH-114',
    time: '08:06',
    Image: base,
    CommandLine: 'powershell.exe -EncodedCommand JAB3AGMAPQ',
    ParentImage: 'C:\\Program Files\\Microsoft Office\\winword.exe',
    expected: 'suspicious',
  },
  {
    id: 'EVT-702',
    host: 'WS-LON-082',
    time: '08:12',
    Image: base,
    CommandLine: 'powershell.exe -enc SQBFAFgA',
    ParentImage: 'C:\\Program Files\\Microsoft Office\\excel.exe',
    expected: 'suspicious',
  },
  {
    id: 'EVT-703',
    host: 'WS-PAR-061',
    time: '08:21',
    Image: base,
    CommandLine: 'powershell.exe -e JABQAFM',
    ParentImage: 'C:\\Program Files\\Microsoft Office\\outlook.exe',
    expected: 'suspicious',
  },
  {
    id: 'EVT-704',
    host: 'SRV-DB-04',
    time: '08:24',
    Image: base,
    CommandLine: 'powershell.exe -EncodedCommand JAB0AGEAcwBr',
    ParentImage: 'C:\\Program Files\\NorthstarAgent.exe',
    expected: 'benign',
  },
  {
    id: 'EVT-705',
    host: 'WS-ATH-117',
    time: '08:31',
    Image: base,
    CommandLine: 'powershell.exe -File inventory.ps1',
    ParentImage: 'C:\\Windows\\explorer.exe',
    expected: 'benign',
  },
  {
    id: 'EVT-706',
    host: 'WS-LON-093',
    time: '08:42',
    Image: base,
    CommandLine: 'powershell.exe -enc JABkAGwAbAA',
    ParentImage: 'C:\\Windows\\explorer.exe',
    expected: 'suspicious',
  },
  {
    id: 'EVT-707',
    host: 'DC-ATH-02',
    time: '08:48',
    Image: 'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
    CommandLine: 'pwsh.exe -enc JABTAHkAcwA',
    ParentImage: 'C:\\Windows\\System32\\cmd.exe',
    expected: 'suspicious',
  },
  {
    id: 'EVT-708',
    host: 'WS-ATH-120',
    time: '08:54',
    Image: 'C:\\Windows\\notepad.exe',
    CommandLine: 'notepad.exe incident.txt',
    ParentImage: 'C:\\Windows\\explorer.exe',
    expected: 'benign',
  },
];
export interface ReplayResult extends ReplayEvent {
  matched: boolean;
}
/** Deliberately bounded local replay, not a Sigma backend. Unsupported conditions fail explicitly. */
export function replayDetectionRule(source: string): ReplayResult[] {
  const validation = validateDetectionRule(source);
  if (validation.errors.length) throw new Error(validation.errors[0]);
  const logsource = validation.value!.logsource as Record<string, unknown>;
  if (
    logsource.product !== 'windows' ||
    logsource.category !== 'process_creation' ||
    Object.keys(logsource).some((key) => key !== 'product' && key !== 'category')
  )
    throw new Error(
      'This local replay supports only logsource product: windows and category: process_creation, without additional logsource constraints.',
    );
  const detection = validation.value!.detection as Record<string, unknown>;
  if (detection.condition !== 'all of selection_* and not filter_automation')
    throw new Error(
      'This local replay supports “all of selection_* and not filter_automation”. Use the included PowerShell template to run the sample.',
    );
  const selectors = Object.entries(detection).filter(([name]) => name.startsWith('selection_'));
  if (!selectors.length || !isRecord(detection.filter_automation))
    throw new Error('Include selection_* mappings and filter_automation for the sample replay.');
  function matches(selector: unknown, event: ReplayEvent): boolean {
    if (!isRecord(selector) || Object.keys(selector).length === 0)
      throw new Error('Sample replay expects each selector to be a nonempty field mapping.');
    const checks = Object.entries(selector).map(([key, expected]) => {
      const [field, operator, ...modifiers] = key.split('|');
      if (
        !['Image', 'CommandLine', 'ParentImage'].includes(field) ||
        modifiers.some((modifier) => modifier !== 'all') ||
        !['endswith', 'startswith', 'contains', undefined].includes(operator)
      )
        throw new Error(
          `The local replay does not support ${key}. Use Image, CommandLine, or ParentImage with contains, startswith, or endswith.`,
        );
      const actual = String(event[field as keyof ReplayEvent]).toLowerCase();
      const values = Array.isArray(expected) ? expected : [expected];
      if (values.length === 0) throw new Error(`Provide at least one text value for ${key}.`);
      const test = (value: unknown) => {
        if (typeof value !== 'string') throw new Error(`Use text values for ${key}.`);
        if (/[?*]/.test(value))
          throw new Error('Wildcard values are not supported by this local sample replay.');
        const needle = value.toLowerCase();
        return operator === 'endswith'
          ? actual.endsWith(needle)
          : operator === 'startswith'
            ? actual.startsWith(needle)
            : operator === 'contains'
              ? actual.includes(needle)
              : actual === needle;
      };
      const results = values.map(test);
      return modifiers.includes('all') ? results.every(Boolean) : results.some(Boolean);
    });
    return checks.every(Boolean);
  }
  // Validate selectors even if an early predicate would short-circuit all sample events.
  for (const selector of [...selectors.map(([, value]) => value), detection.filter_automation])
    matches(selector, ruleReplayEvents[0]);
  return ruleReplayEvents.map((event) => ({
    ...event,
    matched:
      selectors.every(([, selector]) => matches(selector, event)) &&
      !matches(detection.filter_automation, event),
  }));
}
export function setRuleMetadata(
  source: string,
  details: { name: string; description: string; severity: string; id?: string },
): string {
  try {
    const document = parseDocument(source);
    if (document.errors.length) return source;
    document.set('title', details.name);
    if (details.id) document.set('id', details.id);
    document.set('description', details.description);
    document.set('level', details.severity === 'info' ? 'informational' : details.severity);
    return document.toString();
  } catch {
    return source;
  }
}
export function proposeOfficeRule(source: string): string {
  const document = parseDocument(source);
  if (document.errors.length) throw new Error('Fix YAML syntax before asking for a rule proposal.');
  document.setIn(['detection', 'selection_parent'], {
    'ParentImage|endswith': ['\\winword.exe', '\\excel.exe', '\\outlook.exe'],
  });
  document.set('level', 'critical');
  return document.toString();
}
