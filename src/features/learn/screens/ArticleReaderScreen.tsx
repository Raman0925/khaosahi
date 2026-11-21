import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { ARTICLES } from '@/content';
import { useInterstitial } from '@/shared/ads';
import type { RootScreenProps } from '@/shared/navigation';
import { Card, colors, EmptyState, Screen, Text } from '@/shared/ui';

import { ArticleBody } from '../components/ArticleBody';
import { DisclaimerCard } from '../components/DisclaimerCard';
import { UnlockPrompt } from '../components/UnlockPrompt';
import { useExtraUnlock } from '../hooks/useExtraUnlock';
import { contentLanguage, findArticle } from '../logic/articles';

export function ArticleReaderScreen({ navigation, route }: RootScreenProps<'ArticleReader'>) {
  const { articleId } = route.params;
  const { t, i18n } = useTranslation();
  const language = contentLanguage(i18n.language);
  const article = findArticle(ARTICLES, articleId);
  const { isUnlocked, status, unlock } = useExtraUnlock(articleId);
  const locked = article?.rewardedExtra === true && !isUnlocked;
  const title = article ? article.title[language] : t('learn.notFoundTitle');

  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  useArticleClosedTrigger(article !== undefined && !locked);

  if (!article) {
    return (
      <Screen testID="article-not-found">
        <EmptyState
          title={t('learn.notFoundTitle')}
          body={t('learn.notFoundBody')}
          actionLabel={t('learn.goBack')}
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  return (
    <Screen testID="article-reader">
      <Text variant="title">{title}</Text>
      <Text variant="caption" color={colors.textMuted}>
        {t('learn.readMinutes', { count: article.readMinutes })}
      </Text>
      {locked ? (
        <Card testID="article-locked">
          <Text variant="heading">{t('learn.lockedTitle')}</Text>
          <Text>{t('learn.lockedBody')}</Text>
          <UnlockPrompt
            articleId={article.id}
            title={title}
            status={status}
            onUnlock={() => {
              unlock().catch(() => undefined);
            }}
          />
        </Card>
      ) : (
        <ArticleBody blocks={article.body[language]} />
      )}
      <DisclaimerCard />
    </Screen>
  );
}

/**
 * Fires the `articleClosed` interstitial trigger once when the reader closes, but only if the
 * article was actually shown. The ads module decides whether an ad really appears (caps).
 */
function useArticleClosedTrigger(articleShown: boolean): void {
  const { onTrigger } = useInterstitial();
  const latest = useRef({ onTrigger, articleShown });
  useEffect(() => {
    latest.current = { onTrigger, articleShown };
  }, [onTrigger, articleShown]);
  useEffect(
    () => () => {
      if (latest.current.articleShown) {
        latest.current.onTrigger('articleClosed');
      }
    },
    [],
  );
}
