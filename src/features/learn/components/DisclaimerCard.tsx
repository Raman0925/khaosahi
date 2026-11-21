import React from 'react';
import { useTranslation } from 'react-i18next';

import { Card, Text } from '@/shared/ui';

/** Always shown at the end of an article. Never behind an ad. */
export function DisclaimerCard() {
  const { t } = useTranslation();
  return (
    <Card testID="article-disclaimer">
      <Text variant="heading">{t('learn.disclaimerTitle')}</Text>
      <Text>{t('common.disclaimer')}</Text>
    </Card>
  );
}
