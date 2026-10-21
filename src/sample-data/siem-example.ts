import type { Alert, DetectionRule } from './types';
import type { Severity } from '@/components/severity-badge';
import { analysts } from './fixtures';

/** Connected sample records for the SIEM example. All timestamps use the same fixed clock. */
export const siemExampleTime = Date.UTC(2026, 9, 21, 20, 10);
export interface SiemExampleRule extends DetectionRule {
  severity: Severity;
  enabled: boolean;
  schedule: string;
  updatedAt: string;
  tactic: string;
  category: string;
  sql: string;
}
const definitions: [string, string, Severity, string, string, Alert['source']][] = [
  [
    'ah-data-exfiltration-demo',
    'Potential data exfiltration',
    'critical',
    'T1567',
    'Exfiltration over web service',
    'Firewall',
  ],
  [
    'ah-suspicious-command-demo',
    'Suspicious endpoint execution',
    'high',
    'T1059.001',
    'PowerShell',
    'EDR',
  ],
  [
    'ah-unexpected-privileged-access',
    'Unexpected privileged access',
    'critical',
    'T1078',
    'Valid accounts',
    'Identity',
  ],
  [
    'ah-critical-vulnerability-demo',
    'Critical internet-exposed vulnerability',
    'critical',
    'T1190',
    'Exploit public-facing application',
    'EDR',
  ],
  [
    'ah-lateral-movement-demo',
    'Lateral movement',
    'high',
    'T1021.002',
    'SMB/Windows Admin Shares',
    'EDR',
  ],
  [
    'ah-unusual-data-access-demo',
    'Unusual bulk data access',
    'high',
    'T1213',
    'Data from information repositories',
    'Identity',
  ],
  [
    'ah-high-risk-activity-demo',
    'High-risk security activity',
    'high',
    'T1078',
    'Valid accounts',
    'Identity',
  ],
  ['ah-brute-force-demo', 'Credential access', 'high', 'T1110', 'Brute force', 'Identity'],
  [
    'ah-malware-detection-demo',
    'Malware detected on endpoint',
    'critical',
    'T1204',
    'User execution',
    'EDR',
  ],
  ['ah-credential-phishing-demo', 'Credential phishing email', 'high', 'T1566', 'Phishing', 'EDR'],
  [
    'ah-suspicious-cloud-priv-activity-demo',
    'Cloud privilege misuse',
    'high',
    'T1098',
    'Account manipulation',
    'Identity',
  ],
  [
    'ah-threat-intelligence-match',
    'Threat intelligence match',
    'medium',
    'T1071.004',
    'DNS',
    'DNS',
  ],
];
export const siemExampleRules: SiemExampleRule[] = definitions.map(
  ([name, title, severity, technique, techniqueName, source], i) => ({
    id: `main.default.${name}`,
    name,
    severity,
    source,
    technique,
    description: `${title}: correlate related security events and create an alert when the detection threshold is reached.`,
    enabled: true,
    schedule: 'Every 10m',
    updatedAt: new Date(Date.UTC(2026, 9, 12, 13, 16 + i * 13)).toISOString(),
    tactic:
      technique === 'T1110'
        ? 'Credential Access'
        : technique === 'T1567'
          ? 'Exfiltration'
          : 'Detection',
    category: 'Behavioral',
    sql:
      technique === 'T1110'
        ? "SELECT\n  user_email,\n  src_ip,\n  COUNT(*) AS failed_attempts,\n  MAX(event_time) AS event_time\nFROM main.default.security_events\nWHERE event_type = 'authentication'\n  AND result = 'failure'\nGROUP BY user_email, src_ip\nHAVING COUNT(*) >= 3"
        : `SELECT\n  event_time, user_email, src_ip, resource_name\nFROM main.default.security_events\nWHERE detection_name = '${name}'\n  AND event_time >= current_timestamp() - INTERVAL 10 MINUTES`,
    yaml: `title: ${title}\nid: ${name}\nstatus: stable\nlevel: ${severity}\nlogsource:\n  product: ${source.toLowerCase()}\ndetection:\n  selection:\n    rule_name: ${name}\n  condition: selection\ntags:\n  - attack.${technique.toLowerCase()}\ndescription: ${techniqueName}`,
  }),
);
const counts = [2, 13, 12, 13, 26, 13, 26, 6, 26, 26, 39, 8];
export interface SiemExampleAlert extends Alert {
  createdAt: string;
  updatedAt: string;
  exportedTo: string[];
}
export const siemExampleAlerts: SiemExampleAlert[] = Array.from({ length: 60 }, (_, i) => {
  const definition = definitions[i % definitions.length];
  const rule = siemExampleRules[i % definitions.length];
  const eventCount = counts[i % counts.length];
  const created = siemExampleTime - (20 + i * 17) * 60_000;
  const timestamp = new Date(created).toISOString();
  const status =
    i < 12 || i % 4 === 0
      ? 'new'
      : i % 4 === 1
        ? 'in-progress'
        : i % 4 === 2
          ? 'resolved'
          : 'triaged';
  const events = Array.from({ length: eventCount }, (_, n) => ({
    id: `sig-${2816 - i}-${String(n + 1).padStart(3, '0')}`,
    timestamp: new Date(created - (eventCount - n) * 9000).toISOString(),
    action: definition[1],
    sourceIp: '10.42.8.16',
    destinationIp: '198.51.100.77',
    user: 'david.bakker',
    host: 'WS-LON-082',
    payload: {
      user_id: 'u-1004',
      user_name: 'David Bakker',
      user_email: 'david.bakker@example.com',
      user_role: 'cloud_engineer',
      resource_type: i % 3 === 0 ? 'external_endpoint' : 'workstation',
      resource_name: i % 3 === 0 ? '198.51.100.77' : 'WS-LON-082',
      detection_name: rule.name,
      rule_version: 1,
      bytes_transferred: 1048576 * (n + 1),
      outcome: 'observed',
    },
  }));
  return {
    id: `SEC-${2816 - i}`,
    title: definition[1],
    severity: definition[2],
    status,
    source: definition[5],
    mitre: { id: definition[3], name: definition[4] },
    entity: { type: 'user', name: 'david.bakker', detail: 'Northstar · Cloud engineering' },
    eventCount,
    firstSeen: events[0].timestamp,
    lastSeen: timestamp,
    createdAt: timestamp,
    updatedAt: new Date(created + (i % 3) * 120_000).toISOString(),
    exportedTo: i > 11 && i % 5 === 0 ? ['Jira'] : [],
    assignee: i < 12 || i % 3 === 0 ? undefined : analysts[i % analysts.length],
    tags: ['main.default', rule.name],
    sparkline: Array.from({ length: 24 }, (_, n) =>
      Math.max(0, Math.round(3 + Math.sin(n + i) * 3 + (n > 18 ? 8 : 0))),
    ),
    events,
    ruleId: rule.id,
    aiVerdict: {
      verdict: 'Review the correlated signals and confirm the affected resources.',
      confidence: 0.86,
    },
  };
});
export const detectionActivity = [10100, 9300, 9900, 6100, 7000, 9700, 9700].map((value, i) => ({
  label: `Oct ${15 + i}`,
  value,
}));
export const ingestionActivity = [920000, 1040000, 1010000, 890000, 1100000, 1320200, 719800].map(
  (value, i) => ({ label: `Oct ${15 + i}`, value }),
);
export const siemSystemErrors = [
  {
    id: 'ERR-104',
    source: 'Slack API',
    message: 'Authentication token expired',
    severity: 'high' as const,
    time: '2026-10-21T19:48:00.000Z',
    state: 'Open',
  },
  {
    id: 'ERR-103',
    source: 'GitHub audit',
    message: 'Unexpected field in incoming record',
    severity: 'medium' as const,
    time: '2026-10-21T19:32:00.000Z',
    state: 'Open',
  },
  {
    id: 'ERR-102',
    source: 'CloudTrail',
    message: 'Rate limit exceeded; retry scheduled',
    severity: 'low' as const,
    time: '2026-10-21T19:15:00.000Z',
    state: 'Retrying',
  },
  {
    id: 'ERR-101',
    source: 'CloudWatch',
    message: 'Log stream access denied',
    severity: 'high' as const,
    time: '2026-10-21T19:04:00.000Z',
    state: 'Open',
  },
  {
    id: 'ERR-100',
    source: 'Workday API',
    message: 'Request timed out; retry scheduled',
    severity: 'medium' as const,
    time: '2026-10-21T18:52:00.000Z',
    state: 'Retrying',
  },
];
export function formatSiemTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Europe/Athens',
  }).format(new Date(value));
}
export const siemStateLabels = {
  new: 'Open',
  triaged: 'Triaged',
  'in-progress': 'In progress',
  resolved: 'Closed',
  'false-positive': 'False positive',
};
