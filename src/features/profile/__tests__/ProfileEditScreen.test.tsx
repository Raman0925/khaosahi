import { createStaticNavigation, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Alert, type AlertButton, Button } from 'react-native';

import { initI18n } from '@/shared/i18n';
import { usePreferences } from '@/shared/preferences/store';
import { type ProfileInput, useProfileStore } from '@/shared/profile';

import { ProfileEditScreen } from '../screens';

jest.mock('@react-native-community/datetimepicker', () => ({
  DateTimePickerAndroid: { open: jest.fn() },
}));

initI18n();

const SAVED: ProfileInput = {
  condition: 'fattyLiver',
  ageYears: 45,
  sex: 'male',
  heightCm: 170,
  weightKg: 80,
  waistCm: 95,
  dietType: 'veg',
  region: 'north',
  labs: { altUL: 56 },
};

function SettingsStub() {
  const navigation = useNavigation();
  return (
    <Button testID="open-edit" title="edit" onPress={() => navigation.navigate('ProfileEdit')} />
  );
}

async function openEdit() {
  const Stack = createNativeStackNavigator({
    screens: { Settings: SettingsStub, ProfileEdit: ProfileEditScreen },
  });
  const Navigation = createStaticNavigation(Stack);
  await render(<Navigation />);
  await fireEvent.press(screen.getByTestId('open-edit'));
  await screen.findByTestId('profile-edit');
}

/** Title of the top native-stack header (a prop, not rendered text, under Jest). */
function headerTitle(): string | undefined {
  const titles = [...JSON.stringify(screen.toJSON()).matchAll(/"title":"([^"]+)"/g)];
  return titles.at(-1)?.[1];
}

let alertSpy: jest.SpyInstance;

beforeEach(async () => {
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  await act(() => {
    usePreferences.getState().reset();
    usePreferences.getState().setLanguage('en');
    usePreferences.getState().completeOnboarding();
    useProfileStore.getState().reset();
    useProfileStore.getState().saveProfile(SAVED, new Date('2026-11-01T00:00:00.000Z'));
  });
});

afterEach(() => alertSpy.mockRestore());

function alertButton(label: string): AlertButton {
  const buttons: AlertButton[] = alertSpy.mock.calls[0][2];
  const button = buttons.find(b => b.text === label);
  if (!button) {
    throw new Error(`No alert button ${label}`);
  }
  return button;
}

describe('ProfileEditScreen', () => {
  it('is prefilled in the current units with a translated title', async () => {
    await act(() => usePreferences.getState().setWeightUnit('lb'));
    await openEdit();
    expect(headerTitle()).toBe('Edit profile');
    expect(screen.getByTestId('field-height').props.value).toBe('170');
    expect(screen.getByTestId('field-weight').props.value).toBe('176.4');
    expect(screen.getByTestId('field-altUL').props.value).toBe('56');
    expect(screen.getByTestId('condition-fattyLiver')).toBeSelected();

    await act(() => usePreferences.getState().setLanguage('hi'));
    expect(headerTitle()).toBe('प्रोफ़ाइल बदलें');
  });

  it('saves simple changes without asking and goes back', async () => {
    await openEdit();
    await fireEvent.changeText(screen.getByTestId('field-weight'), '76.5');
    await fireEvent.press(screen.getByText('Save'));
    expect(alertSpy).not.toHaveBeenCalled();
    expect(useProfileStore.getState().profile).toMatchObject({
      weightKg: 76.5,
      createdAt: '2026-11-01T00:00:00.000Z',
    });
    expect(await screen.findByTestId('open-edit')).toBeTruthy();
  });

  it('asks before restarting the plan when the diet type changes', async () => {
    await openEdit();
    await fireEvent.press(screen.getByTestId('diet-nonveg'));
    await fireEvent.press(screen.getByText('Save'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Restart your 90-day plan?',
      expect.stringContaining('start again from Day 1'),
      expect.any(Array),
    );

    alertButton('Cancel').onPress?.();
    expect(useProfileStore.getState().profile?.dietType).toBe('veg');

    await act(() => alertButton('Save and restart').onPress?.());
    expect(useProfileStore.getState().profile?.dietType).toBe('nonveg');
    expect(await screen.findByTestId('open-edit')).toBeTruthy();
  });

  it('asks when the condition changes', async () => {
    await openEdit();
    await fireEvent.press(screen.getByTestId('condition-both'));
    await fireEvent.press(screen.getByText('Save'));
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(useProfileStore.getState().profile?.condition).toBe('fattyLiver');
  });
});
