import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Alert, type AlertButton, Linking } from 'react-native';
import Share from 'react-native-share';

import { openAdPrivacyOptions } from '@/shared/ads';
import { initI18n } from '@/shared/i18n';
import { cancelAllNotifications } from '@/shared/notifications';
import { usePreferences } from '@/shared/preferences/store';
import { storage } from '@/shared/storage';
import { APP_VERSION } from '@/shared/utils/appInfo';

import { DEFAULT_PRIVACY_POLICY_URL } from '../constants';
import { SettingsScreen } from '../screens/SettingsScreen';

const mockNavigation = {
  setOptions: jest.fn(),
  navigate: jest.fn(),
  push: jest.fn(),
  goBack: jest.fn(),
};
jest.mock('@/shared/navigation/useRootNavigation', () => ({
  useRootNavigation: () => mockNavigation,
}));

let mockAdPrivacyRequired = false;

jest.mock('@/shared/ads', () => ({
  ...jest.requireActual('@/shared/ads'),
  useAdPrivacyOptionsRequired: () => mockAdPrivacyRequired,
  openAdPrivacyOptions: jest.fn(async () => undefined),
}));

jest.mock('@/shared/notifications', () => ({
  syncReminders: jest.fn(async () => undefined),
  cancelAllNotifications: jest.fn(async () => undefined),
}));

jest.mock('react-native-share', () => ({
  __esModule: true,
  default: { open: jest.fn(async () => ({ success: true, message: '' })) },
}));

initI18n();

function renderSettings() {
  return render(<SettingsScreen />);
}

beforeEach(async () => {
  jest.clearAllMocks();
  mockAdPrivacyRequired = false;
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  await act(() => {
    usePreferences.getState().reset();
    usePreferences.getState().setLanguage('en');
    usePreferences.getState().completeOnboarding();
  });
});

describe('SettingsScreen', () => {
  it('switches language instantly', async () => {
    await renderSettings();
    await fireEvent.press(screen.getByTestId('settings-language-hi'));
    expect(usePreferences.getState().language).toBe('hi');
    expect(await screen.findByText('माप की इकाई')).toBeTruthy();
    expect(screen.getByTestId('settings-language-hi').props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it('changes units', async () => {
    await renderSettings();
    await fireEvent.press(screen.getByLabelText('Length: in'));
    await fireEvent.press(screen.getByLabelText('Weight: lb'));
    expect(usePreferences.getState().lengthUnit).toBe('in');
    expect(usePreferences.getState().weightUnit).toBe('lb');
  });

  it('navigates to reminders, profile, privacy notice and disclaimer', async () => {
    await renderSettings();
    await fireEvent.press(screen.getByText('Reminders'));
    await fireEvent.press(screen.getByText('Edit profile'));
    await fireEvent.press(screen.getByText('What we store'));
    await fireEvent.press(screen.getByText('Disclaimer'));
    expect(mockNavigation.navigate.mock.calls.map(([route]) => route)).toEqual([
      'Reminders',
      'ProfileEdit',
      'SettingsPrivacyNotice',
      'SettingsDisclaimer',
    ]);
  });

  it('opens the privacy policy and the Play Store, and shows the version', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await renderSettings();
    await fireEvent.press(screen.getByText('Privacy policy'));
    await fireEvent.press(screen.getByText('Rate KhaoSahi'));
    expect(openURL.mock.calls.map(([url]) => url)).toEqual([
      DEFAULT_PRIVACY_POLICY_URL,
      'market://details?id=in.khaosahi.app',
    ]);
    expect(screen.getByText(APP_VERSION)).toBeTruthy();
  });

  it('shows a message when a link cannot be opened', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no browser'));
    await renderSettings();
    await fireEvent.press(screen.getByText('Privacy policy'));
    expect(await screen.findByTestId('settings-link-error')).toBeTruthy();
  });

  it('hides ad privacy options when not required', async () => {
    await renderSettings();
    expect(screen.queryByText('Ad privacy options')).toBeNull();
  });

  it('opens ad privacy options when required', async () => {
    mockAdPrivacyRequired = true;
    await renderSettings();
    await fireEvent.press(screen.getByText('Ad privacy options'));
    expect(openAdPrivacyOptions).toHaveBeenCalledTimes(1);
  });

  it('exports data through the share sheet', async () => {
    await renderSettings();
    await fireEvent.press(screen.getByTestId('settings-export'));
    expect(Share.open).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'application/json', failOnCancel: false }),
    );
    expect(screen.queryByTestId('settings-data-error')).toBeNull();
  });

  it('shows an error when export fails', async () => {
    (Share.open as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await renderSettings();
    await fireEvent.press(screen.getByTestId('settings-export'));
    expect(await screen.findByText('Could not export your data. Please try again.')).toBeTruthy();
  });

  it('asks for confirmation, then deletes everything', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    storage.set('extra', 'user data');
    await renderSettings();
    await fireEvent.press(screen.getByTestId('settings-delete'));

    expect(alert).toHaveBeenCalledTimes(1);
    const [title, , buttons] = alert.mock.calls[0]!;
    expect(title).toBe('Delete all data?');
    const confirm = (buttons as AlertButton[]).find(button => button.style === 'destructive')!;
    expect(confirm.text).toBe('Delete everything');
    expect(cancelAllNotifications).not.toHaveBeenCalled();

    await act(async () => confirm.onPress?.());
    // Let the async delete finish.
    await act(() => new Promise<void>(resolve => setTimeout(resolve, 0)));
    expect(cancelAllNotifications).toHaveBeenCalledTimes(1);
    expect(storage.getString('extra')).toBeUndefined();
    expect(usePreferences.getState().onboardingCompletedAt).toBeNull();
  });

  it('does nothing when deletion is cancelled', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await renderSettings();
    await fireEvent.press(screen.getByTestId('settings-delete'));
    const buttons = alert.mock.calls[0]![2] as AlertButton[];
    expect(buttons.find(button => button.style === 'cancel')?.onPress).toBeUndefined();
    expect(usePreferences.getState().onboardingCompletedAt).not.toBeNull();
  });
});
