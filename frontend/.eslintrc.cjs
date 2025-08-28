module.exports = {
  env: {
    browser: true,
    es6: true,
    jest: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // Disable problematic rules for now
    'no-unused-vars': 'off',
    'no-undef': 'off',
    'no-redeclare': 'off',
    'no-case-declarations': 'off',
    'prefer-const': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    'vite.config.ts',
    'public/sw.js', // Service worker has different global scope
  ],
};