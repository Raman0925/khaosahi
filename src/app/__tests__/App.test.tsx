import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { usePreferences } from '@/shared/preferences/store';
import { useProfileStore } from '@/shared/profile';

import { App } from '../App';

beforeEach(async () => {
  await act(() => {
    usePreferences.getState().reset();
    useProfileStore.getState().reset();
  });
});

describe('App shell', () => {
  it('starts on onboarding and switches language in-app', async () => {
    await render(<App />);
    expect(await screen.findByTestId('placeholder-LanguageScreen')).toBeTruthy();
    expect(screen.getByText('Continue')).toBeTruthy();

    await fireEvent.press(screen.getByText('हिन्दी'));
    expect(await screen.findByText('आगे बढ़ें')).toBeTruthy();

    await fireEvent.press(screen.getByText('English'));
    expect(await screen.findByText('Continue')).toBeTruthy();
  });

  it('shows the main tabs once onboarding is complete', async () => {
    await act(() => usePreferences.getState().completeOnboarding());
    await render(<App />);
    expect(await screen.findByTestId('today-screen')).toBeTruthy();
    expect(screen.getByLabelText('Open settings')).toBeTruthy();
  });
});
