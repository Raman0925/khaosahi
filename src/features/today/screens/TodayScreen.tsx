import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PLAN_DAYS } from '@/content/schema';
import { toggleChecklistItem, useChecklistHistory, usePlanStore } from '@/shared/plan';
import { useProfile } from '@/shared/profile';
import { Button, Card, colors, EmptyState, Screen, spacing, Text } from '@/shared/ui';

import { ChecklistItem } from '../components/ChecklistItem';
import { buildTodayModel } from '../logic/todayModel';
import { useToday } from '../useToday';

export function TodayScreen() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'hi' ? 'hi' : 'en';
  const navigation = useNavigation();
  const today = useToday();
  const profile = useProfile();
  const startDate = usePlanStore(state => state.startDate);
  const planKey = usePlanStore(state => state.planKey);
  const ticks = usePlanStore(state => state.ticks);
  const history = useChecklistHistory(state => state.rows);

  const model = useMemo(
    () =>
      planKey && startDate ? buildTodayModel({ planKey, startDate, ticks, history, today }) : null,
    [planKey, startDate, ticks, history, today],
  );

  const onToggle = useCallback((id: string) => toggleChecklistItem(id), []);

  if (!profile || !model) {
    return (
      <Screen testID="today-screen">
        <EmptyState
          testID="today-empty"
          title={t('today.emptyTitle')}
          body={t('today.emptyBody')}
          actionLabel={t('today.emptyAction')}
          onAction={() => navigation.navigate('ProfileEdit')}
        />
      </Screen>
    );
  }

  return (
    <Screen testID="today-screen">
      <View style={styles.header}>
        <Text variant="title">{t('today.dayOfPlan', { day: model.day, total: PLAN_DAYS })}</Text>
        <Text variant="bodyLarge" weight="medium">
          {model.weekTitle ? model.weekTitle[lang] : t('plan.weekLabel', { week: model.week })}
        </Text>
        {model.finished ? <Text color={colors.primary}>{t('today.planComplete')}</Text> : null}
      </View>

      {model.showDay90 ? (
        <Card testID="today-day90-card">
          <Text variant="heading">{t('today.day90Title')}</Text>
          <Text>{t('today.day90Body')}</Text>
          <Button
            title={t('today.day90Action')}
            onPress={() => navigation.navigate('Day90Summary')}
          />
        </Card>
      ) : null}

      <Card>
        <Text variant="heading">{t('today.checklistTitle')}</Text>
        <Text testID="today-progress" color={colors.textMuted}>
          {t('today.progress', { done: model.done, total: model.total })}
        </Text>
        {model.items.map(item => (
          <ChecklistItem
            key={item.id}
            id={item.id}
            label={item.text[lang]}
            checked={model.doneIds.has(item.id)}
            onToggle={onToggle}
          />
        ))}
        {model.done === model.total && model.total > 0 ? (
          <Text weight="medium" color={colors.primary}>
            {t('today.allDone')}
          </Text>
        ) : null}
      </Card>

      <Card>
        <Text variant="heading">{t('today.streakLabel')}</Text>
        <Text testID="today-streak" variant="bodyLarge" weight="bold">
          {t('today.streakDays', { count: model.streak })}
        </Text>
        <Text variant="caption" color={colors.textMuted}>
          {t('today.streakHint')}
        </Text>
      </Card>

      <Card testID="today-tip">
        <Text variant="heading">{t('today.tipTitle')}</Text>
        <Text>{model.tip.text[lang]}</Text>
      </Card>

      <View style={styles.links}>
        <Text variant="heading">{t('today.quickLinks')}</Text>
        <Button
          variant="secondary"
          title={t('today.linkFood')}
          testID="today-link-food"
          onPress={() => navigation.navigate('Main', { screen: 'Food' })}
        />
        <Button
          variant="secondary"
          title={t('today.linkWeight')}
          testID="today-link-weight"
          onPress={() => navigation.navigate('ProgressEntry', { metric: 'weight' })}
        />
        <Button
          variant="secondary"
          title={t('today.linkPlan')}
          testID="today-link-plan"
          onPress={() => navigation.navigate('PlanOverview')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  links: { gap: spacing.sm },
});
