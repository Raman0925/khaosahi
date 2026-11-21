import { interleaveAds } from '../logic/interleaveAds';

const items = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `f${i}` }));
const shape = (n: number, interval: number) =>
  interleaveAds(items(n), interval)
    .map(row => (row.type === 'ad' ? 'AD' : row.item.id))
    .join(',');

describe('interleaveAds', () => {
  it('inserts an ad after every `interval` items', () => {
    expect(shape(7, 3)).toBe('f0,f1,f2,AD,f3,f4,f5,AD,f6');
  });

  it('never ends or starts with an ad', () => {
    expect(shape(6, 3)).toBe('f0,f1,f2,AD,f3,f4,f5');
    expect(shape(3, 3)).toBe('f0,f1,f2');
    expect(shape(0, 3)).toBe('');
  });

  it('adds no ads to short lists or with an invalid interval', () => {
    expect(shape(2, 8)).toBe('f0,f1');
    expect(shape(4, 0)).toBe('f0,f1,f2,f3');
  });

  it('gives every row a unique key and keeps the item', () => {
    const rows = interleaveAds(items(20), 8);
    const keys = rows.map(r => r.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(rows.filter(r => r.type === 'ad')).toHaveLength(2);
    const first = rows[0];
    expect(first?.type === 'item' && first.item).toEqual({ id: 'f0' });
  });
});
