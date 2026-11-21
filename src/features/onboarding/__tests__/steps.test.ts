import { nextIncompleteRoute, type OnboardingFlags, routeAfterLanguage } from '../logic/steps';

const AT = '2026-11-21T10:00:00.000Z';
const NONE: OnboardingFlags = {
  disclaimerAcceptedAt: null,
  consentAcceptedAt: null,
  ageConfirmedAt: null,
};

describe('onboarding steps', () => {
  it('starts with the intro on a fresh install', () => {
    expect(routeAfterLanguage(NONE)).toBe('OnboardingIntro');
  });

  it('resumes at the first incomplete step after the app was killed', () => {
    expect(routeAfterLanguage({ ...NONE, disclaimerAcceptedAt: AT })).toBe('OnboardingConsent');
    expect(routeAfterLanguage({ ...NONE, disclaimerAcceptedAt: AT, consentAcceptedAt: AT })).toBe(
      'OnboardingAgeGate',
    );
    expect(
      routeAfterLanguage({ disclaimerAcceptedAt: AT, consentAcceptedAt: AT, ageConfirmedAt: AT }),
    ).toBe('OnboardingProfile');
  });

  it('moves to the next step whose flag is missing, in order', () => {
    expect(nextIncompleteRoute(NONE)).toBe('OnboardingDisclaimer');
    expect(nextIncompleteRoute({ ...NONE, disclaimerAcceptedAt: AT })).toBe('OnboardingConsent');
    // Never skips the disclaimer even if a later flag is somehow set.
    expect(nextIncompleteRoute({ ...NONE, consentAcceptedAt: AT, ageConfirmedAt: AT })).toBe(
      'OnboardingDisclaimer',
    );
    expect(nextIncompleteRoute({ ...NONE, disclaimerAcceptedAt: AT, ageConfirmedAt: AT })).toBe(
      'OnboardingConsent',
    );
  });
});
