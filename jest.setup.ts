/* Global Jest mocks for native modules. Keep mocks minimal and close to real behaviour. */
import { jest } from '@jest/globals';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual<{ default: object }>('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-localize', () =>
  jest.requireActual<typeof import('react-native-localize/mock')>('react-native-localize/mock'),
);

jest.mock('react-native-bootsplash', () => ({
  __esModule: true,
  default: { hide: jest.fn(() => Promise.resolve()), isVisible: jest.fn(() => false) },
}));

jest.mock('react-native-config', () => ({ __esModule: true, default: {} }));

// react-native-mmkv uses its in-memory mock under Jest; only the Nitro import needs stubbing.
jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: jest.fn(() => {
      throw new Error('Nitro hybrid objects are not available in Jest');
    }),
  },
}));
