import { interleaveAds } from '../logic/interleaveAds';

const kinds = (items: number[], interval: number) =>
  interleaveAds(items, interval).map(row => (row.kind === 'ad' ? 'ad' : row.item));

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe('interleaveAds', () => {
  it('inserts an ad after every Nth item', () => {
    expect(kinds(range(7), 3)).toEqual([1, 2, 3, 'ad', 4, 5, 6, 'ad', 7]);
  });

  it('never ends the list with an ad', () => {
    expect(kinds(range(6), 3)).toEqual([1, 2, 3, 'ad', 4, 5, 6]);
  });

  it('shows no ads for short or empty lists', () => {
    expect(kinds(range(3), 8)).toEqual([1, 2, 3]);
    expect(kinds([], 8)).toEqual([]);
  });

  it('gives ad rows unique keys', () => {
    const keys = interleaveAds(range(20), 4)
      .filter(row => row.kind === 'ad')
      .map(row => (row.kind === 'ad' ? row.key : ''));
    expect(keys).toEqual(['ad-1', 'ad-2', 'ad-3', 'ad-4']);
  });

  it('ignores a non-positive interval', () => {
    expect(kinds(range(3), 0)).toEqual([1, 2, 3]);
  });
});
