import { ARTICLES, FOODS, PLANS, TIPS } from '..';
import { suitsDiet } from '../schema';
import { validateContent } from '../validate';

const content = { foods: FOODS, plans: PLANS, tips: TIPS, articles: [...ARTICLES] };

describe('bundled content', () => {
  it('passes structural validation', () => {
    const result = validateContent(content, { release: false, allowUnreviewed: true });
    expect(result.errors).toEqual([]);
  });

  it('rejects unknown swap ids and forbidden wording', () => {
    const [first] = FOODS;
    const bad = {
      ...first!,
      id: 'bad-food',
      swaps: ['does-not-exist'],
      name: { en: 'Liver cure tea', hi: 'चाय' },
    };
    const result = validateContent(
      { ...content, foods: [...FOODS, bad] },
      { release: false, allowUnreviewed: true },
    );
    expect(result.errors.join('\n')).toMatch(/unknown id "does-not-exist"/);
    expect(result.errors.join('\n')).toMatch(/forbidden wording/);
  });

  it('fails release validation while items are PENDING', () => {
    const result = validateContent(content, { release: true, allowUnreviewed: false });
    expect(result.errors.join('\n')).toMatch(/PENDING/);
  });
});

describe('suitsDiet', () => {
  it('orders jain ⊂ veg ⊂ egg ⊂ nonveg', () => {
    expect(suitsDiet('jain', 'jain')).toBe(true);
    expect(suitsDiet('veg', 'jain')).toBe(false);
    expect(suitsDiet('veg', 'egg')).toBe(true);
    expect(suitsDiet('nonveg', 'egg')).toBe(false);
    expect(suitsDiet('egg', 'nonveg')).toBe(true);
  });
});
