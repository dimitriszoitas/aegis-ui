/** Deterministic illustrative ingestion telemetry; no external services are connected. */
export const datasourceProviders = [
  'Amazon S3',
  'Slack API',
  'CloudWatch',
  'Workday API',
  'Azure Event Hub',
] as const;
export type DatasourceProvider = (typeof datasourceProviders)[number];
export type DatasourceRun = 'success' | 'error' | 'not-run';
export interface ConsoleDatasource {
  id: string;
  name: string;
  provider: DatasourceProvider;
  group: string;
  schedule: string;
  errors: number;
  unparsed: number;
  created: string;
  runs: DatasourceRun[];
  events: number[];
}
export const datasourceDays = [
  'Oct 15',
  'Oct 16',
  'Oct 17',
  'Oct 18',
  'Oct 19',
  'Oct 20',
  'Oct 21',
];
export const datasourceSnapshot = '2026-10-21T12:00:00.000Z';
export const datasourceSchedules = [
  'Every 5 minutes',
  'Every 15 minutes',
  'Hourly',
  'Daily',
  'Manual',
];

const namedSources: readonly [string, DatasourceProvider][] = [
  ['cuj1-vpcflow-new-misconfig', 'Amazon S3'],
  ['cuj2-cloudflare-sporadic-noise', 'Amazon S3'],
  ['cuj3-github-audit-format-change', 'Amazon S3'],
  ['slacktest', 'Slack API'],
  ['lets_cloudwatch_lw65120', 'CloudWatch'],
  ['adam-workday', 'Workday API'],
  ['cu147', 'Azure Event Hub'],
  ['unmatched-records', 'Amazon S3'],
  ['cloudtrail', 'Amazon S3'],
  ['lw_test3', 'Amazon S3'],
];

/** Integer allocation preserves totals exactly, including rounding remainders. */
function distribute(total: number, weights: readonly number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  const values = weights.map((weight) => Math.floor((total * weight) / sum));
  const remaining = total - values.reduce((a, b) => a + b, 0);
  const recipients = weights.flatMap((weight, index) => (weight > 0 ? [index] : []));
  for (let index = 0; index < remaining; index++)
    values[recipients[index % recipients.length]] += 1;
  return values;
}
const weights = Array.from({ length: 72 }, (_, index) => 3 + ((index * 17) % 31));
const dailyTotals = [1100000, 1050000, 980000, 1050200, 1100000, 1000000, 719800];
const byDay = dailyTotals.map((total, day) =>
  distribute(
    total,
    weights.map((weight, index) => weight + ((index + day * 3) % 9)),
  ),
);
const errors = distribute(
  7000,
  weights.map((weight, index) => (index % 5 === 0 ? weight : 0)),
);
const unparsed = distribute(
  378000,
  weights.map((weight, index) => (index % 3 === 0 ? weight : 0)),
);

export function createDatasourceFixtures(): ConsoleDatasource[] {
  return weights.map((_, index) => {
    const provider =
      namedSources[index]?.[1] ?? datasourceProviders[index % datasourceProviders.length];
    return {
      id: `source-${index + 1}`,
      name:
        namedSources[index]?.[0] ??
        `${provider.toLowerCase().replaceAll(' ', '-')}-${String(index + 1).padStart(2, '0')}`,
      provider,
      group: ['Production', 'Infrastructure', 'Security', 'Workplace'][index % 4],
      schedule: datasourceSchedules[index % 4],
      errors: errors[index],
      unparsed: unparsed[index],
      created: new Date(Date.parse(datasourceSnapshot) - (index + 3) * 86400000).toISOString(),
      runs: Array.from({ length: 6 }, (_, run): DatasourceRun =>
        errors[index] > 0 && run === index % 6 ? 'error' : 'success',
      ),
      events: byDay.map((day) => day[index]),
    };
  });
}
export const datasourceEventTotal = (source: ConsoleDatasource) =>
  source.events.reduce((sum, value) => sum + value, 0);
