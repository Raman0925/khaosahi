import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { initI18n } from '@/shared/i18n';
import type { RootScreenProps } from '@/shared/navigation';
import { usePreferences } from '@/shared/preferences/store';

import { ArticleReaderScreen } from '../screens/ArticleReaderScreen';

const mockOnTrigger = jest.fn();
const mockRewarded = {
  isLoaded: true,
  isUnlocked: false,
  show: jest.fn(async () => true),
};

jest.mock('@/shared/ads', () => ({
  ...jest.requireActual('@/shared/ads'),
  useRewarded: () => mockRewarded,
  useInterstitial: () => ({ onTrigger: mockOnTrigger }),
}));

jest.mock('@/content', () => {
  const { makeArticle } = jest.requireActual('../__fixtures__/articles');
  return {
    ARTICLES: [
      makeArticle('free', ['fattyLiver'], { readMinutes: 4 }),
      makeArticle('menu', ['general'], { rewardedExtra: true }),
    ],
  };
});

initI18n();

const navigation = { setOptions: jest.fn(), goBack: jest.fn() };

type Props = RootScreenProps<'ArticleReader'>;

function renderReader(articleId: string) {
  const props = {
    navigation,
    route: { key: 'reader', name: 'ArticleReader', params: { articleId } },
  } as unknown as Props;
  return render(<ArticleReaderScreen {...props} />);
}

const DISCLAIMER_START = 'KhaoSahi gives general diet and lifestyle information.';

beforeEach(async () => {
  jest.clearAllMocks();
  mockRewarded.isLoaded = true;
  mockRewarded.isUnlocked = false;
  mockRewarded.show.mockImplementation(async () => true);
  await act(() => usePreferences.getState().setLanguage('en'));
});

describe('ArticleReaderScreen', () => {
  it('renders blocks, read time and ends with the disclaimer', async () => {
    await renderReader('free');
    expect(navigation.setOptions).toHaveBeenCalledWith({ title: 'free title' });
    expect(screen.getByText('4 min read')).toBeTruthy();
    expect(screen.getByText('free heading')).toBeTruthy();
    expect(screen.getByText('free paragraph')).toBeTruthy();
    expect(screen.getByText('free point two')).toBeTruthy();
    expect(screen.getByTestId('article-disclaimer')).toBeTruthy();
    expect(screen.getByText(new RegExp(`^${DISCLAIMER_START}`))).toBeTruthy();
  });

  it('shows the Hindi body when the app is in Hindi', async () => {
    await act(() => usePreferences.getState().setLanguage('hi'));
    await renderReader('free');
    expect(screen.getByText('free हेडिंग')).toBeTruthy();
    expect(screen.getByText('4 मिनट में पढ़ें')).toBeTruthy();
    expect(screen.getByTestId('article-disclaimer')).toBeTruthy();
  });

  it('triggers the articleClosed interstitial once when the reader closes', async () => {
    await renderReader('free');
    expect(mockOnTrigger).not.toHaveBeenCalled();
    await act(() => screen.unmount());
    expect(mockOnTrigger).toHaveBeenCalledTimes(1);
    expect(mockOnTrigger).toHaveBeenCalledWith('articleClosed');
  });

  it('shows a not-found state for an unknown article', async () => {
    await renderReader('nope');
    expect(screen.getByText('Article not found')).toBeTruthy();
    await fireEvent.press(screen.getByText('Back to articles'));
    expect(navigation.goBack).toHaveBeenCalled();
    await act(() => screen.unmount());
    expect(mockOnTrigger).not.toHaveBeenCalled();
  });

  it('keeps a locked extra locked (disclaimer still shown) until the ad is watched', async () => {
    await renderReader('menu');
    expect(screen.getByTestId('article-locked')).toBeTruthy();
    expect(screen.queryByText('menu paragraph')).toBeNull();
    expect(screen.getByTestId('article-disclaimer')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('unlock-menu'));
    expect(screen.queryByTestId('article-locked')).toBeNull();
    expect(screen.getByText('menu paragraph')).toBeTruthy();
  });

  it('does not trigger an interstitial for a locked extra that was never read', async () => {
    mockRewarded.isLoaded = false;
    await renderReader('menu');
    await fireEvent.press(screen.getByTestId('unlock-menu'));
    expect(screen.getByText('No ad is available right now. Please try again later.')).toBeTruthy();
    await act(() => screen.unmount());
    expect(mockOnTrigger).not.toHaveBeenCalled();
  });

  it('shows an unlocked extra directly', async () => {
    mockRewarded.isUnlocked = true;
    await renderReader('menu');
    expect(screen.getByText('menu paragraph')).toBeTruthy();
  });
});
