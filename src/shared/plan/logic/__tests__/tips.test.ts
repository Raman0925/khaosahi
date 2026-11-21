import { TIPS } from '@/content';
import type { Tip, TipsFile } from '@/content/schema';

import { tipOfTheDay } from '../tips';

function tips(prefix: string, count: number): Tip[] {
  return Array.from({ length: count }, (_, n) => ({
    id: `${prefix}-${n + 1}`,
    text: { en: `${prefix} ${n + 1}`, hi: `${prefix} ${n + 1}` },
    reviewedBy: 'PENDING',
    reviewedOn: null,
  }));
}

const files: Record<TipsFile['condition'], TipsFile> = {
  fattyLiver: { condition: 'fattyLiver', tips: tips('fl', 3) },
  uricAcid: { condition: 'uricAcid', tips: tips('ua', 2) },
};

describe('tipOfTheDay', () => {
  it('rotates daily and wraps short lists', () => {
    expect([1, 2, 3, 4].map(day => tipOfTheDay('fattyLiver', day, files).id)).toEqual([
      'fl-1',
      'fl-2',
      'fl-3',
      'fl-1',
    ]);
    expect(tipOfTheDay('uricAcid', 3, files).id).toBe('ua-1');
  });

  it('alternates conditions for "both"', () => {
    expect([1, 2, 3, 4, 5, 6].map(day => tipOfTheDay('both', day, files).id)).toEqual([
      'fl-1',
      'ua-1',
      'fl-2',
      'ua-2',
      'fl-3',
      'ua-1',
    ]);
  });

  it('is deterministic and works past day 90 with the bundled tips', () => {
    expect(tipOfTheDay('both', 120).id).toBe(tipOfTheDay('both', 120).id);
    expect(TIPS.fattyLiver.tips.map(t => t.id)).toContain(tipOfTheDay('fattyLiver', 200).id);
  });
});
