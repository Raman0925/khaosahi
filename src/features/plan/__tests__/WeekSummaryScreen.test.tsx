import { act, render, screen } from '@testing-library/react-native';
import React from 'react';

import { i18next, initI18n } from '@/shared/i18n';
import { useChecklistHistory } from '@/shared/plan';
import { resetAllStores } from '@/shared/storage';

import { screenProps, setUpPlan } from '../__fixtures__/screen';
import { WeekSummaryScreen } from '../screens/WeekSummaryScreen';

initI18n();

const row = (date: string, done: number) => ({ date, planDay: 1, done, total: 6, itemIds: [] });

beforeEach(async () => {
  jest.useFakeTimers({ now: new Date(2026, 10, 21, 9) });
  await act(async () => {
    resetAllStores();
    await i18next.changeLanguage('en');
  });
});

afterEach(() => jest.useRealTimers());

describe('WeekSummaryScreen', () => {
  it('shows days completed and average completion for a past week', async () => {
    setUpPlan(new Date(2026, 10, 10, 9));
    // Plan started 10 Nov; week 1 is 10–16 Nov; 14–16 Nov have no row (count as 0%).
    useChecklistHistory
      .getState()
      .addRows([
        row('2026-11-10', 6),
        row('2026-11-11', 5),
        row('2026-11-12', 3),
        row('2026-11-13', 6),
      ]);
    const { props, navigation } = screenProps('WeekSummary', { week: 1 });
    await render(<WeekSummaryScreen {...props} />);

    expect(navigation.setOptions).toHaveBeenCalledWith({ title: 'Week 1' });
    expect(screen.getByText('Finished')).toBeTruthy();
    expect(screen.getByText('Days completed: 3 of 7')).toBeTruthy();
    // (6 + 5 + 3 + 6) / 6 / 7 days = 47.6%
    expect(screen.getByText('Average completion: 48%')).toBeTruthy();
  });

  it('says a future week has not started', async () => {
    setUpPlan(new Date(2026, 10, 21, 9));
    const { props } = screenProps('WeekSummary', { week: 5 });
    await render(<WeekSummaryScreen {...props} />);
    expect(screen.getByText('This week has not started yet.')).toBeTruthy();
    expect(screen.getByText('Not started')).toBeTruthy();
  });

  it('explains that the current week has no finished days on day 1', async () => {
    setUpPlan(new Date(2026, 10, 21, 9));
    const { props } = screenProps('WeekSummary', { week: 1 });
    await render(<WeekSummaryScreen {...props} />);
    expect(screen.getByText('No finished days yet. A day is counted after it ends.')).toBeTruthy();
  });
});
