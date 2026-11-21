import type { RouteProp } from '@react-navigation/native';

import type { RootStackParamList } from './types';

export type { MainTabParamList, RootRouteName, RootStackParamList } from './types';
export { navigationRef } from './ref';
export { useRootNavigation } from './useRootNavigation';
export type { RootNavigation } from './useRootNavigation';

/**
 * Props the static navigator passes to a root-stack screen: only `route`.
 * Use `useRootNavigation()` for navigation.
 */
export type RootScreenProps<T extends keyof RootStackParamList> = {
  route: RouteProp<RootStackParamList, T>;
};
