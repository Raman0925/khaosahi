import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { initI18n } from '@/shared/i18n';
import { usePreferences } from '@/shared/preferences/store';

import {
  AgeGateScreen,
  ConsentScreen,
  DisclaimerScreen,
  IntroScreen,
  LanguageScreen,
} from '../screens';

initI18n();

function ProfileStub() {
  return <Text testID="profile-stub">profile</Text>;
}

type StartRoute =
  | 'OnboardingLanguage'
  | 'OnboardingIntro'
  | 'OnboardingDisclaimer'
  | 'OnboardingConsent'
  | 'OnboardingAgeGate';

/** Renders the real onboarding screens in a native stack (profile step stubbed). */
async function renderOnboarding(initialRouteName: StartRoute = 'OnboardingLanguage') {
  const Stack = createNativeStackNavigator({
    initialRouteName,
    screenOptions: { headerShown: false },
    screens: {
      OnboardingLanguage: LanguageScreen,
      OnboardingIntro: IntroScreen,
      OnboardingDisclaimer: DisclaimerScreen,
      OnboardingConsent: ConsentScreen,
      OnboardingAgeGate: AgeGateScreen,
      OnboardingProfile: ProfileStub,
    },
  });
  const Navigation = createStaticNavigation(Stack);
  await render(<Navigation />);
}

const AT = new Date('2026-11-21T10:00:00.000Z');

beforeEach(async () => {
  await act(() => usePreferences.getState().reset());
});

describe('LanguageScreen', () => {
  it('preselects the device language and stores it on continue', async () => {
    await renderOnboarding();
    expect(screen.getByTestId('language-en')).toBeChecked();
    expect(screen.getByTestId('language-hi')).not.toBeChecked();
    expect(usePreferences.getState().language).toBeNull();

    await fireEvent.press(screen.getByTestId('onboarding-next'));
    expect(usePreferences.getState().language).toBe('en');
    expect(await screen.findByTestId('onboarding-intro')).toBeTruthy();
  });

  it('switches to Hindi instantly', async () => {
    await renderOnboarding();
    await fireEvent.press(screen.getByLabelText('हिन्दी'));
    expect(usePreferences.getState().language).toBe('hi');
    expect(await screen.findByText('अपनी भाषा चुनें')).toBeTruthy();
    expect(screen.getByTestId('language-hi')).toBeChecked();
    expect(screen.getByText('आगे बढ़ें')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('English'));
    expect(await screen.findByText('Choose your language')).toBeTruthy();
  });

  it('resumes at the first incomplete step after a restart', async () => {
    await act(() => {
      usePreferences.getState().setLanguage('en');
      usePreferences.getState().acceptDisclaimer(AT);
      usePreferences.getState().acceptConsent(AT);
    });
    await renderOnboarding();
    await fireEvent.press(screen.getByTestId('onboarding-next'));
    expect(await screen.findByTestId('onboarding-age')).toBeTruthy();
  });
});

describe('IntroScreen', () => {
  it('pages through three slides, then opens the disclaimer', async () => {
    await renderOnboarding('OnboardingIntro');
    expect(screen.getByText('Know what to eat')).toBeTruthy();
    expect(screen.getByLabelText('1 of 3')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('intro-next'));
    expect(screen.getByText('A simple 90-day plan')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('intro-next'));
    expect(screen.getByText('Track your progress')).toBeTruthy();
    expect(screen.queryByTestId('intro-skip')).toBeNull();

    await fireEvent.press(screen.getByText('Get started'));
    expect(await screen.findByTestId('onboarding-disclaimer')).toBeTruthy();
  });

  it('can be skipped', async () => {
    await renderOnboarding('OnboardingIntro');
    await fireEvent.press(screen.getByText('Skip'));
    expect(await screen.findByTestId('onboarding-disclaimer')).toBeTruthy();
  });
});

