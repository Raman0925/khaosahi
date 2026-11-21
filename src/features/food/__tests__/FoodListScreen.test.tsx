import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { i18next, initI18n } from '@/shared/i18n';
import { usePreferences } from '@/shared/preferences/store';
import { type ProfileInput, useProfileStore } from '@/shared/profile';

import { FoodListScreen } from '../screens/FoodListScreen';

const mockNavigate = jest.fn();

jest.mock('@/content', () => ({
  FOODS:
    jest.requireActual<typeof import('../__fixtures__/foods')>('../__fixtures__/foods')
      .FIXTURE_FOODS,
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual<object>('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

// FlashList measures its layout natively; give it a fixed viewport under Jest.
jest.mock('@shopify/flash-list/dist/recyclerview/utils/measureLayout', () => {
  const actual = jest.requireActual<object>(
    '@shopify/flash-list/dist/recyclerview/utils/measureLayout',
  );
  const box = (width: number, height: number) => () => ({ x: 0, y: 0, width, height });
  return {
    ...actual,
    measureParentSize: jest.fn(box(400, 2000)),
    measureFirstChildLayout: jest.fn(box(400, 2000)),
    measureItemLayout: jest.fn(box(400, 60)),
  };
});

initI18n();

const PROFILE: ProfileInput = {
  condition: 'both',
  ageYears: 40,
  sex: 'male',
  heightCm: 170,
  weightKg: 80,
  waistCm: 95,
  dietType: 'jain',
  region: 'north',
  labs: {},
};

const setProfile = (input: Partial<ProfileInput> = {}) =>
  act(() => {
    useProfileStore.getState().saveProfile({ ...PROFILE, ...input });
  });

beforeEach(async () => {
  mockNavigate.mockClear();
  await act(async () => {
    usePreferences.getState().reset();
    useProfileStore.getState().reset();
    await i18next.changeLanguage('en');
  });
});

describe('FoodListScreen', () => {
  it('searches by Hinglish and Devanagari and shows the overall rating', async () => {
    await setProfile();
    await render(<FoodListScreen />);

    await fireEvent.changeText(screen.getByTestId('food-search'), 'chawal');
    expect(screen.getByTestId('food-row-white-rice')).toBeTruthy();
    expect(screen.getByTestId('food-row-brown-rice')).toBeTruthy();
    expect(screen.queryByTestId('food-row-moong-dal')).toBeNull();
    // White rice is "limit" for fatty liver; the row label carries the rating text.
    expect(screen.getByLabelText('White rice, सफ़ेद चावल. Limit')).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId('food-search'), 'राजमा');
    expect(screen.getByTestId('food-row-rajma')).toBeTruthy();
    expect(screen.getByText('1 food')).toBeTruthy();
  });

  it('defaults the diet filter to the profile and allows a session override', async () => {
    await setProfile({ dietType: 'jain' });
    await render(<FoodListScreen />);

    expect(screen.getByTestId('food-diet-jain').props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.queryByTestId('food-row-onion')).toBeNull();
    expect(screen.queryByTestId('food-row-boiled-egg')).toBeNull();
    expect(screen.queryByTestId('food-row-chicken-curry')).toBeNull();

    await fireEvent.press(screen.getByTestId('food-diet-veg'));
    expect(screen.getByTestId('food-row-onion')).toBeTruthy();
    expect(screen.queryByTestId('food-row-boiled-egg')).toBeNull();
  });

  it('filters by category chip and back to all', async () => {
    await render(<FoodListScreen />);

    await fireEvent.press(screen.getByTestId('food-category-cereals'));
    expect(screen.getByTestId('food-row-white-rice')).toBeTruthy();
    expect(screen.queryByTestId('food-row-rajma')).toBeNull();
    expect(screen.getByText('2 foods')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('food-category-all'));
    expect(screen.getByTestId('food-row-rajma')).toBeTruthy();
  });

  it('works without a profile: all diets and both-condition ratings', async () => {
    await render(<FoodListScreen />);
    expect(
      screen.getByText(
        'Ratings cover both fatty liver and uric acid. Set up your profile to see only yours.',
      ),
    ).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('food-search'), 'murgh');
    // Chicken curry: liver "limit", uric acid "avoid" → strictest is Avoid.
    expect(screen.getByLabelText('Chicken curry, चिकन करी. Avoid')).toBeTruthy();
  });

  it('opens the detail screen when a row is pressed', async () => {
    await render(<FoodListScreen />);
    await fireEvent.changeText(screen.getByTestId('food-search'), 'rajmah');
    await fireEvent.press(screen.getByTestId('food-row-rajma'));
    expect(mockNavigate).toHaveBeenCalledWith('FoodDetail', { foodId: 'rajma' });
  });

  it('shows an empty state when nothing matches', async () => {
    await render(<FoodListScreen />);
    await fireEvent.changeText(screen.getByTestId('food-search'), 'pizza');
    expect(screen.getByTestId('food-empty')).toBeTruthy();
    expect(screen.getByText('No foods found')).toBeTruthy();
  });

  it('shows names in Hindi with English as the subtitle', async () => {
    await act(async () => {
      await i18next.changeLanguage('hi');
    });
    await render(<FoodListScreen />);
    await fireEvent.changeText(screen.getByTestId('food-search'), 'dahi');
    expect(screen.getByText('दही')).toBeTruthy();
    expect(screen.getByText('Curd')).toBeTruthy();
  });
});
