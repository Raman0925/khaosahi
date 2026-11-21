import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import { i18next, initI18n } from '@/shared/i18n';
import { useChecklistHistory, usePlanStore } from '@/shared/plan';
import { usePreferences } from '@/shared/preferences/store';
import { useProgressStore } from '@/shared/progress';
import { resetAllStores } from '@/shared/storage';
import { addDays } from '@/shared/utils/dates';

import { screenProps, setUpPlan } from '../__fixtures__/screen';
import { Day90SummaryScreen } from '../screens/Day90SummaryScreen';

initI18n();

const TODAY = '2026-11-21';
const START = addDays(TODAY, -89); // today is day 90

beforeEach(async () => {
  jest.useFakeTimers({ now: new Date(2026, 10, 21, 9) });
  await act(async () => {
    resetAllStores();
    await i18next.changeLanguage('en');
  });
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

function seedPlan() {
  setUpPlan(new Date(2026, 10, 21, 9));
  usePlanStore.getState().startPlan('both:veg', START);
  // 60 complete days, 29 half days.
  useChecklistHistory.getState().addRows(
    Array.from({ length: 89 }, (_, n) => ({
      date: addDays(START, n),
      planDay: n + 1,
      done: n < 60 ? 6 : 3,
      total: 6,
      itemIds: [],
    })),
  );
  const { add } = useProgressStore.getState();
  add({ metric: 'weight', date: addDays(START, -2), value: 84 });
  add({ metric: 'weight', date: addDays(START, 80), value: 80 });
  add({ metric: 'alt', date: addDays(START, 5), value: 62 });
}

describe('Day90SummaryScreen', () => {
  it('shows adherence, first vs latest values and the doctor prompt', async () => {
    seedPlan();
    const { props, navigation } = screenProps('Day90Summary');
    await render(<Day90SummaryScreen {...props} />);

    expect(navigation.setOptions).toHaveBeenCalledWith({ title: 'Your 90-day summary' });
    expect(screen.getByText('You completed 60 of 90 days (67%).')).toBeTruthy();
    expect(screen.getByLabelText('Weight: first 84 kg, latest 80 kg')).toBeTruthy();
    expect(screen.getByLabelText('ALT: Only one reading: 62 U/L')).toBeTruthy();
    expect(screen.getByLabelText('Waist: Not logged')).toBeTruthy();
    expect(screen.getByText('Talk to your doctor')).toBeTruthy();
    expect(screen.queryByText(/Your full summary is ready on Day 90/)).toBeNull();
  });

  it('shows weight in the user unit', async () => {
    seedPlan();
    await act(() => usePreferences.getState().setWeightUnit('lb'));
    const { props } = screenProps('Day90Summary');
    await render(<Day90SummaryScreen {...props} />);
    expect(screen.getByLabelText('Weight: first 185.2 lb, latest 176.4 lb')).toBeTruthy();
  });

  it('says when the summary is not final yet', async () => {
    setUpPlan(new Date(2026, 10, 12, 9));
    const { props } = screenProps('Day90Summary');
    await render(<Day90SummaryScreen {...props} />);
    expect(
      screen.getByText('You are on Day 10. Your full summary is ready on Day 90.'),
    ).toBeTruthy();
  });

  it('restarts the plan and goes back to Today', async () => {
    seedPlan();
    const alert = jest.spyOn(Alert, 'alert');
    const { props, navigation } = screenProps('Day90Summary');
    await render(<Day90SummaryScreen {...props} />);
    await fireEvent.press(screen.getByTestId('restart-plan'));
    await act(() => alert.mock.calls[0]?.[2]?.[1]?.onPress?.());
    expect(usePlanStore.getState().startDate).toBe(TODAY);
    expect(navigation.navigate).toHaveBeenCalledWith('Main', { screen: 'Today' });
  });
});
