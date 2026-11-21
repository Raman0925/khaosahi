import { normalize } from '../logic/normalize';

describe('normalize', () => {
  it('lowercases and removes spaces, punctuation and hyphens', () => {
    expect(normalize('  Moong Dal (Yellow, split) ')).toBe('moongdalyellowsplit');
    expect(normalize('Rajma-Chawal')).toBe('rajmachawal');
    expect(normalize('ready–to–eat!')).toBe('readytoeat');
  });

  it('strips Latin diacritics', () => {
    expect(normalize('Dahī')).toBe('dahi');
    expect(normalize('Crème brûlée')).toBe('cremebrulee');
    expect(normalize('ĀLOO')).toBe('aloo');
  });

  it('keeps Devanagari vowel signs', () => {
    expect(normalize('राजमा')).toBe('राजमा');
    expect(normalize('मूंग दाल')).toBe('मूंगदाल');
  });

  it('drops the nukta, both precomposed and combining', () => {
    expect(normalize('प्याज़')).toBe('प्याज');
    // U+095B (precomposed ज़) and ज + U+093C both become ज.
    expect(normalize('ज़')).toBe('ज');
    expect(normalize('ज़')).toBe('ज');
    expect(normalize('सफ़ेद')).toBe(normalize('सफेद'));
  });

  it('treats chandrabindu as anusvara', () => {
    expect(normalize('मूँग')).toBe(normalize('मूंग'));
  });

  it('ignores ZWJ, ZWNJ and the danda', () => {
    expect(normalize('क्‍ष')).toBe(normalize('क्ष'));
    expect(normalize('क्‌ष')).toBe(normalize('क्ष'));
    expect(normalize('दाल।')).toBe('दाल');
  });

  it('returns an empty string for blank or punctuation-only input', () => {
    expect(normalize('   ')).toBe('');
    expect(normalize('-,.')).toBe('');
  });
});
