/** Everything the metric chart draws, computed from entries (pure). */
import type { Sex } from '@/shared/profile';
import type { Metric, ProgressEntry } from '@/shared/progress';
import { fromDateKey } from '@/shared/utils/dates';
import { round } from '@/shared/utils/numbers';

import { normalRange, waistCutoffCm } from './normalRanges';
import { type ChartScale, chartScale, downsample } from './series';
import { decimalsFor, toDisplay, type UnitPrefs } from './units';

/** At most this many points are drawn; the full list is shown below the chart. */
export const MAX_CHART_POINTS = 60;

export type ChartModel = {
  data: { value: number; label: string }[];
  /** Dashed reference lines in display units (normal-range limits or the waist risk line). */
  lines: number[];
  scale: ChartScale;
};

function shortDate(key: string, language: string): string {
  return fromDateKey(key).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function chartModel(
  metric: Metric,
  entries: readonly ProgressEntry[],
  prefs: UnitPrefs,
  sex: Sex | null,
  language: string,
): ChartModel {
  const display = (canonical: number) =>
    round(toDisplay(metric, canonical, prefs), decimalsFor(metric));
  const range = normalRange(metric, sex);
  const lines = range
    ? [range.max, range.min].filter((v): v is number => v !== undefined).map(display)
    : metric === 'waist'
      ? [display(waistCutoffCm(sex))]
      : [];
  const points = downsample(entries, MAX_CHART_POINTS, entry => entry.value);
  // Label only first, middle and last points so dates never overlap.
  const labelled = new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]);
  const data = points.map((entry, index) => ({
    value: display(entry.value),
    label: labelled.has(index) ? shortDate(entry.date, language) : '',
  }));
  return { data, lines, scale: chartScale([...data.map(d => d.value), ...lines]) };
}
