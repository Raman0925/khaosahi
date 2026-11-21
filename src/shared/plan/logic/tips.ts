import { TIPS } from '@/content';
import type { Tip, TipsFile } from '@/content/schema';
import type { Condition } from '@/shared/profile';

type TipsByCondition = Readonly<Record<TipsFile['condition'], TipsFile>>;

function pick(tips: readonly Tip[], index: number): Tip {
  const tip = tips[index % tips.length];
  if (!tip) {
    throw new Error('Tip list is empty');
  }
  return tip;
}

/**
 * Tip of the day, deterministic by plan day (1-based, may be above 90). Wraps around short lists.
 * For "both" it alternates: odd days fatty liver, even days uric acid.
 */
export function tipOfTheDay(condition: Condition, day: number, tips: TipsByCondition = TIPS): Tip {
  const index = Math.max(0, day - 1);
  if (condition === 'both') {
    const file = index % 2 === 0 ? tips.fattyLiver : tips.uricAcid;
    return pick(file.tips, Math.floor(index / 2));
  }
  return pick(tips[condition].tips, index);
}
