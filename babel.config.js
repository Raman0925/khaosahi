module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // zod 4 uses `export * as ns from`, which Metro's preset does not transform.
    '@babel/plugin-transform-export-namespace-from',
    [
      'module-resolver',
      {
        root: ['./'],
        alias: { '@': './src' },
        extensions: ['.ts', '.tsx', '.js', '.json'],
      },
    ],
  ],
};
