import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button, colors, Text } from '@/shared/ui';

import type { UnlockStatus } from '../hooks/useExtraUnlock';

/** "Watch a short ad to unlock" button plus a friendly message when no reward was given. */
export function UnlockPrompt({
  articleId,
  title,
  status,
  onUnlock,
}: {
  articleId: string;
  /** Article title, read out with the button so several extras are distinguishable. */
  title: string;
  status: UnlockStatus;
  onUnlock: () => void;
}) {
  const { t } = useTranslation();
  const message =
    status === 'unavailable'
      ? t('learn.adUnavailable')
      : status === 'notEarned'
        ? t('learn.adNotEarned')
        : null;
  return (
    <>
      <Button
        testID={`unlock-${articleId}`}
        variant="secondary"
        title={t('learn.watchToUnlock')}
        accessibilityLabel={`${t('learn.watchToUnlock')}: ${title}`}
        loading={status === 'loading'}
        onPress={onUnlock}
      />
      {message ? (
        <Text
          testID={`unlock-message-${articleId}`}
          color={colors.textMuted}
          accessibilityLiveRegion="polite"
        >
          {message}
        </Text>
      ) : null}
    </>
  );
}
