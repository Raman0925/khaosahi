import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { Article } from '@/content/schema';
import { Button, Card, colors, Text } from '@/shared/ui';

import { useExtraUnlock } from '../hooks/useExtraUnlock';
import type { ContentLanguage } from '../logic/articles';
import { UnlockPrompt } from './UnlockPrompt';

export type ExtraArticleCardProps = {
  article: Article;
  language: ContentLanguage;
  onOpen: (articleId: string) => void;
};

/** An optional extra: locked until a rewarded ad is watched, then opens like any article. */
export const ExtraArticleCard = memo(function ExtraArticleCardItem({
  article,
  language,
  onOpen,
}: ExtraArticleCardProps) {
  const { t } = useTranslation();
  const { isUnlocked, status, unlock } = useExtraUnlock(article.id);
  const title = article.title[language];

  const onUnlock = async () => {
    if (await unlock()) {
      onOpen(article.id);
    }
  };

  return (
    <Card testID={`extra-${article.id}`}>
      <Text variant="heading">{title}</Text>
      <Text color={colors.textMuted}>{article.summary[language]}</Text>
      {/* Lock state is spelled out in text, not shown by colour or an icon alone. */}
      <Text variant="caption" weight="medium" color={colors.textMuted}>
        {`${isUnlocked ? t('learn.unlocked') : t('learn.locked')} · ${t('learn.readMinutes', {
          count: article.readMinutes,
        })}`}
      </Text>
      {isUnlocked ? (
        <Button
          testID={`open-extra-${article.id}`}
          title={t('learn.openExtra')}
          accessibilityLabel={`${t('learn.openExtra')}: ${title}`}
          onPress={() => onOpen(article.id)}
        />
      ) : (
        <UnlockPrompt articleId={article.id} title={title} status={status} onUnlock={onUnlock} />
      )}
    </Card>
  );
});
