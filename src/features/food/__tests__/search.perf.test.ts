import { performance } from 'node:perf_hooks';

import { FOOD_CATEGORIES } from '@/content/schema';

import { makeFood } from '../__fixtures__/foods';
import { buildSearchIndex, searchFoods } from '../logic/search';

const WORDS = [
  'dal',
  'sabzi',
  'paneer',
  'chawal',
  'roti',
  'curry',
  'masala',
  'fry',
  'halwa',
  'juice',
];
const HI_WORDS = ['दाल', 'सब्ज़ी', 'पनीर', 'चावल', 'रोटी', 'करी', 'मसाला', 'फ्राई', 'हलवा', 'जूस'];
const DIETS = ['jain', 'veg', 'egg', 'nonveg'] as const;

/** 300 synthetic foods with names and aliases in all three scripts. */
const FOODS = Array.from({ length: 300 }, (_, i) => {
  const w = WORDS[i % WORDS.length] ?? 'dal';
  const h = HI_WORDS[i % HI_WORDS.length] ?? 'दाल';
  return makeFood({
    id: `food-${i}`,
    en: `Food ${i} ${w} special`,
    hi: `खाना ${i} ${h} ख़ास`,
    category: FOOD_CATEGORIES[i % FOOD_CATEGORIES.length] ?? 'dishes',
    dietType: DIETS[i % DIETS.length] ?? 'jain',
    aliases: {
      en: [`${w} item ${i}`, `regional ${w}`],
      hi: [`${h} ${i}`],
      hinglish: [`desi ${w} ${i}`, `ghar ka ${w}`],
    },
  });
});

const QUERIES = [
  'dal',
  'chawal',
  'paneer masala',
  'food 12',
  'roti',
  'दाल',
  'पनीर',
  'चावल',
  'ख़ास',
  'desi',
  'ghar ka',
  'special',
  'x',
  'a',
  'zzz',
  'curry 299',
  'Hálwa',
  'मसाला 4',
  'regional juice',
  '',
];

describe('search performance (F4.4)', () => {
  it('searches 300 foods well under 100 ms per query', () => {
    const buildStart = performance.now();
    const index = buildSearchIndex(FOODS);
    const buildMs = performance.now() - buildStart;

    // Warm up the JIT once so the measurement reflects steady state, like a real session.
    QUERIES.forEach(q => searchFoods(q, index));

    const start = performance.now();
    let results = 0;
    for (const q of QUERIES) {
      results += searchFoods(q, index, { dietType: 'nonveg', language: 'hi' }).length;
    }
    const avgMs = (performance.now() - start) / QUERIES.length;

    console.warn(
      `[food search perf] build ${buildMs.toFixed(2)} ms; avg ${avgMs.toFixed(3)} ms/query ` +
        `over ${QUERIES.length} queries (${results} results)`,
    );
    expect(results).toBeGreaterThan(0);
    // Generous margin: the budget is 100 ms on a low-end phone; on CI this is ~1 ms.
    expect(avgMs).toBeLessThan(20);
  });
});
