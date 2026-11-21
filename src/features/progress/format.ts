/** Formatting helpers shared by the progress and reminder screens. */
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import type { ReminderTime } from '@/shared/notifications';
import { usePreferences } from '@/shared/preferences/store';
import type { Metric } from '@/shared/progress';
import { fromDateKey, type DateKey } from '@/shared/utils/dates';

import { formatValue, unitFor, type UnitPrefs } from './logic/units';

function locale(language: string): string {
  return language === 'hi' ? 'hi-IN' : 'en-IN';
}

/** "21 Nov 2026" / "21 नव॰ 2026". */
export function formatDate(key: DateKey, language: string): string {
  return fromDateKey(key).toLocaleDateString(locale(language), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "8:00 am" style local time. */
export function formatTime(time: ReminderTime, language: string): string {
  return new Date(2000, 0, 1, time.hour, time.minute).toLocaleTimeString(locale(language), {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function unitText(t: TFunction, metric: Metric, prefs: UnitPrefs): string {
  const unit = unitFor(metric, prefs);
  return unit ? t(`common.units.${unit}`) : '';
}

/** "80.5 kg", "42 U/L" or "Grade 1". */
export function valueText(t: TFunction, metric: Metric, value: number, prefs: UnitPrefs): string {
  if (metric === 'ultrasound') {
    const grade = String(Math.round(value)) as '0' | '1' | '2' | '3';
    return t(`progress.grades.${grade}`);
  }
  return `${formatValue(metric, value, prefs)} ${unitText(t, metric, prefs)}`;
}

/** The user's weight/length units. */
export function useUnitPrefs(): UnitPrefs {
  return usePreferences(
    useShallow(state => ({ weightUnit: state.weightUnit, lengthUnit: state.lengthUnit })),
  );
}

/** `t` plus the current language, for date formatting. */
export function useLocaleT() {
  const { t, i18n } = useTranslation();
  return { t, language: i18n.language };
}
