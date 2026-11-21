import { makeArticle } from '../__fixtures__/articles';
import {
  contentLanguage,
  findArticle,
  matchesTopic,
  selectArticles,
  splitExtras,
} from '../logic/articles';

const liver = makeArticle('liver', ['fattyLiver']);
const uric = makeArticle('uric', ['uricAcid']);
const general = makeArticle('general', ['general']);
const mixed = makeArticle('mixed', ['uricAcid', 'general']);
const extra = makeArticle('extra', ['general'], { rewardedExtra: true });
const ALL = [general, uric, liver, mixed, extra];

const ids = (articles: { id: string }[]) => articles.map(article => article.id);

describe('selectArticles', () => {
  it('keeps the original order when there is no profile', () => {
    expect(ids(selectArticles(ALL, 'all', null))).toEqual([
      'general',
      'uric',
      'liver',
      'mixed',
      'extra',
    ]);
  });

  it('puts fatty-liver articles first, then general, then the other condition', () => {
    expect(ids(selectArticles(ALL, 'all', 'fattyLiver'))).toEqual([
      'liver',
      'general',
      'mixed',
      'extra',
      'uric',
    ]);
  });

  it('puts uric-acid articles first for uric acid', () => {
    expect(ids(selectArticles(ALL, 'all', 'uricAcid'))).toEqual([
      'uric',
      'mixed',
      'general',
      'extra',
      'liver',
    ]);
  });

  it('treats both conditions as relevant for "both"', () => {
    expect(ids(selectArticles(ALL, 'all', 'both'))).toEqual([
      'uric',
      'liver',
      'mixed',
      'general',
      'extra',
    ]);
  });

  it('filters by topic', () => {
    expect(ids(selectArticles(ALL, 'uricAcid', 'fattyLiver'))).toEqual(['mixed', 'uric']);
    expect(ids(selectArticles(ALL, 'general', null))).toEqual(['general', 'mixed', 'extra']);
    expect(matchesTopic(liver, 'all')).toBe(true);
    expect(matchesTopic(liver, 'uricAcid')).toBe(false);
  });
});

describe('helpers', () => {
  it('splits rewarded extras from free articles', () => {
    const { regular, extras } = splitExtras(ALL);
    expect(ids(regular)).toEqual(['general', 'uric', 'liver', 'mixed']);
    expect(ids(extras)).toEqual(['extra']);
  });

  it('finds an article by id', () => {
    expect(findArticle(ALL, 'uric')).toBe(uric);
    expect(findArticle(ALL, 'missing')).toBeUndefined();
  });

  it('maps the UI language to a content language', () => {
    expect(contentLanguage('hi')).toBe('hi');
    expect(contentLanguage('en')).toBe('en');
    expect(contentLanguage('fr')).toBe('en');
    expect(contentLanguage(undefined)).toBe('en');
  });
});
