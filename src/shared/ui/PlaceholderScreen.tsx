import React, { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Screen } from './Screen';
import { Text } from './Text';
import { colors } from './theme';

/** Temporary screen used by the A0 navigation shell. Delete once every feature screen exists. */
export function PlaceholderScreen({ name, children }: { name: string; children?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <Screen testID={`placeholder-${name}`}>
      <Text variant="heading">{name}</Text>
      <Text color={colors.textMuted}>{t('common.comingSoon')}</Text>
      {children}
    </Screen>
  );
}
