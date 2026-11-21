module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup-after-env.ts'],
  testTimeout: 30000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native-file-access$': '<rootDir>/jest/mocks/react-native-file-access.ts',
    '^react-native-google-mobile-ads$': '<rootDir>/jest/mocks/react-native-google-mobile-ads.tsx',
    '^react-native-notify-kit$': '<rootDir>/node_modules/react-native-notify-kit/jest-mock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-.*|@shopify/flash-list|gifted-charts-core|nitro-core)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.claude/', '/android/', '/ios/', '/.maestro/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
