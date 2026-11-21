import { useNavigation } from '@react-navigation/native';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ARTICLES } from '@/content';
import type { Article } from '@/content/schema';
import { Banner, NATIVE_AD_INTERVAL, NativeAdCard } from '@/shared/ads';
import { useProfile } from '@/shared/profile';
import { colors, EmptyState, Screen, spacing, Text } from '@/shared/ui';

import { ArticleRow } from '../components/ArticleRow';
import { ExtraArticleCard } from '../components/ExtraArticleCard';
import { TopicChips } from '../components/TopicChips';
import { contentLanguage, selectArticles, splitExtras, type TopicFilter } from '../logic/articles';
import { interleaveAds, type ListRow } from '../logic/interleaveAds';

type Row = ListRow<Article>;

export function LearnListScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const language = contentLanguage(i18n.language);
  const condition = useProfile()?.condition ?? null;
  const [topic, setTopic] = useState<TopicFilter>('all');

  const { regular, extras } = useMemo(
    () => splitExtras(selectArticles(ARTICLES, topic, condition)),
    [topic, condition],
  );
  const rows = useMemo(() => interleaveAds(regular, NATIVE_AD_INTERVAL), [regular]);

  const openArticle = useCallback(
    (articleId: string) => navigation.navigate('ArticleReader', { articleId }),
    [navigation],
  );

  const renderItem: ListRenderItem<Row> = useCallback(
    ({ item }) =>
      item.kind === 'ad' ? (
        <NativeAdCard placement="learnList" />
      ) : (
        <ArticleRow article={item.item} language={language} onOpen={openArticle} />
      ),
    [language, openArticle],
  );

  const extrasSection =
    extras.length > 0 ? (
      <View style={styles.extras} testID="learn-extras">
        <Text variant="heading">{t('learn.extrasTitle')}</Text>
        <Text color={colors.textMuted}>{t('learn.extrasBody')}</Text>
        {extras.map(article => (
          <ExtraArticleCard
            key={article.id}
            article={article}
            language={language}
            onOpen={openArticle}
          />
        ))}
      </View>
    ) : null;

  return (
    <Screen scroll={false} footer={<Banner placement="learnList" />}>
      <FlashList
        data={rows}
        extraData={language}
        keyExtractor={rowKey}
        getItemType={rowType}
        renderItem={renderItem}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={<TopicChips value={topic} onChange={setTopic} />}
        ListEmptyComponent={
          extras.length === 0 ? (
            <EmptyState title={t('learn.emptyTitle')} body={t('learn.emptyBody')} />
          ) : null
        }
        ListFooterComponent={extrasSection}
      />
    </Screen>
  );
}

function rowKey(row: Row): string {
  return row.kind === 'ad' ? row.key : row.item.id;
}

function rowType(row: Row): string {
  return row.kind;
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  extras: { padding: spacing.lg, gap: spacing.md },
});
