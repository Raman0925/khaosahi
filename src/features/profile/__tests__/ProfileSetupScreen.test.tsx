import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { initI18n } from '@/shared/i18n';
import { usePreferences } from '@/shared/preferences/store';
import { useProfileStore } from '@/shared/profile';
import { storage } from '@/shared/storage';
import { toDateKey } from '@/shared/utils/dates';

import { ProfileSetupScreen } from '../screens';

jest.mock('@react-native-community/datetimepicker', () => ({
  DateTimePickerAndroid: { open: jest.fn() },
}));

initI18n();

const openPicker = DateTimePickerAndroid.open as jest.Mock;

beforeEach(async () => {
  openPicker.mockReset();
  await act(() => {
    storage.clearAll();
    usePreferences.getState().reset();
    usePreferences.getState().setLanguage('en');
    useProfileStore.getState().reset();
  });
});

async function type(testID: string, text: string) {
  await fireEvent.changeText(screen.getByTestId(testID), text);
}

async function fillRequired({ height = '170', weight = '80' } = {}) {
  await fireEvent.press(screen.getByTestId('condition-fattyLiver'));
  await type('field-ageYears', '45');
  await fireEvent.press(screen.getByTestId('sex-male'));
  await type('field-height', height);
  await type('field-waist', '95');
  await type('field-weight', weight);
  await fireEvent.press(screen.getByTestId('diet-veg'));
  await fireEvent.press(screen.getByTestId('region-north'));
}

describe('ProfileSetupScreen', () => {
  it('shows required errors and does not save an empty form', async () => {
    await render(<ProfileSetupScreen />);
    await fireEvent.press(screen.getByTestId('profile-submit'));
    expect(await screen.findByTestId('form-errors')).toBeTruthy();
    expect(screen.getAllByText('This field is required')).toHaveLength(8);
    expect(useProfileStore.getState().profile).toBeNull();
    expect(usePreferences.getState().onboardingCompletedAt).toBeNull();
  });

  it('shows live BMI with the Asian-Indian category', async () => {
    await render(<ProfileSetupScreen />);
    expect(screen.getByText('Enter your height and weight to see your BMI.')).toBeTruthy();
    await type('field-height', '170');
    await type('field-weight', '70');
    expect(screen.getByText('Your BMI is 24.2: Overweight')).toBeTruthy();
  });

  it('saves the metric profile and completes onboarding', async () => {
    await render(<ProfileSetupScreen />);
    await fillRequired();
    await type('field-altUL', '56');
    await fireEvent.press(screen.getByTestId('grade-2'));
    await fireEvent.press(screen.getByTestId('profile-submit'));

    const profile = useProfileStore.getState().profile;
    expect(profile).toMatchObject({
      condition: 'fattyLiver',
      ageYears: 45,
      sex: 'male',
      heightCm: 170,
      weightKg: 80,
      waistCm: 95,
      dietType: 'veg',
      region: 'north',
      labs: { altUL: 56, ultrasoundGrade: '2' },
    });
    expect(usePreferences.getState().onboardingCompletedAt).not.toBeNull();
    // Persisted to MMKV.
    expect(storage.getString('profile')).toContain('"heightCm":170');
    expect(storage.getString('preferences')).toContain('onboardingCompletedAt');
  });

  it('converts typed values when switching units and validates in the new unit', async () => {
    await render(<ProfileSetupScreen />);
    await fillRequired();
    await fireEvent.press(screen.getByTestId('length-unit-in'));
    await fireEvent.press(screen.getByTestId('weight-unit-lb'));
    expect(usePreferences.getState().lengthUnit).toBe('in');
    expect(usePreferences.getState().weightUnit).toBe('lb');
    expect(screen.getByTestId('field-height').props.value).toBe('66.9');
    expect(screen.getByTestId('field-weight').props.value).toBe('176.4');

    await type('field-height', '170');
    await fireEvent.press(screen.getByTestId('profile-submit'));
    expect(await screen.findByText('Enter a value between 47.3 and 86.6')).toBeTruthy();
    expect(useProfileStore.getState().profile).toBeNull();

    await type('field-height', '67');
    await fireEvent.press(screen.getByTestId('profile-submit'));
    expect(useProfileStore.getState().profile).toMatchObject({ heightCm: 170.2, weightKg: 80 });
  });

  it('shows range errors in Hindi', async () => {
    await act(() => usePreferences.getState().setLanguage('hi'));
    await render(<ProfileSetupScreen />);
    await fillRequired({ weight: '300' });
    await fireEvent.press(screen.getByTestId('profile-submit'));
    expect(await screen.findByText('25 से 250 के बीच कोई संख्या डालें')).toBeTruthy();
    expect(screen.getByText('लाल रंग में दिखी जानकारी ठीक करें।')).toBeTruthy();
  });

  it('picks a lab test date (no future dates) and can clear it', async () => {
    await render(<ProfileSetupScreen />);
    await fireEvent.press(screen.getByLabelText('Choose test date'));
    expect(openPicker).toHaveBeenCalledTimes(1);
    const options = openPicker.mock.calls[0][0];
    expect(options.mode).toBe('date');
    expect(toDateKey(options.maximumDate)).toBe(toDateKey(new Date()));

    await act(() => options.onValueChange({}, new Date(2026, 9, 5)));
    expect(screen.getByText('5 Oct 2026')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Clear test date'));
    expect(screen.getByText('Not set')).toBeTruthy();

    await act(() => options.onValueChange({}, new Date(2026, 9, 5)));
    await fillRequired();
    await fireEvent.press(screen.getByTestId('profile-submit'));
    expect(useProfileStore.getState().profile?.labs.testDate).toBe('2026-10-05');
  });
});
