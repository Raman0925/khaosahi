/**
 * Bundled content. JSON is validated in CI by `scripts/validate-content.ts` (and in tests),
 * so at runtime it is typed by cast to keep startup fast. Add new article files to ARTICLES.
 */
import foodsJson from './foods.json';
import planBoth from './plans/both.json';
import planFattyLiver from './plans/fattyLiver.json';
import planUricAcid from './plans/uricAcid.json';
import tipsFattyLiver from './tips/fattyLiver.json';
import tipsUricAcid from './tips/uricAcid.json';
import articleWhatIsFattyLiver from './articles/what-is-fatty-liver.json';
import type { Article, Food, Plan, PlanId, TipsFile } from './schema';

export const FOODS = foodsJson as unknown as readonly Food[];

export const PLANS: Readonly<Record<PlanId, Plan>> = {
  fattyLiver: planFattyLiver as unknown as Plan,
  uricAcid: planUricAcid as unknown as Plan,
  both: planBoth as unknown as Plan,
};

export const TIPS: Readonly<Record<TipsFile['condition'], TipsFile>> = {
  fattyLiver: tipsFattyLiver as unknown as TipsFile,
  uricAcid: tipsUricAcid as unknown as TipsFile,
};

export const ARTICLES = [articleWhatIsFattyLiver] as unknown as readonly Article[];
