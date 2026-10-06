import type { Severity } from '@/components/severity-badge';
import type { AlertStatus } from '@/components/status-badge';
export type AlertSource = 'EDR' | 'Firewall' | 'Identity' | 'DNS';
export interface Analyst {
  id: string;
  name: string;
  initials: string;
  role: string;
}
export interface AlertEntity {
  type: 'user' | 'host' | 'ip';
  name: string;
  detail: string;
}
export interface AlertEvent {
  id: string;
  timestamp: string;
  action: string;
  sourceIp: string;
  destinationIp: string;
  user: string;
  host: string;
  payload: Record<string, unknown>;
}
export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  source: AlertSource;
  technique: string;
  yaml: string;
}
export interface Alert {
  id: string;
  title: string;
  severity: Severity;
  status: AlertStatus;
  source: AlertSource;
  mitre: { id: string; name: string };
  entity: AlertEntity;
  eventCount: number;
  firstSeen: string;
  lastSeen: string;
  assignee?: Analyst;
  tags: string[];
  sparkline: number[];
  events: AlertEvent[];
  ruleId: string;
  aiVerdict: { verdict: string; confidence: number };
}
export interface SeverityBucket {
  time: string;
  label: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  total: number;
}
export interface TranscriptFixture {
  id: string;
  title: string;
  response: string;
  steps: { label: string; status: 'complete' | 'working' }[];
  evidence: string[];
}
