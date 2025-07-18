module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
  ],
  root: true,
  env: {
    node: true,
    es6: true,
  },
  ignorePatterns: [
    'dist',
    'node_modules',
    '*.js',
    '*.d.ts',
    'prisma',
  ],
  rules: {
    'no-unused-vars': 'off', // Turn off for TypeScript files
    'no-console': 'off',
    'no-undef': 'off', // TypeScript handles this
  },
};