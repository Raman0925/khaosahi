import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { Article } from '@/content/schema';
import { colors, Icon, ListItem } from '@/shared/ui';

import type { ContentLanguage } from '../logic/articles';

export type ArticleRowProps = {
  article: Article;
  language: ContentLanguage;
  onOpen: (articleId: string) => void;
};

export const ArticleRow = memo(function ArticleRowItem({
  article,
  language,
  onOpen,
}: ArticleRowProps) {
  const { t } = useTranslation();
  const title = article.title[language];
  const summary = article.summary[language];
  const minutes = t('learn.readMinutes', { count: article.readMinutes });
  return (
    <ListItem
      testID={`article-row-${article.id}`}
      title={title}
      subtitle={`${summary}\n${minutes}`}
      accessibilityLabel={`${title}. ${summary}. ${minutes}`}
      onPress={() => onOpen(article.id)}
      right={<Icon name="chevronRight" color={colors.textMuted} />}
    />
  );
});
