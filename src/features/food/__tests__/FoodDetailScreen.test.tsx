import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { initI18n } from '@/shared/i18n';
import type { RootScreenProps } from '@/shared/navigation';
import { type ProfileInput, useProfileStore } from '@/shared/profile';

import { FoodDetailScreen } from '../screens/FoodDetailScreen';

const mockNavigation = {
  setOptions: jest.fn(),
  navigate: jest.fn(),
  push: jest.fn(),
  goBack: jest.fn(),
};
jest.mock('@/shared/navigation/useRootNavigation', () => ({
  useRootNavigation: () => mockNavigation,
}));

const mockOnTrigger = jest.fn();

jest.mock('@/content', () => ({
  FOODS:
    jest.requireActual<typeof import('../__fixtures__/foods')>('../__fixtures__/foods')
      .FIXTURE_FOODS,
}));

jest.mock('@/shared/ads', () => ({
  ...jest.requireActual<object>('@/shared/ads'),
  useInterstitial: () => ({ onTrigger: mockOnTrigger }),
}));

initI18n();

type Props = RootScreenProps<'FoodDetail'>;

function renderDetail(foodId: string) {
  const route = { key: 'FoodDetail-1', name: 'FoodDetail', params: { foodId } } as Props['route'];
  return render(<FoodDetailScreen route={route} />);
}

const setCondition = (condition: ProfileInput['condition']) =>
  act(() => {
    useProfileStore.getState().saveProfile({
      condition,
      ageYears: 40,
      sex: 'female',
      heightCm: 160,
      weightKg: 70,
      waistCm: 88,
      dietType: 'veg',
      region: 'west',
      labs: {},
    });
  });

beforeEach(async () => {
  jest.clearAllMocks();
  await act(() => useProfileStore.getState().reset());
});

describe('FoodDetailScreen', () => {
  it('shows both names, stricter rating first, reasons, portion and purine', async () => {
    await setCondition('both');
    await renderDetail('rajma');

    expect(screen.getByText('Rajma (kidney beans)')).toBeTruthy();
    expect(screen.getByText('राजमा')).toBeTruthy();
    expect(mockNavigation.setOptions).toHaveBeenCalledWith({ title: 'Food details' });

    // Rajma: uric acid "limit" is stricter than liver "good", so it comes first.
    const cards = screen.getAllByTestId(/^food-rating-/).map(card => card.props.testID);
    expect(cards).toEqual(['food-rating-uricAcid', 'food-rating-liver']);
    expect(screen.getByLabelText('High uric acid / gout: Limit')).toBeTruthy();
    expect(screen.getByLabelText('Fatty liver: Good')).toBeTruthy();
    expect(screen.getByText('Rajma (kidney beans) uric reason')).toBeTruthy();
    expect(screen.getByText('Rajma (kidney beans) uric portion')).toBeTruthy();
    expect(screen.getByText('Purine level: Moderate')).toBeTruthy();
    expect(screen.getByTestId('food-disclaimer')).toBeTruthy();
  });

  it('shows only the user condition', async () => {
    await setCondition('fattyLiver');
    await renderDetail('rajma');
    expect(screen.getByTestId('food-rating-liver')).toBeTruthy();
    expect(screen.queryByTestId('food-rating-uricAcid')).toBeNull();
    expect(screen.queryByText(/Purine level/)).toBeNull();
  });

  it('shows both conditions when there is no profile', async () => {
    await renderDetail('white-rice');
    expect(screen.getByTestId('food-rating-liver')).toBeTruthy();
    expect(screen.getByTestId('food-rating-uricAcid')).toBeTruthy();
  });

  it('lists existing swaps and pushes their detail screen', async () => {
    await setCondition('uricAcid');
    await renderDetail('rajma');
    expect(screen.getByText('Better choices')).toBeTruthy();
    // "missing-food" is not in the list and is skipped.
    expect(screen.getAllByTestId(/^food-row-/)).toHaveLength(1);
    await fireEvent.press(screen.getByTestId('food-row-moong-dal'));
    expect(mockNavigation.push).toHaveBeenCalledWith('FoodDetail', { foodId: 'moong-dal' });
  });

  it('reports one detail view per mount for the interstitial rule', async () => {
    await renderDetail('rajma');
    await screen.rerender(
      <FoodDetailScreen
        route={{ key: 'FoodDetail-1', name: 'FoodDetail', params: { foodId: 'rajma' } }}
      />,
    );
    expect(mockOnTrigger).toHaveBeenCalledTimes(1);
    expect(mockOnTrigger).toHaveBeenCalledWith('foodDetailViewed');
  });

  it('shows a not-found state for an unknown id', async () => {
    await renderDetail('does-not-exist');
    expect(screen.getByText('Food not found')).toBeTruthy();
    expect(mockOnTrigger).not.toHaveBeenCalled();
  });
});
