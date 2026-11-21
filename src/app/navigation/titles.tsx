import React from 'react';
import { useTranslation } from 'react-i18next';

import { colors, Text } from '@/shared/ui';

export type NavTitleKey = 'nav.today' | 'nav.food' | 'nav.progress' | 'nav.learn' | 'nav.settings';

/** Header title that re-renders when the language changes. */
export function HeaderTitle({ k }: { k: NavTitleKey }) {
  const { t } = useTranslation();
  return (
    <Text variant="heading" numberOfLines={1}>
      {t(k)}
    </Text>
  );
}

/** Bottom-tab label that re-renders when the language changes. */
export function TabLabel({ k, color }: { k: NavTitleKey; color: string }) {
  const { t } = useTranslation();
  return (
    <Text variant="caption" weight="medium" color={color ?? colors.text} numberOfLines={1}>
      {t(k)}
    </Text>
  );
}
