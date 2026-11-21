import type { Metric, ProgressEntry } from '@/shared/progress';
import type { DateKey } from '@/shared/utils/dates';

/** Metrics compared on the Day-90 summary. */
export const SUMMARY_METRICS = ['weight', 'waist', 'alt', 'ast', 'uricAcid'] as const;
export type SummaryMetric = (typeof SUMMARY_METRICS)[number];

export type MetricComparison = {
  metric: Metric;
  first: ProgressEntry;
  /** `null` when there is only one reading. */
  latest: ProgressEntry | null;
};

function byDate(a: ProgressEntry, b: ProgressEntry): number {
  return a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt);
}

/**
 * First vs latest reading of a metric for the plan that started on `startDate`.
 * "First" is the last reading on or before the start (the baseline), or else the first reading
 * after it. Returns `null` when the metric was never logged.
 */
export function metricComparison(
  entries: readonly ProgressEntry[],
  metric: Metric,
  startDate: DateKey,
): MetricComparison | null {
  const sorted = entries.filter(entry => entry.metric === metric).sort(byDate);
  const beforeStart = sorted.filter(entry => entry.date <= startDate);
  const first = beforeStart[beforeStart.length - 1] ?? sorted[0];
  if (!first) {
    return null;
  }
  const last = sorted[sorted.length - 1] ?? first;
  return { metric, first, latest: last === first ? null : last };
}
