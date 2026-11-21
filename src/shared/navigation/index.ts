import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from './types';

export type { MainTabParamList, RootRouteName, RootStackParamList } from './types';
export { navigationRef } from './ref';

/** Props for a screen in the root stack: `RootScreenProps<'FoodDetail'>`. */
export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
