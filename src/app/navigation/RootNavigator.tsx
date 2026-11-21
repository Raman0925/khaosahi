import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStaticNavigation, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { FoodDetailScreen, FoodListScreen } from '@/features/food/screens';
import { ArticleReaderScreen, LearnListScreen } from '@/features/learn/screens';
import {
  AgeGateScreen,
  ConsentScreen,
  DisclaimerScreen,
  IntroScreen,
  LanguageScreen,
} from '@/features/onboarding/screens';
import { Day90SummaryScreen, PlanOverviewScreen, WeekSummaryScreen } from '@/features/plan/screens';
import { ProfileEditScreen, ProfileSetupScreen } from '@/features/profile/screens';
import {
  ProgressEntryScreen,
  ProgressMetricScreen,
  ProgressScreen,
  RemindersScreen,
} from '@/features/progress/screens';
import {
  SettingsDisclaimerScreen,
  SettingsPrivacyNoticeScreen,
  SettingsScreen,
} from '@/features/settings/screens';
import { TodayScreen } from '@/features/today/screens';
import { recordUserAction } from '@/shared/ads';
import { navigationRef } from '@/shared/navigation';
import { useIsNotOnboarded, useIsOnboarded } from '@/shared/preferences/store';
import { colors, Icon, type IconName, MIN_TOUCH } from '@/shared/ui';

import { HeaderTitle, type NavTitleKey, TabLabel } from './titles';

function SettingsButton() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  return (
    <Pressable
      testID="open-settings"
      onPress={() => navigation.navigate('Settings')}
      accessibilityRole="button"
      accessibilityLabel={t('nav.openSettings')}
      hitSlop={8}
      style={styles.headerButton}
    >
      <Icon name="settings" color={colors.text} />
    </Pressable>
  );
}

function tabOptions(k: NavTitleKey, icon: IconName) {
  return {
    headerTitle: () => <HeaderTitle k={k} />,
    tabBarLabel: ({ color }: { color: string }) => <TabLabel k={k} color={color} />,
    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
      <Icon name={icon} color={color} size={size} />
    ),
  };
}

const MainTabs = createBottomTabNavigator({
  screenOptions: {
    headerRight: () => <SettingsButton />,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textMuted,
    headerStyle: { backgroundColor: colors.surface },
    sceneStyle: { backgroundColor: colors.background },
  },
  screens: {
    Today: {
      screen: TodayScreen,
      options: tabOptions('nav.today', 'today'),
    },
    Food: {
      screen: FoodListScreen,
      options: tabOptions('nav.food', 'food'),
    },
    Progress: {
      screen: ProgressScreen,
      options: tabOptions('nav.progress', 'progress'),
    },
    Learn: {
      screen: LearnListScreen,
      options: tabOptions('nav.learn', 'learn'),
    },
  },
});

const RootStack = createNativeStackNavigator({
  screenOptions: {
    contentStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
  },
  groups: {
    Onboarding: {
      if: useIsNotOnboarded,
      screenOptions: { headerShown: false },
      screens: {
        OnboardingLanguage: LanguageScreen,
        OnboardingIntro: IntroScreen,
        OnboardingDisclaimer: DisclaimerScreen,
        OnboardingConsent: ConsentScreen,
        OnboardingAgeGate: AgeGateScreen,
        OnboardingProfile: ProfileSetupScreen,
      },
    },
    App: {
      if: useIsOnboarded,
      screens: {
        Main: { screen: MainTabs, options: { headerShown: false } },
        FoodDetail: FoodDetailScreen,
        ArticleReader: ArticleReaderScreen,
        PlanOverview: PlanOverviewScreen,
        WeekSummary: WeekSummaryScreen,
        Day90Summary: Day90SummaryScreen,
        ProgressMetric: ProgressMetricScreen,
        ProgressEntry: ProgressEntryScreen,
        Settings: {
          screen: SettingsScreen,
          options: { headerTitle: () => <HeaderTitle k="nav.settings" /> },
        },
        ProfileEdit: ProfileEditScreen,
        Reminders: RemindersScreen,
        SettingsDisclaimer: SettingsDisclaimerScreen,
        SettingsPrivacyNotice: SettingsPrivacyNoticeScreen,
      },
    },
  },
});

const Navigation = createStaticNavigation(RootStack);

export function RootNavigator({ onReady }: { onReady?: () => void }) {
  // Every navigation state change counts as a user action for interstitial frequency caps.
  return <Navigation ref={navigationRef} onReady={onReady} onStateChange={recordUserAction} />;
}

const styles = StyleSheet.create({
  headerButton: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
