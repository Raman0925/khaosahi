import type { NavigatorScreenParams } from '@react-navigation/native';

import type { Metric } from '@/shared/progress/metrics';

/**
 * Route names and params. Declared here (not inferred from the static config in app/) so
 * features and shared code can type navigation without importing app/.
 */
export type MainTabParamList = {
  Today: undefined;
  Food: undefined;
  Progress: undefined;
  Learn: undefined;
};

export type RootStackParamList = {
  // Onboarding (only while onboarding is not complete)
  OnboardingLanguage: undefined;
  OnboardingIntro: undefined;
  OnboardingDisclaimer: undefined;
  OnboardingConsent: undefined;
  OnboardingAgeGate: undefined;
  OnboardingProfile: undefined;

  // Main app
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  FoodDetail: { foodId: string };
  ArticleReader: { articleId: string };
  PlanOverview: undefined;
  WeekSummary: { week: number };
  Day90Summary: undefined;
  ProgressMetric: { metric: Metric };
  ProgressEntry: { metric: Metric; entryId?: string };
  Settings: undefined;
  ProfileEdit: undefined;
  Reminders: undefined;
  SettingsDisclaimer: undefined;
  SettingsPrivacyNotice: undefined;
};

export type RootRouteName = keyof RootStackParamList;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
