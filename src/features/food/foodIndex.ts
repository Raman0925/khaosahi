import { FOODS } from '@/content';

import { buildSearchIndex, type SearchIndex } from './logic/search';

let index: SearchIndex | null = null;

/** Search index over the bundled foods, built once on first use (not at app start). */
export function getFoodIndex(): SearchIndex {
  index ??= buildSearchIndex(FOODS);
  return index;
}
