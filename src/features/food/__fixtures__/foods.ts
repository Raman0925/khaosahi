import type { ContentDietType, Food, FoodCategory, Rating } from '@/content/schema';

type FoodSpec = {
  id: string;
  en: string;
  hi: string;
  category: FoodCategory;
  dietType: ContentDietType;
  liver?: Rating;
  uricAcid?: Rating;
  purine?: Food['uricAcid']['purine'];
  aliases?: Partial<Food['aliases']>;
  swaps?: string[];
};

/** Builds a schema-valid test food with readable defaults. */
export function makeFood(spec: FoodSpec): Food {
  const text = (label: string) => ({ en: `${spec.en} ${label}`, hi: `${spec.hi} ${label}` });
  return {
    id: spec.id,
    category: spec.category,
    dietType: spec.dietType,
    name: { en: spec.en, hi: spec.hi },
    aliases: { en: [], hi: [], hinglish: [], ...spec.aliases },
    liver: {
      rating: spec.liver ?? 'good',
      reason: text('liver reason'),
      portion: text('liver portion'),
    },
    uricAcid: {
      rating: spec.uricAcid ?? 'good',
      purine: spec.purine ?? 'low',
      reason: text('uric reason'),
      portion: text('uric portion'),
    },
    swaps: spec.swaps ?? [],
    reviewedBy: 'PENDING',
    reviewedOn: null,
  };
}

export const FIXTURE_FOODS: readonly Food[] = [
  makeFood({
    id: 'moong-dal',
    en: 'Moong dal',
    hi: 'मूंग दाल',
    category: 'pulses',
    dietType: 'jain',
    purine: 'moderate',
    aliases: { en: ['green gram'], hi: ['मूँग की दाल'], hinglish: ['moong', 'mung'] },
  }),
  makeFood({
    id: 'rajma',
    en: 'Rajma (kidney beans)',
    hi: 'राजमा',
    category: 'pulses',
    dietType: 'jain',
    uricAcid: 'limit',
    purine: 'moderate',
    aliases: { en: ['kidney beans'], hi: ['राजमाह'], hinglish: ['rajmah', 'rajma chawal'] },
    swaps: ['moong-dal', 'missing-food'],
  }),
  makeFood({
    id: 'white-rice',
    en: 'White rice',
    hi: 'सफ़ेद चावल',
    category: 'cereals',
    dietType: 'jain',
    liver: 'limit',
    aliases: { en: ['rice'], hi: ['चावल', 'भात'], hinglish: ['chawal', 'bhaat'] },
    swaps: ['brown-rice'],
  }),
  makeFood({
    id: 'brown-rice',
    en: 'Brown rice',
    hi: 'ब्राउन चावल',
    category: 'cereals',
    dietType: 'jain',
    aliases: { hinglish: ['brown chawal'] },
  }),
  makeFood({
    id: 'onion',
    en: 'Onion',
    hi: 'प्याज़',
    category: 'vegetables',
    dietType: 'veg',
    aliases: { hinglish: ['pyaz', 'pyaaz', 'kanda'] },
  }),
  makeFood({
    id: 'samosa',
    en: 'Samosa',
    hi: 'समोसा',
    category: 'snacks',
    dietType: 'veg',
    liver: 'avoid',
    uricAcid: 'limit',
    swaps: ['roasted-chana'],
  }),
  makeFood({
    id: 'roasted-chana',
    en: 'Roasted chana',
    hi: 'भुना चना',
    category: 'snacks',
    dietType: 'jain',
    aliases: { hinglish: ['bhuna chana'] },
  }),
  makeFood({
    id: 'boiled-egg',
    en: 'Boiled egg',
    hi: 'उबला अंडा',
    category: 'eggs',
    dietType: 'egg',
    aliases: { hinglish: ['anda', 'ubla anda'] },
  }),
  makeFood({
    id: 'chicken-curry',
    en: 'Chicken curry',
    hi: 'चिकन करी',
    category: 'meat',
    dietType: 'nonveg',
    liver: 'limit',
    uricAcid: 'avoid',
    purine: 'high',
    aliases: { hinglish: ['murgh'] },
  }),
  makeFood({
    id: 'mutton-curry',
    en: 'Mutton curry',
    hi: 'मटन करी',
    category: 'meat',
    dietType: 'nonveg',
    liver: 'avoid',
    uricAcid: 'avoid',
    purine: 'high',
    aliases: { hinglish: ['gosht'] },
  }),
  makeFood({
    id: 'dahi',
    en: 'Curd',
    hi: 'दही',
    category: 'dairy',
    dietType: 'jain',
    aliases: { en: ['yogurt', 'yoghurt'], hinglish: ['dahī'] },
  }),
  makeFood({
    id: 'pineapple',
    en: 'Pineapple',
    hi: 'अनानास',
    category: 'fruits',
    dietType: 'jain',
    aliases: { en: ['ananas'] },
  }),
];
