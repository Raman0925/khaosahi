import { type Food, type Localized, type Rating, RATING_SEVERITY } from '@/content/schema';
import { type Condition, conditionsFor } from '@/shared/profile';

export type RatingDimension = 'liver' | 'uricAcid';

export type EffectiveRating = {
  dimension: RatingDimension;
  rating: Rating;
  reason: Localized;
  portion: Localized;
  /** Only for the uric acid dimension. */
  purine?: Food['uricAcid']['purine'];
};

/**
 * Ratings that apply to the user's condition, stricter first (avoid > limit > good).
 * With no profile yet (`null`) both conditions are shown.
 */
export function effectiveRatings(food: Food, condition: Condition | null): EffectiveRating[] {
  const ratings = conditionsFor(condition ?? 'both').map((dimension): EffectiveRating => {
    if (dimension === 'liver') {
      const { rating, reason, portion } = food.liver;
      return { dimension, rating, reason, portion };
    }
    const { rating, reason, portion, purine } = food.uricAcid;
    return { dimension, rating, reason, portion, purine };
  });
  // Array.prototype.sort is stable, so equal ratings keep the liver-then-uric-acid order.
  return ratings.sort((a, b) => RATING_SEVERITY[b.rating] - RATING_SEVERITY[a.rating]);
}

/** The strictest rating that applies to the user's condition. */
export function overallRating(food: Food, condition: Condition | null): Rating {
  const [strictest] = effectiveRatings(food, condition);
  return strictest?.rating ?? food.liver.rating;
}
