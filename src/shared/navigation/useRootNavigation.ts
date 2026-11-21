import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from './types';

export type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

/**
 * Typed navigation for any screen. Screens in the static navigator receive only a `route` prop
 * (no `navigation` prop), so always get navigation from this hook.
 */
export function useRootNavigation(): RootNavigation {
  return useNavigation<RootNavigation>();
}
