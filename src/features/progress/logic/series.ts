/** Trend and chart helpers for one metric's entries (oldest first). */

export type Trend = 'up' | 'down' | 'same';

/**
 * Direction from the previous to the latest value. Changes smaller than `tolerance` count as
 * "same". Returns null with fewer than two values.
 */
export function trend(values: readonly number[], tolerance = 0): Trend | null {
  const [previous, latest] = values.slice(-2);
  if (previous === undefined || latest === undefined) {
    return null;
  }
  const diff = latest - previous;
  if (Math.abs(diff) <= tolerance) {
    return 'same';
  }
  return diff > 0 ? 'up' : 'down';
}

export type ChartScale = { offset: number; span: number; step: number; sections: number };

/** A "nice" step (1, 2, 2.5 or 5 × 10ⁿ) at least `raw`. */
function niceStep(raw: number): number {
  const power = 10 ** Math.floor(Math.log10(raw));
  const nice = [1, 2, 2.5, 5, 10].find(m => m * power >= raw - 1e-9) ?? 10;
  return nice * power;
}

/**
 * Y-axis scale with round tick values covering every value (data points and reference lines).
 * `offset` is the axis bottom, `span` the distance to the top. Never goes below zero.
 */
export function chartScale(values: readonly number[], sections = 4): ChartScale {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = hi === lo ? Math.max(Math.abs(hi) * 0.1, 1) : (hi - lo) * 0.1;
  const min = Math.max(0, lo - pad);
  const max = hi + pad;
  let step = niceStep((max - min) / sections);
  let offset = Math.floor(min / step) * step;
  while (offset + step * sections < max) {
    step = niceStep(step * 1.01);
    offset = Math.floor(min / step) * step;
  }
  return { offset, span: step * sections, step, sections };
}

/**
 * Reduces a series to at most `max` points for drawing. Keeps the first and last point and, for
 * each bucket in between, its lowest and highest point (in original order), so peaks and dips
 * stay visible. Returns the input unchanged when it is already small enough.
 */
export function downsample<T>(items: readonly T[], max: number, value: (item: T) => number): T[] {
  const first = items[0];
  const last = items[items.length - 1];
  if (items.length <= max || max < 4 || first === undefined || last === undefined) {
    return [...items];
  }
  const inner = items.slice(1, -1);
  const bucketCount = Math.floor((max - 2) / 2);
  const bucketSize = inner.length / bucketCount;
  const picked: T[] = [first];
  for (let b = 0; b < bucketCount; b++) {
    const bucket = inner.slice(Math.floor(b * bucketSize), Math.floor((b + 1) * bucketSize));
    const head = bucket[0];
    if (head === undefined) {
      continue;
    }
    let lo: { index: number; item: T } = { index: 0, item: head };
    let hi = lo;
    bucket.forEach((item, index) => {
      if (value(item) < value(lo.item)) {
        lo = { index, item };
      }
      if (value(item) > value(hi.item)) {
        hi = { index, item };
      }
    });
    // Push in original order; only once when lowest and highest are the same point.
    if (lo.index === hi.index) {
      picked.push(lo.item);
    } else {
      const [earlier, later] = lo.index < hi.index ? [lo, hi] : [hi, lo];
      picked.push(earlier.item, later.item);
    }
  }
  picked.push(last);
  return picked;
}
