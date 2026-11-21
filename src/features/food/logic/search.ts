import { type ContentDietType, type Food, type FoodCategory, suitsDiet } from '@/content/schema';

import type { Language } from '@/shared/preferences/store';

import { normalize } from './normalize';

type IndexedFood = {
  food: Food;
  /** Normalised English and Hindi names. */
  names: readonly string[];
  /** Normalised aliases (en, hi, hinglish), without duplicates of the names. */
  aliases: readonly string[];
  /** Position when sorted by name in each language; used for empty queries and ties. */
  order: Readonly<Record<Language, number>>;
};

export type SearchIndex = {
  readonly entries: readonly IndexedFood[];
  readonly byId: ReadonlyMap<string, Food>;
};

export type SearchFilters = {
  dietType?: ContentDietType;
  category?: FoodCategory;
  /** Language used to sort by name. Defaults to English. */
  language?: Language;
};

/** Normalises every name and alias once, so each query only does string comparisons. */
export function buildSearchIndex(foods: readonly Food[]): SearchIndex {
  const orderFor = (language: Language): Map<string, number> => {
    const collator = new Intl.Collator(language);
    const sorted = [...foods].sort((a, b) => collator.compare(a.name[language], b.name[language]));
    return new Map(sorted.map((food, position) => [food.id, position]));
  };
  const orderEn = orderFor('en');
  const orderHi = orderFor('hi');

  const entries = foods.map((food): IndexedFood => {
    const names = unique([normalize(food.name.en), normalize(food.name.hi)]);
    const aliases = unique(
      [...food.aliases.en, ...food.aliases.hi, ...food.aliases.hinglish].map(normalize),
    ).filter(alias => !names.includes(alias));
    return {
      food,
      names,
      aliases,
      order: { en: orderEn.get(food.id) ?? 0, hi: orderHi.get(food.id) ?? 0 },
    };
  });
  return { entries, byId: new Map(foods.map(food => [food.id, food])) };
}

/** Lower is better: exact 0, prefix 2, contains 4; +1 when only an alias matched. */
const NO_MATCH = Number.POSITIVE_INFINITY;

function matchScore(term: string, candidate: string): number {
  if (candidate === term) {
    return 0;
  }
  if (candidate.startsWith(term)) {
    return 2;
  }
  return candidate.includes(term) ? 4 : NO_MATCH;
}

function bestScore(term: string, entry: IndexedFood): number {
  let best = NO_MATCH;
  for (const name of entry.names) {
    best = Math.min(best, matchScore(term, name));
  }
  for (const alias of entry.aliases) {
    best = Math.min(best, matchScore(term, alias) + 1);
  }
  return best;
}

/**
 * Searches by English, Hindi and Hinglish names/aliases. Ranked exact > prefix > contains, a
 * name match before an alias match, ties by name in `language`. An empty query returns all
 * foods (after filters) sorted by name.
 */
export function searchFoods(
  query: string,
  index: SearchIndex,
  { dietType, category, language = 'en' }: SearchFilters = {},
): Food[] {
  const term = normalize(query);
  const scored: Array<{ entry: IndexedFood; score: number }> = [];
  for (const entry of index.entries) {
    if (category && entry.food.category !== category) {
      continue;
    }
    if (dietType && !suitsDiet(entry.food.dietType, dietType)) {
      continue;
    }
    const score = term === '' ? 0 : bestScore(term, entry);
    if (score !== NO_MATCH) {
      scored.push({ entry, score });
    }
  }
  scored.sort((a, b) => a.score - b.score || a.entry.order[language] - b.entry.order[language]);
  return scored.map(({ entry }) => entry.food);
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)].filter(value => value !== '');
}