describe('DisclaimerScreen', () => {
  it('needs the tick before continuing and records acceptance', async () => {
    await renderOnboarding('OnboardingDisclaimer');
    expect(screen.getByText(/does not diagnose or treat any disease/)).toBeTruthy();
    const next = screen.getByTestId('onboarding-next');
    expect(next).toBeDisabled();

    await fireEvent.press(next);
    expect(usePreferences.getState().disclaimerAcceptedAt).toBeNull();

    const tick = screen.getByRole('checkbox', { name: 'I have read and understood' });
    await fireEvent.press(tick);
    expect(tick).toBeChecked();
    expect(screen.getByTestId('onboarding-next')).toBeEnabled();

    await fireEvent.press(screen.getByTestId('onboarding-next'));
    expect(usePreferences.getState().disclaimerAcceptedAt).not.toBeNull();
    expect(await screen.findByTestId('onboarding-consent')).toBeTruthy();
  });
});

describe('ConsentScreen', () => {
  it('explains data use and stores the consent time on "I agree"', async () => {
    await act(() => usePreferences.getState().acceptDisclaimer(AT));
    await renderOnboarding('OnboardingConsent');
    expect(screen.getByText('What we store')).toBeTruthy();
    expect(screen.getByText(/Only on this phone/)).toBeTruthy();
    expect(screen.getByText(/Google account may include app data/)).toBeTruthy();
    expect(screen.getByText(/Settings → Delete all data/)).toBeTruthy();
    expect(screen.getByText(/No health data is shared with ads/)).toBeTruthy();

    await fireEvent.press(screen.getByText('I agree'));
    expect(usePreferences.getState().consentAcceptedAt).toEqual(expect.any(String));
    expect(await screen.findByTestId('onboarding-age')).toBeTruthy();
  });
});

describe('AgeGateScreen', () => {
  beforeEach(async () => {
    await act(() => {
      usePreferences.getState().acceptDisclaimer(AT);
      usePreferences.getState().acceptConsent(AT);
    });
  });

  it('blocks users under 18 with a way back', async () => {
    await renderOnboarding('OnboardingAgeGate');
    await fireEvent.press(screen.getByText('No, I am under 18'));
    expect(screen.getByText('Sorry, KhaoSahi is only for adults')).toBeTruthy();
    expect(screen.queryByTestId('age-yes')).toBeNull();
    expect(usePreferences.getState().ageConfirmedAt).toBeNull();

    await fireEvent.press(screen.getByText('Go back'));
    expect(screen.getByText('Are you 18 or older?')).toBeTruthy();
  });

  it('records the confirmation and opens profile setup', async () => {
    await renderOnboarding('OnboardingAgeGate');
    await fireEvent.press(screen.getByText('Yes, I am 18 or older'));
    expect(usePreferences.getState().ageConfirmedAt).not.toBeNull();
    expect(await screen.findByTestId('profile-stub')).toBeTruthy();
  });
});

describe('onboarding flow', () => {
  it('goes from language to profile setup in Hindi', async () => {
    await renderOnboarding();
    await fireEvent.press(screen.getByLabelText('हिन्दी'));
    await fireEvent.press(screen.getByText('आगे बढ़ें'));
    await fireEvent.press(await screen.findByText('छोड़ें'));
    await fireEvent.press(await screen.findByRole('checkbox'));
    await fireEvent.press(screen.getByText('आगे बढ़ें'));
    await fireEvent.press(await screen.findByText('मैं सहमत हूँ'));
    await fireEvent.press(await screen.findByText('हाँ, मेरी उम्र 18 या उससे ज़्यादा है'));
    expect(await screen.findByTestId('profile-stub')).toBeTruthy();

    const prefs = usePreferences.getState();
    expect(prefs.language).toBe('hi');
    expect(prefs.disclaimerAcceptedAt).not.toBeNull();
    expect(prefs.consentAcceptedAt).not.toBeNull();
    expect(prefs.ageConfirmedAt).not.toBeNull();
    expect(prefs.onboardingCompletedAt).toBeNull();
  });
});
