const rnConfig = require('@react-native/eslint-config/flat');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'android/**',
      'ios/**',
      'coverage/**',
      '.maestro/**',
      'vendor/**',
      '*.config.js',
      'jest.setup.ts',
      'jest.setup-after-env.ts',
    ],
  },
  ...rnConfig,
  {
    // eslint-plugin-ft-flow 2.x (bundled by @react-native/eslint-config) crashes on ESLint 9;
    // we have no Flow code, so its rules are disabled.
    files: ['**/*.js'],
    rules: { 'ft-flow/define-flow-type': 'off', 'ft-flow/use-flow-type': 'off' },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'react-native/no-inline-styles': 'warn',
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/**', '**/features/**', '@/app/**'],
              message:
                'Features import only from shared/ and content/, never from another feature or app/.',
            },
          ],
        },
      ],
    },
  },
];
