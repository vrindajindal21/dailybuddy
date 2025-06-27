// Basic ESLint config for Next.js, React, and TypeScript
import js from '@eslint/js';
import next from 'eslint-config-next';

export default [
  js.config({
    extends: [
      'eslint:recommended',
      'plugin:react/recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:react-hooks/recommended',
      'plugin:jsx-a11y/recommended',
      'plugin:import/recommended',
      'plugin:import/typescript',
      'next/core-web-vitals',
    ],
    plugins: ['@typescript-eslint', 'react', 'react-hooks', 'jsx-a11y', 'import'],
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
    },
    env: {
      browser: true,
      node: true,
      es2022: true,
    },
    settings: {
      react: { version: 'detect' },
    },
  }),
  ...next,
]; 