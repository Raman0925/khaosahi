/** Per-metric summary used by the Progress tab cards and the chart's text alternative. */
import type { TFunction } from 'i18next';

import type { Sex } from '@/shared/profile';
import type { Metric, ProgressEntry } from '@/shared/progress';
import { round } from '@/shared/utils/numbers';

import { formatDate, valueText } from './format';
import { normalRange, rangeStatus } from './logic/normalRanges';
import { trend } from './logic/series';
import { decimalsFor, toDisplay, type UnitPrefs } from './logic/units';

export type MetricSummary = {
  /** e.g. "Latest: 80.5 kg on 21 Nov 2026"; null without entries. */
  latest: string | null;
  latestValue: string | null;
  latestDate: string | null;
  trend: string | null;
  status: string | null;
};

/** `entries` are one metric's entries, oldest first. */
export function summarise(
  t: TFunction,
  language: string,
  metric: Metric,
  entries: readonly ProgressEntry[],
  prefs: UnitPrefs,
  sex: Sex | null,
): MetricSummary {
  const last = entries[entries.length - 1];
  if (!last) {
    return { latest: null, latestValue: null, latestDate: null, trend: null, status: null };
  }
  const value = valueText(t, metric, last.value, prefs);
  const date = formatDate(last.date, language);
  // Compare what the user sees (rounded in their unit), so 80.04 → 80.0 reads as "same".
  const shown = entries
    .slice(-2)
    .map(entry => round(toDisplay(metric, entry.value, prefs), decimalsFor(metric)));
  const direction = trend(shown);
  const range = normalRange(metric, sex);
  return {
    latest: t('progress.latest', { value, date }),
    latestValue: value,
    latestDate: date,
    trend: direction ? t(`progress.trend.${direction}`) : null,
    status: range ? t(`progress.status.${rangeStatus(last.value, range)}`) : null,
  };
}
