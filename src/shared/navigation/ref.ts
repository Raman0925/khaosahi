import { createNavigationContainerRef } from '@react-navigation/native';

import type { RootStackParamList } from './types';

/**
 * Navigation ref for code outside React components (e.g. notification taps).
 * Use only when a hook is not available.
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
