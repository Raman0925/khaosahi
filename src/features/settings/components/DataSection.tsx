import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, colors, spacing, Text } from '@/shared/ui';

import { deleteAllData } from '../logic/deleteAllData';
import { exportData } from '../logic/exportData';
import { SettingsSection } from './SettingsSection';

type Busy = 'export' | 'delete' | null;

/** Export my data + Delete all data. No ads here (policy). */
export function DataSection() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);

  const onExport = async () => {
    setBusy('export');
    setError(null);
    const ok = await exportData();
    setBusy(null);
    if (!ok) {
      setError(t('settings.exportFailed'));
    }
  };

  const runDelete = async () => {
    setBusy('delete');
    setError(null);
    try {
      // On success the navigator switches to onboarding and this screen goes away.
      await deleteAllData();
    } catch (deleteError) {
      console.warn('[settings] delete all data failed', deleteError);
      setError(t('settings.deleteFailed'));
    } finally {
      setBusy(null);
    }
  };

  const onDelete = () => {
    Alert.alert(t('settings.deleteConfirmTitle'), t('settings.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.deleteConfirmAction'),
        style: 'destructive',
        onPress: () => {
          runDelete().catch(() => undefined);
        },
      },
    ]);
  };

  return (
    <SettingsSection title={t('settings.sections.data')}>
      <View style={styles.body}>
        <Text color={colors.textMuted}>{t('settings.exportHint')}</Text>
        <Button
          testID="settings-export"
          variant="secondary"
          title={t('settings.export')}
          loading={busy === 'export'}
          disabled={busy !== null}
          onPress={() => {
            onExport().catch(() => undefined);
          }}
        />
        <Text color={colors.textMuted}>{t('settings.deleteHint')}</Text>
        <Button
          testID="settings-delete"
          variant="danger"
          title={t('settings.deleteAll')}
          loading={busy === 'delete'}
          disabled={busy !== null}
          onPress={onDelete}
        />
        {error ? (
          <Text testID="settings-data-error" color={colors.danger} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
      </View>
    </SettingsSection>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md },
});
