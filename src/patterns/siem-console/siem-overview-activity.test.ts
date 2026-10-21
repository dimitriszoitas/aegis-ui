import { describe, expect, it } from 'vitest';
import { siemExampleTime } from '@/sample-data/siem-example';
import { getOverviewActivity } from './siem-overview-activity';

describe('Overview daily activity range', () => {
  it('keeps exact totals for the full week and the latest complete day', () => {
    const week = getOverviewActivity({ mode: 'relative', preset: '7d' });
    expect(week.ingestion.reduce((sum, item) => sum + item.value, 0)).toBe(7_000_000);
    expect(week.detection.reduce((sum, item) => sum + item.value, 0)).toBe(61_800);
    expect(week.isFullWeek).toBe(true);
    const latest = getOverviewActivity({ mode: 'relative', preset: '24h' });
    expect(latest.ingestion.map((item) => item.value)).toEqual([719_800]);
    expect(latest.detection.map((item) => item.value)).toEqual([9_700]);
    expect(latest.isFullWeek).toBe(false);
  });

  it('does not invent sub-day or unavailable history', () => {
    expect(getOverviewActivity({ mode: 'relative', preset: '1h' }).ingestion).toEqual([]);
    const month = getOverviewActivity({ mode: 'relative', preset: '30d' });
    expect(month.ingestion).toHaveLength(7);
    expect(month.coverageLabel).toContain('7 available 24-hour buckets');
    expect(month.isFullWeek).toBe(false);
    const outside = getOverviewActivity({
      mode: 'absolute',
      from: '2026-09-01T00:00:00Z',
      to: '2026-09-08T00:00:00Z',
    });
    expect(outside.ingestion).toEqual([]);
    expect(outside.emptyMessage).toContain('No complete daily');
  });

  it('includes only complete buckets inside an absolute interval', () => {
    const day = 86_400_000;
    const range = getOverviewActivity({
      mode: 'absolute',
      from: new Date(siemExampleTime - 3 * day + 1).toISOString(),
      to: new Date(siemExampleTime - day).toISOString(),
    });
    expect(range.ingestion.map((item) => item.label)).toEqual(['Oct 20']);
    expect(range.ingestion[0].value).toBe(1_320_200);
  });
});
