import { makeFood } from '../__fixtures__/foods';
import { effectiveRatings, overallRating } from '../logic/ratings';

const food = (liver: 'good' | 'limit' | 'avoid', uricAcid: 'good' | 'limit' | 'avoid') =>
  makeFood({ id: 'x', en: 'X', hi: 'एक्स', category: 'dishes', dietType: 'jain', liver, uricAcid });

const dims = (f: ReturnType<typeof food>, condition: Parameters<typeof effectiveRatings>[1]) =>
  effectiveRatings(f, condition).map(r => `${r.dimension}:${r.rating}`);

describe('effectiveRatings', () => {
  it('returns only the dimension for a single condition', () => {
    expect(dims(food('good', 'avoid'), 'fattyLiver')).toEqual(['liver:good']);
    expect(dims(food('good', 'avoid'), 'uricAcid')).toEqual(['uricAcid:avoid']);
  });

  it('puts the stricter rating first when the user has both', () => {
    expect(dims(food('good', 'limit'), 'both')).toEqual(['uricAcid:limit', 'liver:good']);
    expect(dims(food('avoid', 'limit'), 'both')).toEqual(['liver:avoid', 'uricAcid:limit']);
    expect(dims(food('limit', 'avoid'), 'both')).toEqual(['uricAcid:avoid', 'liver:limit']);
  });

  it('keeps liver first on a tie', () => {
    expect(dims(food('limit', 'limit'), 'both')).toEqual(['liver:limit', 'uricAcid:limit']);
  });

  it('shows both conditions when there is no profile yet', () => {
    expect(dims(food('good', 'avoid'), null)).toEqual(['uricAcid:avoid', 'liver:good']);
  });

  it('carries reason, portion and purine (uric acid only)', () => {
    const [uric, liver] = effectiveRatings(food('good', 'limit'), 'both');
    expect(uric?.purine).toBe('low');
    expect(uric?.reason.en).toBe('X uric reason');
    expect(uric?.portion.hi).toBe('एक्स uric portion');
    expect(liver?.purine).toBeUndefined();
    expect(liver?.reason.en).toBe('X liver reason');
  });
});

describe('overallRating', () => {
  it('is the strictest applicable rating', () => {
    expect(overallRating(food('good', 'avoid'), 'fattyLiver')).toBe('good');
    expect(overallRating(food('good', 'avoid'), 'both')).toBe('avoid');
    expect(overallRating(food('limit', 'good'), null)).toBe('limit');
    expect(overallRating(food('good', 'good'), 'both')).toBe('good');
  });
});
