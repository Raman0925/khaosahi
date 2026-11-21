import React, { useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useRootNavigation } from '@/shared/navigation';
import {
  openNotificationSettings,
  type ReminderSection,
  type ReminderTime,
  requestNotificationPermission,
  retestDate,
  useReminderSettings,
  WATER_INTERVALS,
} from '@/shared/notifications';
import { usePlanStore } from '@/shared/plan';
import { Button, Card, Chip, colors, Screen, spacing, Text } from '@/shared/ui';
import { todayKey } from '@/shared/utils/dates';

import { ReminderCard } from '../components/ReminderCard';
import { formatDate, formatTime, useLocaleT } from '../format';
import { pickTime } from '../pickers';

const WEEKDAYS = ['0', '1', '2', '3', '4', '5', '6'] as const;

export function RemindersScreen() {
  const navigation = useRootNavigation();
  const { t, language } = useLocaleT();
  const settings = useReminderSettings();
  const startDate = usePlanStore(state => state.startDate);
  const [denied, setDenied] = useState(false);
  const [failed, setFailed] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('reminders.title') });
  }, [navigation, t]);

  /** Turning a reminder on asks for permission first; it stays off if permission is denied. */
  const toggle = async (section: ReminderSection, enabled: boolean) => {
    setFailed(false);
    if (!enabled) {
      settings.setEnabled(section, false);
      return;
    }
    try {
      const allowed = await requestNotificationPermission();
      setDenied(!allowed);
      if (allowed) {
        settings.setEnabled(section, true);
      }
    } catch (error) {
      console.warn('[reminders] permission request failed', error);
      setFailed(true);
    }
  };

  const changeTime = async (current: ReminderTime, apply: (time: ReminderTime) => void) => {
    const picked = await pickTime(new Date(2000, 0, 1, current.hour, current.minute));
    if (picked) {
      apply({ hour: picked.getHours(), minute: picked.getMinutes() });
    }
  };

  const timeButton = (
    testID: string,
    name: string,
    time: ReminderTime,
    apply: (time: ReminderTime) => void,
  ) => (
    <View style={styles.group}>
      <Text weight="medium">{t('reminders.time')}</Text>
      <Button
        testID={testID}
        variant="secondary"
        title={formatTime(time, language)}
        accessibilityLabel={t('reminders.changeTime', {
          name,
          time: formatTime(time, language),
        })}
        onPress={() => changeTime(time, apply)}
      />
    </View>
  );

  const retestOn = retestDate(startDate);
  const retestPassed = retestOn !== null && retestOn <= todayKey();
  const dailyName = t('reminders.daily.title');
  const weighInName = t('reminders.weighIn.title');

  return (
    <Screen testID="reminders-screen">
      <Text color={colors.textMuted}>{t('reminders.intro')}</Text>

      {denied ? (
        <Card testID="reminders-denied">
          <Text variant="heading" accessibilityLiveRegion="polite">
            {t('reminders.denied.title')}
          </Text>
          <Text>{t('reminders.denied.body')}</Text>
          <Button
            title={t('reminders.denied.openSettings')}
            onPress={() => {
              openNotificationSettings().catch(error => console.warn('[reminders]', error));
            }}
          />
        </Card>
      ) : null}
      {failed ? (
        <Text color={colors.danger} accessibilityLiveRegion="polite">
          {t('reminders.error')}
        </Text>
      ) : null}

      <ReminderCard
        testID="reminder-daily"
        title={dailyName}
        body={t('reminders.daily.body')}
        enabled={settings.daily.enabled}
        onToggle={on => toggle('daily', on)}
      >
        {timeButton('reminder-daily-time', dailyName, settings.daily.time, settings.setDailyTime)}
      </ReminderCard>

      <ReminderCard
        testID="reminder-water"
        title={t('reminders.water.title')}
        body={t('reminders.water.body')}
        enabled={settings.water.enabled}
        onToggle={on => toggle('water', on)}
      >
        <View style={styles.chips}>
          {WATER_INTERVALS.map(interval => (
            <Chip
              key={interval}
              label={t('reminders.water.every', { count: interval })}
              selected={settings.water.interval === interval}
              onPress={() => settings.setWaterInterval(interval)}
            />
          ))}
        </View>
      </ReminderCard>

      <ReminderCard
        testID="reminder-weighIn"
        title={weighInName}
        body={t('reminders.weighIn.body')}
        enabled={settings.weighIn.enabled}
        onToggle={on => toggle('weighIn', on)}
      >
        <Text weight="medium">{t('reminders.weighIn.day')}</Text>
        <View style={styles.chips}>
          {WEEKDAYS.map(day => (
            <Chip
              key={day}
              label={t(`reminders.weekdays.${day}`)}
              selected={settings.weighIn.weekday === Number(day)}
              onPress={() => settings.setWeighInDay(Number(day))}
            />
          ))}
        </View>
        {timeButton(
          'reminder-weighIn-time',
          weighInName,
          settings.weighIn.time,
          settings.setWeighInTime,
        )}
      </ReminderCard>

      <ReminderCard
        testID="reminder-retest"
        title={t('reminders.retest.title')}
        body={t('reminders.retest.body')}
        enabled={settings.retest.enabled}
        disabled={retestOn === null && !settings.retest.enabled}
        onToggle={on => toggle('retest', on)}
      >
        {retestOn && !retestPassed ? (
          <Text>{t('reminders.retest.on', { date: formatDate(retestOn, language) })}</Text>
        ) : null}
      </ReminderCard>
      {retestOn === null ? (
        <Text color={colors.textMuted}>{t('reminders.retest.noPlan')}</Text>
      ) : null}
      {retestPassed ? <Text color={colors.textMuted}>{t('reminders.retest.passed')}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
