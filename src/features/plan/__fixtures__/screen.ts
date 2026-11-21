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

/** Minimal navigation/route props for a root stack screen. */
export function screenProps<T extends keyof RootStackParamList>(
  name: T,
  params?: RootStackParamList[T],
) {
  const navigation = { setOptions: jest.fn(), navigate: jest.fn() };
  const props = {
    navigation,
    route: { key: `${name}-1`, name, params },
  } as unknown as RootScreenProps<T>;
  return { props, navigation };
}
