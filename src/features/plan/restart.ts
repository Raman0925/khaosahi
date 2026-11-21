import { Alert } from 'react-native';
import type { TFunction } from 'i18next';

import { restartPlan } from '@/shared/plan';

/** Asks for confirmation, then restarts the plan at day 1 today. */
export function confirmRestartPlan(t: TFunction, onRestarted?: () => void): void {
  Alert.alert(t('plan.restartTitle'), t('plan.restartBody'), [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('plan.restartConfirm'),
      style: 'destructive',
      onPress: () => {
        restartPlan();
        onRestarted?.();
      },
    },
  ]);
}
