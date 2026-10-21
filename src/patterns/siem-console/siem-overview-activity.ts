import { resolveTimeRange, type TimeRange } from '@/lib/time-range';
import { detectionActivity, ingestionActivity, siemExampleTime } from '@/sample-data/siem-example';

const day = 24 * 60 * 60 * 1000;
const availableFrom = siemExampleTime - ingestionActivity.length * day;

/** The fixture contains complete rolling 24-hour buckets, ending at its snapshot time. */
export function getOverviewActivity(range: TimeRange, now = siemExampleTime) {
  const { from, to } = resolveTimeRange(range, now);
  const indices = ingestionActivity.flatMap((_, index) => {
    const start = availableFrom + index * day;
    const end = start + day;
    return start >= +from && end <= +to ? [index] : [];
  });
  const ingestion = indices.map((index) => ingestionActivity[index]);
  const detection = indices.map((index) => detectionActivity[index]);
  const isFullWeek = +from === availableFrom && +to === siemExampleTime;
  const first = ingestion[0];
  const last = ingestion.at(-1);
  const dateLabel =
    first && last ? (first === last ? first.label : `${first.label}–${last.label}`) : '';
  const emptyMessage = indices.length
    ? undefined
    : +to - +from < day
      ? 'Choose a range of at least 24 hours to view daily activity.'
      : 'No complete daily activity buckets are available in this range.';
  return {
    ingestion,
    detection,
    isFullWeek,
    coverageLabel: indices.length
      ? `${dateLabel} · ${indices.length} available 24-hour ${indices.length === 1 ? 'bucket' : 'buckets'} · GMT+3`
      : 'Daily activity available for Oct 15–21 · GMT+3',
    periodLabel: isFullWeek ? 'in past 7d' : 'in available daily buckets',
    emptyMessage,
  };
}
