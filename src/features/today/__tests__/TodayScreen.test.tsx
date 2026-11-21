import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { AppState } from 'react-native';

import { initI18n, i18next } from '@/shared/i18n';
import {
  checklistForDate,
  reconcilePlanWithProfile,
  useChecklistHistory,
  usePlanStore,
} from '@/shared/plan';
import { type ProfileInput, useProfileStore } from '@/shared/profile';
import { resetAllStores } from '@/shared/storage';
import { addDays } from '@/shared/utils/dates';

import { TodayScreen } from '../screens/TodayScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual<object>('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

initI18n();

const profile: ProfileInput = {
  condition: 'fattyLiver',
  ageYears: 45,
  sex: 'female',
  heightCm: 160,
  weightKg: 70,
  waistCm: 90,
  dietType: 'veg',
  region: 'west',
  labs: {},
};

const START = new Date(2026, 10, 21, 9, 0, 0);

function setUpPlan(now: Date = START) {
  useProfileStore.getState().saveProfile(profile, now);
  reconcilePlanWithProfile(now);
}

function todayItemIds(dateKey: string): string[] {
  const { planKey, startDate } = usePlanStore.getState();
  return checklistForDate(planKey!, startDate!, dateKey).map(item => item.id);
}

beforeEach(async () => {
  jest.useFakeTimers({ now: START });
  mockNavigate.mockClear();
  await act(async () => {
    resetAllStores();
    await i18next.changeLanguage('en');
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('TodayScreen', () => {
  it('shows a friendly empty state without a profile', async () => {
    await render(<TodayScreen />);
    expect(screen.getByText('Your plan is not ready yet')).toBeTruthy();
    await fireEvent.press(screen.getByText('Set up profile'));
    expect(mockNavigate).toHaveBeenCalledWith('ProfileEdit');
  });

  it('shows the day, week, checklist, streak and tip', async () => {
    setUpPlan();
    await render(<TodayScreen />);
    expect(screen.getByText('Day 1 / 90')).toBeTruthy();
    expect(screen.getByText('Week 1: Small steps')).toBeTruthy();
    expect(screen.getByTestId('today-progress')).toHaveTextContent('0 of 6 done');
    expect(screen.getAllByRole('checkbox')).toHaveLength(6);
    expect(screen.getByTestId('today-streak')).toHaveTextContent('0 days in a row');
    expect(screen.getByText('Tip of the day')).toBeTruthy();
    expect(screen.queryByTestId('today-day90-card')).toBeNull();
  });

  it('ticks and unticks items, and the ticks persist in the plan store', async () => {
    setUpPlan();
    await render(<TodayScreen />);
    const [first] = todayItemIds('2026-11-21');
    const row = screen.getByTestId(`checklist-item-${first}`);
    expect(row).not.toBeChecked();

    await fireEvent.press(row);
    expect(screen.getByTestId(`checklist-item-${first}`)).toBeChecked();
    expect(screen.getByTestId('today-progress')).toHaveTextContent('1 of 6 done');
    expect(usePlanStore.getState().ticks?.doneItemIds).toEqual([first]);

    await fireEvent.press(screen.getByTestId(`checklist-item-${first}`));
    expect(screen.getByTestId('today-progress')).toHaveTextContent('0 of 6 done');
  });

  it('counts today in the streak at 70% and resets at midnight while open', async () => {
    setUpPlan();
    await render(<TodayScreen />);
    for (const id of todayItemIds('2026-11-21').slice(0, 5)) {
      await fireEvent.press(screen.getByTestId(`checklist-item-${id}`));
    }
    expect(screen.getByTestId('today-streak')).toHaveTextContent('1 day in a row');

    await act(() => jest.advanceTimersByTime(16 * 60 * 60 * 1000)); // past midnight
    expect(screen.getByText('Day 2 / 90')).toBeTruthy();
    expect(screen.getByTestId('today-progress')).toHaveTextContent('0 of 6 done');
    expect(screen.getByTestId('today-streak')).toHaveTextContent('1 day in a row');
    expect(useChecklistHistory.getState().rows).toEqual([
      expect.objectContaining({ date: '2026-11-21', planDay: 1, done: 5, total: 6 }),
    ]);
  });

  it('rolls over when the app returns to the foreground on a later day', async () => {
    const addListener = jest.mocked(AppState.addEventListener);
    addListener.mockClear();
    setUpPlan();
    await render(<TodayScreen />);
    const onChange = addListener.mock.calls[0]?.[1];
    jest.setSystemTime(new Date(2026, 10, 24, 8, 0, 0));
    await act(() => onChange?.('active'));
    expect(screen.getByText('Day 4 / 90')).toBeTruthy();
    expect(useChecklistHistory.getState().rows.map(r => r.date)).toEqual([
      '2026-11-21',
      '2026-11-22',
      '2026-11-23',
    ]);
  });

  it('links to the Day-90 summary from day 90', async () => {
    setUpPlan();
    usePlanStore.getState().startPlan('fattyLiver:veg', addDays('2026-11-21', -89));
    await render(<TodayScreen />);
    expect(screen.getByText('Day 90 / 90')).toBeTruthy();
    await fireEvent.press(screen.getByText('See my summary'));
    expect(mockNavigate).toHaveBeenCalledWith('Day90Summary');
  });

  it('navigates from the quick links', async () => {
    setUpPlan();
    await render(<TodayScreen />);
    await fireEvent.press(screen.getByText('Check a food'));
    expect(mockNavigate).toHaveBeenCalledWith('Main', { screen: 'Food' });
    await fireEvent.press(screen.getByText('Log your weight'));
    expect(mockNavigate).toHaveBeenCalledWith('ProgressEntry', { metric: 'weight' });
    await fireEvent.press(screen.getByText('See the 90-day plan'));
    expect(mockNavigate).toHaveBeenCalledWith('PlanOverview');
  });

  it('renders in Hindi', async () => {
    setUpPlan();
    await act(async () => {
      await i18next.changeLanguage('hi');
    });
    await render(<TodayScreen />);
    expect(screen.getByText('दिन 1 / 90')).toBeTruthy();
    expect(screen.getByText('आज की लिस्ट')).toBeTruthy();
    expect(screen.getByTestId('today-progress')).toHaveTextContent('6 में से 0 हो गए');
  });
});
