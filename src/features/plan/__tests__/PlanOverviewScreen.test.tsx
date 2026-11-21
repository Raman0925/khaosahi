import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import { i18next, initI18n } from '@/shared/i18n';
import { usePlanStore } from '@/shared/plan';
import { resetAllStores } from '@/shared/storage';

import { setUpPlan } from '../__fixtures__/screen';
import { PlanOverviewScreen } from '../screens/PlanOverviewScreen';

const mockNavigation = {
  setOptions: jest.fn(),
  navigate: jest.fn(),
  push: jest.fn(),
  goBack: jest.fn(),
};
jest.mock('@/shared/navigation/useRootNavigation', () => ({
  useRootNavigation: () => mockNavigation,
}));

initI18n();

beforeEach(() => jest.clearAllMocks());
beforeEach(async () => {
  jest.useFakeTimers({ now: new Date(2026, 10, 21, 9) });
  await act(async () => {
    resetAllStores();
    await i18next.changeLanguage('en');
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('PlanOverviewScreen', () => {
  it('sets a translated title and shows an empty state without a plan', async () => {
    const navigation = mockNavigation;
    await render(<PlanOverviewScreen />);
    expect(navigation.setOptions).toHaveBeenCalledWith({ title: '90-day plan' });
    expect(screen.getByText('No plan yet')).toBeTruthy();
  });

  it('lists 13 weeks with the current week highlighted and opens a week', async () => {
    setUpPlan(new Date(2026, 10, 1, 9)); // today is day 21 → week 3
    const navigation = mockNavigation;
    await render(<PlanOverviewScreen />);

    expect(screen.getAllByTestId(/^week-row-/)).toHaveLength(13);
    expect(screen.getByTestId('week-row-3')).toBeSelected();
    expect(screen.getByTestId('week-row-1')).not.toBeSelected();
    expect(screen.getByLabelText(/^Week 3: .*This week$/)).toBeTruthy();
    expect(screen.getByLabelText(/^Week 13: .*Not started$/)).toBeTruthy();

    await fireEvent.press(screen.getByTestId('week-row-2'));
    expect(navigation.navigate).toHaveBeenCalledWith('WeekSummary', { week: 2 });
  });

  it('restarts the plan after confirmation', async () => {
    setUpPlan(new Date(2026, 10, 1, 9));
    const alert = jest.spyOn(Alert, 'alert');
    await render(<PlanOverviewScreen />);

    await fireEvent.press(screen.getByTestId('restart-plan'));
    expect(alert).toHaveBeenCalledWith('Restart the plan?', expect.any(String), expect.any(Array));
    const buttons = alert.mock.calls[0]?.[2] ?? [];

    await act(() => buttons[0]?.onPress?.()); // cancel
    expect(usePlanStore.getState().startDate).toBe('2026-11-01');

    await act(() => buttons[1]?.onPress?.()); // restart
    expect(usePlanStore.getState().startDate).toBe('2026-11-21');
    expect(screen.getByTestId('week-row-1')).toBeSelected();
  });
});
