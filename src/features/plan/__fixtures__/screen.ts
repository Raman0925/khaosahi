import type { RootScreenProps, RootStackParamList } from '@/shared/navigation';
import { reconcilePlanWithProfile } from '@/shared/plan';
import { type ProfileInput, useProfileStore } from '@/shared/profile';

export const profile: ProfileInput = {
  condition: 'both',
  ageYears: 50,
  sex: 'male',
  heightCm: 172,
  weightKg: 84,
  waistCm: 100,
  dietType: 'veg',
  region: 'north',
  labs: {},
};

export function setUpPlan(now: Date): void {
  useProfileStore.getState().saveProfile(profile, now);
  reconcilePlanWithProfile(now);
}

/**
 * Route props for a root stack screen. Navigation comes from `useRootNavigation`, which each test
 * file mocks; pass that mock in so callers can assert on it.
 */
export function screenProps<T extends keyof RootStackParamList, N>(
  name: T,
  params: RootStackParamList[T] | undefined,
  navigation: N,
) {
  const props = { route: { key: `${name}-1`, name, params } } as unknown as RootScreenProps<T>;
  return { props, navigation };
}
