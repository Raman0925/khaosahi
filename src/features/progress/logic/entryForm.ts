/** Validation for the progress entry form (values in the user's units). */
import { z } from 'zod';

import type { Metric } from '@/shared/progress';
import { isDateKey, todayKey } from '@/shared/utils/dates';
import { parseDecimal, round } from '@/shared/utils/numbers';

import { decimalsFor, fromInput, inputRange, type UnitPrefs } from './units';

/** Error codes in schema messages; the screen turns them into translated text. */
export type EntryErrorCode = 'required' | 'number' | 'range' | 'futureDate';

export type EntryFormValues = { value: string; date: string };

export function entryFormSchema(metric: Metric, prefs: UnitPrefs, now: Date = new Date()) {
  const range = inputRange(metric, prefs);
  return z.object({
    value: z.string().superRefine((text, ctx) => {
      if (text.trim() === '') {
        ctx.addIssue({ code: 'custom', message: 'required' satisfies EntryErrorCode });
        return;
      }
      const parsed = parseDecimal(text);
      if (parsed === null) {
        ctx.addIssue({ code: 'custom', message: 'number' satisfies EntryErrorCode });
        return;
      }
      if (parsed < range.min || parsed > range.max) {
        ctx.addIssue({ code: 'custom', message: 'range' satisfies EntryErrorCode });
      }
    }),
    date: z.string().superRefine((date, ctx) => {
      if (!isDateKey(date)) {
        ctx.addIssue({ code: 'custom', message: 'required' satisfies EntryErrorCode });
      } else if (date > todayKey(now)) {
        ctx.addIssue({ code: 'custom', message: 'futureDate' satisfies EntryErrorCode });
      }
    }),
  });
}

/** Canonical value to store for valid form text. */
export function toCanonical(metric: Metric, text: string, prefs: UnitPrefs): number {
  const parsed = parseDecimal(text);
  if (parsed === null) {
    throw new Error('toCanonical called with invalid input');
  }
  // Round in the user's unit first (what they typed), then keep enough precision in storage.
  return round(fromInput(metric, round(parsed, decimalsFor(metric)), prefs), 3);
}
