import type { Article } from '@/content/schema';
import type { Condition } from '@/shared/profile';

export type ArticleTopic = Article['topics'][number];
export type TopicFilter = 'all' | ArticleTopic;
export type ContentLanguage = 'en' | 'hi';

export const TOPIC_FILTERS: readonly TopicFilter[] = ['all', 'fattyLiver', 'uricAcid', 'general'];

/** Content is bundled in English and Hindi; anything else falls back to English. */
export function contentLanguage(code: string | undefined): ContentLanguage {
  return code === 'hi' ? 'hi' : 'en';
}

export function matchesTopic(article: Article, filter: TopicFilter): boolean {
  return filter === 'all' || article.topics.includes(filter);
}

function relevantTopics(condition: Condition): readonly ArticleTopic[] {
  switch (condition) {
    case 'fattyLiver':
      return ['fattyLiver'];
    case 'uricAcid':
      return ['uricAcid'];
    case 'both':
      return ['fattyLiver', 'uricAcid'];
  }
}

/** 0 = about the user's condition, 1 = general, 2 = about the other condition. */
function relevanceRank(article: Article, condition: Condition | null): number {
  if (condition === null) {
    return 0;
  }
  const relevant = relevantTopics(condition);
  if (article.topics.some(topic => relevant.includes(topic))) {
    return 0;
  }
  return article.topics.includes('general') ? 1 : 2;
}

/**
 * Filters by topic and puts articles about the user's condition first (then general ones).
 * Keeps the original order within each group.
 */
export function selectArticles(
  articles: readonly Article[],
  filter: TopicFilter,
  condition: Condition | null,
): Article[] {
  return articles
    .filter(article => matchesTopic(article, filter))
    .map((article, index) => ({ article, index, rank: relevanceRank(article, condition) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ article }) => article);
}

/** Splits into free articles and optional rewarded extras. */
export function splitExtras(articles: readonly Article[]): {
  regular: Article[];
  extras: Article[];
} {
  return {
    regular: articles.filter(article => !article.rewardedExtra),
    extras: articles.filter(article => article.rewardedExtra),
  };
}

export function findArticle(articles: readonly Article[], id: string): Article | undefined {
  return articles.find(article => article.id === id);
}
