import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { initI18n } from '@/shared/i18n';
import { usePreferences } from '@/shared/preferences/store';
import { useProfileStore } from '@/shared/profile';

import { LearnListScreen } from '../screens/LearnListScreen';

const mockNavigate = jest.fn();
const mockRewarded = {
  isLoaded: true,
  isUnlocked: false,
  show: jest.fn(async () => true),
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('@/shared/ads', () => ({
  ...jest.requireActual('@/shared/ads'),
  useRewarded: () => mockRewarded,
}));

jest.mock('@/content', () => {
  const { makeArticle } = jest.requireActual('../__fixtures__/articles');
  return {
    ARTICLES: [
      makeArticle('general-one', ['general']),
      makeArticle('uric-one', ['uricAcid']),
      makeArticle('liver-one', ['fattyLiver']),
      makeArticle('menu', ['general'], { rewardedExtra: true }),
    ],
  };
});

initI18n();

beforeEach(async () => {
  jest.clearAllMocks();
  mockRewarded.isLoaded = true;
  mockRewarded.isUnlocked = false;
  mockRewarded.show.mockImplementation(async () => true);
  await act(() => {
    usePreferences.getState().reset();
    usePreferences.getState().setLanguage('en');
    useProfileStore.getState().reset();
  });
});

function saveProfile(condition: 'fattyLiver' | 'uricAcid' | 'both') {
  useProfileStore.getState().saveProfile({
    condition,
    ageYears: 40,
    sex: 'male',
    heightCm: 170,
    weightKg: 80,
    waistCm: 95,
    dietType: 'veg',
    region: 'north',
    labs: {},
  });
}

describe('LearnListScreen', () => {
  it('lists articles with summary and read time and opens the reader', async () => {
    await render(<LearnListScreen />);
    expect(screen.getByText('general-one title')).toBeTruthy();
    expect(screen.getByText('general-one summary\n3 min read')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('article-row-liver-one'));
    expect(mockNavigate).toHaveBeenCalledWith('ArticleReader', { articleId: 'liver-one' });
  });

  it("puts articles about the user's condition first", async () => {
    await act(() => saveProfile('fattyLiver'));
    await render(<LearnListScreen />);
    const titles = screen.getAllByText(/-one title$/).map(node => node.props.children as string);
    expect(titles).toEqual(['liver-one title', 'general-one title', 'uric-one title']);
  });

  it('filters by topic chip', async () => {
    await render(<LearnListScreen />);
    await fireEvent.press(screen.getByTestId('topic-uricAcid'));
    expect(screen.getByText('uric-one title')).toBeTruthy();
    expect(screen.queryByText('liver-one title')).toBeNull();
    expect(screen.getByTestId('topic-uricAcid').props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it('shows content in Hindi', async () => {
    await act(() => usePreferences.getState().setLanguage('hi'));
    await render(<LearnListScreen />);
    expect(screen.getByText('liver-one शीर्षक')).toBeTruthy();
    expect(screen.getByText('एक्स्ट्रा')).toBeTruthy();
  });

  describe('extras', () => {
    it('unlocks an extra with a rewarded ad and opens it', async () => {
      await render(<LearnListScreen />);
      expect(screen.getByTestId('learn-extras')).toBeTruthy();
      expect(screen.getByText(/^Locked/)).toBeTruthy();

      await fireEvent.press(screen.getByTestId('unlock-menu'));
      expect(mockRewarded.show).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('ArticleReader', { articleId: 'menu' });
      expect(screen.getByTestId('open-extra-menu')).toBeTruthy();
    });

    it('explains when no ad is available', async () => {
      mockRewarded.isLoaded = false;
      await render(<LearnListScreen />);
      await fireEvent.press(screen.getByTestId('unlock-menu'));
      expect(mockRewarded.show).not.toHaveBeenCalled();
      expect(
        screen.getByText('No ad is available right now. Please try again later.'),
      ).toBeTruthy();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('stays locked when the ad is closed early', async () => {
      mockRewarded.show.mockImplementation(async () => false);
      await render(<LearnListScreen />);
      await fireEvent.press(screen.getByTestId('unlock-menu'));
      expect(screen.getByTestId('unlock-message-menu')).toBeTruthy();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('opens an extra that is already unlocked', async () => {
      mockRewarded.isUnlocked = true;
      await render(<LearnListScreen />);
      expect(screen.getByText(/^Unlocked/)).toBeTruthy();
      await fireEvent.press(screen.getByTestId('open-extra-menu'));
      expect(mockNavigate).toHaveBeenCalledWith('ArticleReader', { articleId: 'menu' });
    });
  });
});
