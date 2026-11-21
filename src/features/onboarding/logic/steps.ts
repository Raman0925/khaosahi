import type { Preferences } from '@/shared/preferences/store';

/** The stored flags that record which onboarding steps are done. */
export type OnboardingFlags = Pick<
  Preferences,
  'disclaimerAcceptedAt' | 'consentAcceptedAt' | 'ageConfirmedAt'
>;

/** Onboarding steps after the language screen, in order. */
export type OnboardingStepRoute =
  | 'OnboardingIntro'
  | 'OnboardingDisclaimer'
  | 'OnboardingConsent'
  | 'OnboardingAgeGate'
  | 'OnboardingProfile';

/**
 * The first step whose flag is not set yet (disclaimer → consent → age → profile).
 * Used after each step, so a step that is already done is skipped.
 */
export function nextIncompleteRoute(flags: OnboardingFlags): OnboardingStepRoute {
  if (flags.disclaimerAcceptedAt === null) {
    return 'OnboardingDisclaimer';
  }
  if (flags.consentAcceptedAt === null) {
    return 'OnboardingConsent';
  }
  if (flags.ageConfirmedAt === null) {
    return 'OnboardingAgeGate';
  }
  return 'OnboardingProfile';
}

/**
 * Where the language screen continues to. A fresh start shows the intro; if the app was killed
 * mid-onboarding (the stack always restarts at Language), it resumes at the first incomplete step.
 */
export function routeAfterLanguage(flags: OnboardingFlags): OnboardingStepRoute {
  return flags.disclaimerAcceptedAt === null ? 'OnboardingIntro' : nextIncompleteRoute(flags);
}
