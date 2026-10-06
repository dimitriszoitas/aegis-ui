import type { Severity } from '@/components/severity-badge';
import type { AlertStatus } from '@/components/status-badge';
import { seededRandom } from '@/lib/seeded-random';
import { rules } from './rules';
import type {
  Alert,
  Analyst,
  AlertEvent,
  AlertSource,
  SeverityBucket,
  TranscriptFixture,
} from './types';
/** Fixed demo clock keeps fixtures and relative filters reproducible across reloads. */
export const referenceTime = Date.UTC(2026, 9, 6, 8, 30);
export const analysts: Analyst[] = [
  { id: 'elena', name: 'Elena Vasquez', initials: 'EV', role: 'Senior detection analyst' },
  { id: 'marcus', name: 'Marcus Chen', initials: 'MC', role: 'Incident responder' },
  { id: 'ravi', name: 'Ravi Patel', initials: 'RP', role: 'Threat hunter' },
  { id: 'zoe', name: 'Zoe Ivanova', initials: 'ZI', role: 'Detection engineer' },
];
const users = [
  'k.nakamura',
  'm.chen',
  'a.papadopoulos',
  's.andersson',
  'r.patel',
  'e.vasquez',
  'j.morgan',
  'l.dubois',
];
const hosts = [
  'WS-ATH-114',
  'WS-LON-082',
  'SRV-PROD-09',
  'WS-BER-027',
  'DC-ATH-02',
  'SRV-DB-04',
  'WS-PAR-061',
  'OWA-EU-01',
];
const scenarios: {
  title: (user: string, host: string) => string;
  severity: Severity;
  source: AlertSource;
  technique: string;
  techniqueName: string;
  rule: number;
  tags: string[];
  entity: 'user' | 'host' | 'ip';
}[] = [
  {
    title: (u) => `Impossible travel for ${u}`,
    severity: 'high',
    source: 'Identity',
    technique: 'T1078',
    techniqueName: 'Valid accounts',
    rule: 0,
    tags: ['Identity', 'Geo anomaly'],
    entity: 'user',
  },
  {
    title: (_, h) => `Encoded PowerShell command on ${h}`,
    severity: 'critical',
    source: 'EDR',
    technique: 'T1059.001',
    techniqueName: 'PowerShell',
    rule: 2,
    tags: ['Execution', 'PowerShell'],
    entity: 'host',
  },
  {
    title: () => 'Brute force against OWA from 185.220.101.46',
    severity: 'high',
    source: 'Identity',
    technique: 'T1110',
    techniqueName: 'Brute force',
    rule: 1,
    tags: ['Credential access', 'External IP'],
    entity: 'ip',
  },
  {
    title: (_, h) => `High-entropy DNS queries from ${h}`,
    severity: 'medium',
    source: 'DNS',
    technique: 'T1071.004',
    techniqueName: 'DNS',
    rule: 3,
    tags: ['DNS tunneling', 'Command and control'],
    entity: 'host',
  },
  {
    title: (u) => `Unusual cloud storage upload by ${u}`,
    severity: 'critical',
    source: 'Firewall',
    technique: 'T1567',
    techniqueName: 'Exfiltration over web service',
    rule: 4,
    tags: ['Exfiltration', 'Cloud storage'],
    entity: 'user',
  },
  {
    title: (u) => `Repeated MFA prompts for ${u}`,
    severity: 'high',
    source: 'Identity',
    technique: 'T1621',
    techniqueName: 'Multi-factor authentication request generation',
    rule: 5,
    tags: ['MFA fatigue', 'Identity'],
    entity: 'user',
  },
  {
    title: (_, h) => `Remote service creation on ${h}`,
    severity: 'high',
    source: 'EDR',
    technique: 'T1543.003',
    techniqueName: 'Windows service',
    rule: 6,
    tags: ['Persistence', 'Lateral movement'],
    entity: 'host',
  },
  {
    title: (_, h) => `Suspicious TXT lookup burst from ${h}`,
    severity: 'medium',
    source: 'DNS',
    technique: 'T1071.004',
    techniqueName: 'DNS',
    rule: 3,
    tags: ['DNS', 'Unusual volume'],
    entity: 'host',
  },
  {
    title: (u) => `New sign-in location for ${u}`,
    severity: 'low',
    source: 'Identity',
    technique: 'T1078',
    techniqueName: 'Valid accounts',
    rule: 8,
    tags: ['Identity', 'New location'],
    entity: 'user',
  },
  {
    title: (_, h) => `Unusual outbound transfer from ${h}`,
    severity: 'medium',
    source: 'Firewall',
    technique: 'T1567',
    techniqueName: 'Exfiltration over web service',
    rule: 4,
    tags: ['Egress', 'Data transfer'],
    entity: 'host',
  },
  {
    title: (_, h) => `PowerShell launched by Office on ${h}`,
    severity: 'high',
    source: 'EDR',
    technique: 'T1059.001',
    techniqueName: 'PowerShell',
    rule: 2,
    tags: ['Office child process', 'Execution'],
    entity: 'host',
  },
  {
    title: (u) => `Authentication failure spike for ${u}`,
    severity: 'medium',
    source: 'Identity',
    technique: 'T1110',
    techniqueName: 'Brute force',
    rule: 1,
    tags: ['Authentication', 'Failed login'],
    entity: 'user',
  },
  {
    title: (_, h) => `Resolver anomaly detected on ${h}`,
    severity: 'low',
    source: 'DNS',
    technique: 'T1071.004',
    techniqueName: 'DNS',
    rule: 3,
    tags: ['Resolver', 'Baseline drift'],
    entity: 'host',
  },
  {
    title: (u) => `New device registered for ${u}`,
    severity: 'info',
    source: 'Identity',
    technique: 'T1098.005',
    techniqueName: 'Device registration',
    rule: 9,
    tags: ['Device enrollment', 'Identity'],
    entity: 'user',
  },
  {
    title: () => 'Repeated denied connections from 185.220.101.46',
    severity: 'medium',
    source: 'Firewall',
    technique: 'T1110',
    techniqueName: 'Brute force',
    rule: 7,
    tags: ['Perimeter', 'Denied traffic'],
    entity: 'ip',
  },
];
export function generateAlerts(count = 150, seed = 20261006): Alert[] {
  const random = seededRandom(seed);
  const statuses: AlertStatus[] = [
    'new',
    'new',
    'new',
    'triaged',
    'in-progress',
    'resolved',
    'false-positive',
  ];
  return Array.from({ length: Math.max(0, Math.floor(count)) }, (_, i) => {
    const scenario = scenarios[i % scenarios.length];
    const user = users[i % users.length],
      host = hosts[i % hosts.length];
    const sourceIp =
      scenario.entity === 'ip' ? '185.220.101.46' : `10.24.${12 + (i % 8)}.${40 + (i % 180)}`;
    const lastSeen = referenceTime - Math.floor(random() * 23.8 * 3600_000);
    const eventCount = 3 + Math.floor(random() * 240);
    const firstSeen = lastSeen - (5 + Math.floor(random() * 60)) * 60_000;
    const destinationIp =
      scenario.source === 'Firewall' && scenario.rule !== 7 ? '198.51.100.24' : '10.24.0.12';
    const dnsQuery =
      'q7n3bk8rv2mt9xp4dh6wl1zf5cj0sa8e.y3ur7iq9ow2nb6gd4vs1km5px0hc8fq2.telemetry-sync.example.net';
    const events: AlertEvent[] = Array.from({ length: 3 + Math.floor(random() * 6) }, (_, j) => {
      const timestamp = new Date(firstSeen + (j * (lastSeen - firstSeen)) / 7).toISOString();
      const action =
        scenario.source === 'EDR'
          ? scenario.rule === 6
            ? 'Service installed'
            : 'Process created'
          : scenario.source === 'DNS'
            ? 'DNS query observed'
            : scenario.source === 'Firewall'
              ? scenario.rule === 7
                ? 'Connection denied'
                : 'Outbound connection'
              : scenario.rule === 9
                ? 'Device registered'
                : scenario.rule === 5
                  ? 'MFA prompt denied'
                  : scenario.rule === 1
                    ? 'Sign-in failed'
                    : 'Sign-in evaluated';
      return {
        id: `EVT-${1048 + i}-${j + 1}`,
        timestamp,
        action,
        sourceIp,
        destinationIp,
        user,
        host,
        payload: {
          '@timestamp': timestamp,
          event: {
            kind: 'event',
            category:
              scenario.source === 'Identity'
                ? scenario.rule === 9
                  ? 'iam'
                  : 'authentication'
                : scenario.source === 'EDR'
                  ? 'process'
                  : 'network',
            action: action.toLowerCase().replaceAll(' ', '_'),
            outcome: [1, 5, 7].includes(scenario.rule) ? 'failure' : 'success',
          },
          user: { name: user, domain: 'NORTHSTAR' },
          host: { name: host, os: 'Windows 11 Enterprise' },
          source: { ip: sourceIp, geo: { country_iso_code: j % 2 ? 'GR' : 'NL' } },
          destination: { ip: destinationIp, port: scenario.source === 'DNS' ? 53 : 443 },
          ...(scenario.source === 'Identity'
            ? {
                UserPrincipalName: `${user}@northstar.internal`,
                ResultType: scenario.rule === 1 ? 50126 : scenario.rule === 5 ? 500121 : 0,
                RiskEventTypes: [0, 5, 8].includes(scenario.rule)
                  ? [
                      scenario.rule === 5
                        ? 'mfaFatigue'
                        : scenario.rule === 8
                          ? 'unfamiliarLocation'
                          : 'unlikelyTravel',
                    ]
                  : [],
                ...(scenario.rule === 1
                  ? { EventID: 4625, LogonType: 3, TargetServerName: 'OWA-EU-01' }
                  : {}),
                ...(scenario.rule === 5
                  ? { AuthenticationRequirement: 'multiFactorAuthentication' }
                  : {}),
                ...(scenario.rule === 9 ? { OperationName: 'Add device', Result: 'success' } : {}),
              }
            : {}),
          ...(scenario.source === 'EDR'
            ? {
                process: {
                  name: 'powershell.exe',
                  command_line:
                    'powershell.exe -NoProfile -EncodedCommand VwByAGkAdABlAC0ASABvAHMAdAAgACcAdABlAGwAZQBtAGUAdAByAHkAJwA=',
                  parent: { name: scenario.rule === 6 ? 'services.exe' : 'winword.exe' },
                },
                ...(scenario.rule === 6
                  ? {
                      EventID: 7045,
                      ServiceName: 'NorthstarUpdateCheck',
                      ImagePath:
                        'powershell.exe -NoProfile -EncodedCommand VwByAGkAdABlAC0ASABvAHMAdAA=',
                    }
                  : {
                      Image: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
                      CommandLine:
                        'powershell.exe -NoProfile -EncodedCommand VwByAGkAdABlAC0ASABvAHMAdAA=',
                      ParentImage:
                        'C:\\Program Files\\Microsoft Office\\root\\Office16\\winword.exe',
                    }),
              }
            : {}),
          ...(scenario.source === 'DNS'
            ? {
                dns: {
                  question: { name: dnsQuery, type: 'TXT' },
                  response_code: 'NOERROR',
                },
                query: dnsQuery,
                query_length: dnsQuery.length,
                subdomain_entropy: 4.7,
                qtype_name: 'TXT',
              }
            : {}),
          ...(scenario.source === 'Firewall'
            ? scenario.rule === 7
              ? {
                  event_action: 'deny',
                  application: 'outlook-web-access',
                  denied_connection_count: 37,
                }
              : {
                  http_method: 'POST',
                  bytes_sent: 142606336,
                  destination_category: 'cloud-storage',
                  tenant_id: 'external-unmanaged',
                  dest_host: 'files-transfer.example.net',
                }
            : {}),
        },
      };
    });
    return {
      id: `ALR-${1048 + i}`,
      title: scenario.title(user, host),
      severity: scenario.severity,
      status: statuses[i % statuses.length],
      source: scenario.source,
      mitre: { id: scenario.technique, name: scenario.techniqueName },
      entity: {
        type: scenario.entity,
        name: scenario.entity === 'user' ? user : scenario.entity === 'host' ? host : sourceIp,
        detail:
          scenario.entity === 'user'
            ? 'Northstar · Workforce identity'
            : scenario.entity === 'host'
              ? `10.24.${12 + (i % 8)}.${40 + (i % 180)}`
              : 'External · Tor exit network',
      },
      eventCount: Math.max(eventCount, events.length),
      firstSeen: new Date(firstSeen).toISOString(),
      lastSeen: new Date(lastSeen).toISOString(),
      assignee: i % 5 === 0 ? undefined : analysts[i % analysts.length],
      tags: [...scenario.tags],
      sparkline: Array.from({ length: 24 }, (_, hour) =>
        Math.round(random() * 25 + (hour > 17 ? random() * 70 : 0)),
      ),
      events,
      ruleId: rules[scenario.rule].id,
      aiVerdict: {
        verdict:
          scenario.severity === 'critical'
            ? 'Likely malicious'
            : scenario.severity === 'low' || scenario.severity === 'info'
              ? 'Likely benign'
              : 'Needs investigation',
        confidence: Math.round((0.64 + random() * 0.33) * 100) / 100,
      },
    };
  });
}
export const alerts = generateAlerts();
export const timeSeries: SeverityBucket[] = Array.from({ length: 48 }, (_, i) => {
  const random = seededRandom(710 + i);
  const factor = i > 31 && i < 40 ? 2.5 : 1;
  const critical = Math.floor(random() * 5 * factor),
    high = Math.floor(random() * 17 * factor),
    medium = Math.floor((16 + random() * 25) * factor),
    low = Math.floor(8 + random() * 18),
    info = Math.floor(3 + random() * 8);
  const date = new Date(referenceTime - (47 - i) * 30 * 60_000);
  return {
    time: date.toISOString(),
    label: date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }),
    critical,
    high,
    medium,
    low,
    info,
    total: critical + high + medium + low + info,
  };
});
export const aiTranscripts: TranscriptFixture[] = [
  {
    id: 'triage',
    title: 'Triage selected alerts',
    response:
      '## Two signals worth reviewing\n\nThe selected activity includes **unusual sign-in behavior** and an encoded PowerShell process launched by an Office application. The fixtures involve different users and hosts, so the evidence does not establish that they form one attack sequence.\n\n1. Verify whether k.nakamura was traveling or using an approved VPN.\n2. Review the parent process and command line on **WS-LON-082**.\n3. Compare the timelines and entities before linking these alerts.\n\n**Suggested next step:** assign the investigations and preserve the endpoint timeline. No containment or rule changes have been applied.',
    steps: [
      { label: 'Reviewed authentication and endpoint evidence', status: 'complete' },
      { label: 'Compared activity with detection logic', status: 'complete' },
      { label: 'Prepared analyst verification steps', status: 'complete' },
    ],
    evidence: ['ALR-1048', 'ALR-1049', 'DET-0114'],
  },
  {
    id: 'rule',
    title: 'Refine the PowerShell detection',
    response:
      'The current rule matches encoded PowerShell broadly. Requiring an **Office parent process** narrows the signal to a suspicious execution chain and may reduce noise from managed automation.\n\nI prepared a proposed YAML change for review. Validate it against historical events before enabling it. Approval remains with the analyst.',
    steps: [
      { label: 'Read the current Sigma detection', status: 'complete' },
      { label: 'Identified the Office parent condition', status: 'complete' },
    ],
    evidence: ['DET-0114'],
  },
  {
    id: 'summary',
    title: 'Summarize the investigation',
    response:
      'The current selection spans endpoint, identity, and network telemetry. **Prioritize critical alerts with related user or host entities**, then review recent identity changes.\n\nPreserve original event payloads and note whether the observed activity matches an approved change. The suggested verdicts are hypotheses based on the demo evidence, not final dispositions.',
    steps: [
      { label: 'Grouped selected signals by entity', status: 'complete' },
      { label: 'Prepared an evidence-led summary', status: 'complete' },
    ],
    evidence: ['ALR-1048', 'ALR-1049'],
  },
];
