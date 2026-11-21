import type { Article } from '@/content/schema';

/** Test article. Titles are "<id> title" / "<id> शीर्षक" so tests can find rows by text. */
export function makeArticle(
  id: string,
  topics: Article['topics'],
  overrides: Partial<Article> = {},
): Article {
  return {
    id,
    topics,
    title: { en: `${id} title`, hi: `${id} शीर्षक` },
    summary: { en: `${id} summary`, hi: `${id} सारांश` },
    readMinutes: 3,
    rewardedExtra: false,
    body: {
      en: [
        { type: 'heading', text: `${id} heading` },
        { type: 'paragraph', text: `${id} paragraph` },
        { type: 'bullets', items: [`${id} point one`, `${id} point two`] },
      ],
      hi: [
        { type: 'heading', text: `${id} हेडिंग` },
        { type: 'paragraph', text: `${id} पैराग्राफ़` },
        { type: 'bullets', items: [`${id} पहली बात`] },
      ],
    },
    reviewedBy: 'PENDING',
    reviewedOn: null,
    ...overrides,
  };
}
