import { FIXTURE_FOODS, makeFood } from '../__fixtures__/foods';
import { buildSearchIndex, searchFoods } from '../logic/search';

const index = buildSearchIndex(FIXTURE_FOODS);
const ids = (query: string, filters?: Parameters<typeof searchFoods>[2]) =>
  searchFoods(query, index, filters).map(food => food.id);

describe('searchFoods', () => {
  it('finds rajma by Devanagari, English and Hinglish spellings', () => {
    expect(ids('राजमा')[0]).toBe('rajma');
    expect(ids('rajma')[0]).toBe('rajma');
    expect(ids('rajmah')[0]).toBe('rajma');
    expect(ids('राजमाह')[0]).toBe('rajma');
    expect(ids('Kidney Beans')[0]).toBe('rajma');
  });

  it('finds rice by "chawal" and "चावल", exact alias before contains', () => {
    expect(ids('chawal')).toEqual(['white-rice', 'brown-rice', 'rajma']);
    expect(ids('चावल')).toEqual(['white-rice', 'brown-rice']);
  });

  it('ignores case, spaces, diacritics, nukta and chandrabindu', () => {
    expect(ids('RÁJMA')[0]).toBe('rajma');
    expect(ids('dahi')).toEqual(['dahi']);
    expect(ids('Dahī')).toEqual(['dahi']);
    expect(ids('प्याज')).toEqual(['onion']);
    expect(ids('मूँग')[0]).toBe('moong-dal');
    expect(ids('moong   dal')[0]).toBe('moong-dal');
    expect(ids('सफेद चावल')).toEqual(['white-rice']);
  });

  it('ranks exact > prefix > contains', () => {
    const foods = [
      makeFood({
        id: 'pineapple',
        en: 'Pineapple',
        hi: 'अनानास',
        category: 'fruits',
        dietType: 'jain',
      }),
      makeFood({
        id: 'apple-juice',
        en: 'Apple juice',
        hi: 'सेब जूस',
        category: 'beverages',
        dietType: 'jain',
      }),
      makeFood({ id: 'apple', en: 'Apple', hi: 'सेब', category: 'fruits', dietType: 'jain' }),
    ];
    expect(searchFoods('apple', buildSearchIndex(foods)).map(f => f.id)).toEqual([
      'apple',
      'apple-juice',
      'pineapple',
    ]);
  });

  it('ranks a name match before an alias match of the same kind', () => {
    const foods = [
      makeFood({
        id: 'kheer',
        en: 'Kheer',
        hi: 'खीर',
        category: 'sweets',
        dietType: 'jain',
        aliases: { en: ['milk rice'] },
      }),
      makeFood({ id: 'milk', en: 'Milk', hi: 'दूध', category: 'dairy', dietType: 'jain' }),
    ];
    // Both are prefix matches for "mil": name "milk" beats alias "milk rice".
    expect(searchFoods('mil', buildSearchIndex(foods)).map(f => f.id)).toEqual(['milk', 'kheer']);
  });

  it('breaks ties by name in the current language', () => {
    // "curry" is contained in both names; English order: Chicken < Mutton.
    expect(ids('curry')).toEqual(['chicken-curry', 'mutton-curry']);
    // Hindi order: चिकन < मटन as well, but check Hindi sorting on the empty query.
    const hindi = searchFoods('', index, { language: 'hi', category: 'meat' }).map(f => f.name.hi);
    expect(hindi).toEqual(['चिकन करी', 'मटन करी']);
  });

  it('returns all foods sorted by name for an empty query', () => {
    const all = searchFoods('  ', index);
    expect(all).toHaveLength(FIXTURE_FOODS.length);
    const names = all.map(f => f.name.en);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));

    const hi = searchFoods('', index, { language: 'hi' }).map(f => f.name.hi);
    expect(hi).toEqual([...hi].sort((a, b) => a.localeCompare(b, 'hi')));
  });

  it('returns nothing when nothing matches', () => {
    expect(ids('pizza')).toEqual([]);
  });

  describe('filters', () => {
    it('never shows onion, egg or meat to a Jain user', () => {
      const jain = ids('', { dietType: 'jain' });
      expect(jain).not.toContain('onion');
      expect(jain).not.toContain('samosa');
      expect(jain).not.toContain('boiled-egg');
      expect(jain).not.toContain('chicken-curry');
      expect(jain).toContain('rajma');
      expect(ids('pyaz', { dietType: 'jain' })).toEqual([]);
      expect(ids('anda', { dietType: 'jain' })).toEqual([]);
    });

    it('shows veg + jain to veg, adds eggs for egg, everything for non-veg', () => {
      const veg = ids('', { dietType: 'veg' });
      expect(veg).toContain('onion');
      expect(veg).not.toContain('boiled-egg');
      const egg = ids('', { dietType: 'egg' });
      expect(egg).toContain('boiled-egg');
      expect(egg).not.toContain('mutton-curry');
      expect(ids('', { dietType: 'nonveg' })).toHaveLength(FIXTURE_FOODS.length);
    });

    it('filters by category, combined with the query and the diet', () => {
      expect(ids('', { category: 'cereals' })).toEqual(['brown-rice', 'white-rice']);
      expect(ids('chawal', { category: 'pulses' })).toEqual(['rajma']);
      expect(ids('', { category: 'meat', dietType: 'egg' })).toEqual([]);
    });
  });

  it('exposes foods by id', () => {
    expect(index.byId.get('rajma')?.name.en).toBe('Rajma (kidney beans)');
    expect(index.byId.get('nope')).toBeUndefined();
  });
});
