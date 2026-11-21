import { act, render, screen } from '@testing-library/react-native';
import React from 'react';

import { initI18n } from '@/shared/i18n';
import type { RootScreenProps } from '@/shared/navigation';
import { usePreferences } from '@/shared/preferences/store';

import { SettingsDisclaimerScreen } from '../screens/SettingsDisclaimerScreen';
import { SettingsPrivacyNoticeScreen } from '../screens/SettingsPrivacyNoticeScreen';

initI18n();

const navigation = { setOptions: jest.fn() };

beforeEach(async () => {
  jest.clearAllMocks();
  await act(() => usePreferences.getState().setLanguage('en'));
});

describe('SettingsDisclaimerScreen', () => {
  it('shows the disclaimer and sets the title', async () => {
    const props = { navigation, route: {} } as unknown as RootScreenProps<'SettingsDisclaimer'>;
    await render(<SettingsDisclaimerScreen {...props} />);
    expect(navigation.setOptions).toHaveBeenCalledWith({ title: 'Disclaimer' });
    expect(screen.getByText(/does not diagnose or treat any disease/)).toBeTruthy();
  });
});

describe('SettingsPrivacyNoticeScreen', () => {
  it('explains what is stored, where, why, for how long, how to delete and ads', async () => {
    const props = { navigation, route: {} } as unknown as RootScreenProps<'SettingsPrivacyNotice'>;
    await render(<SettingsPrivacyNoticeScreen {...props} />);
    expect(navigation.setOptions).toHaveBeenCalledWith({ title: 'What we store' });
    for (const heading of [
      'What is stored',
      'Where it is stored',
      'Why',
      'How long',
      'How to delete',
      'Ads',
    ]) {
      expect(screen.getByText(heading)).toBeTruthy();
    }
    expect(screen.getByText(/Only on this phone/)).toBeTruthy();
    expect(screen.getByText(/No health data is ever shared with ads/)).toBeTruthy();
  });

  it('is available in Hindi', async () => {
    await act(() => usePreferences.getState().setLanguage('hi'));
    const props = { navigation, route: {} } as unknown as RootScreenProps<'SettingsPrivacyNotice'>;
    await render(<SettingsPrivacyNoticeScreen {...props} />);
    expect(screen.getByText('कहाँ सेव होता है')).toBeTruthy();
  });
});
