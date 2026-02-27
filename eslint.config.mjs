import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import-x';
import regexpPlugin from 'eslint-plugin-regexp';
import vueParser from 'vue-eslint-parser';
import vuePlugin from 'eslint-plugin-vue';

export default [
  {
    ignores: ['**/dist/**', '**/out-tsc/**', '**/node_modules/**'],
  },
  // TypeScript 文件
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      regexp: regexpPlugin,
      vue: vuePlugin,
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  // Vue 文件
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      regexp: regexpPlugin,
      vue: vuePlugin,
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  // 测试文件豁免
  {
    files: ['**/__tests__/**', '**/e2e/**', '**/*.spec.ts', '**/*.test.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  // 构建脚本 / CLI 工具 / 文档 / Demo 豁免 no-console
  {
    files: ['**/scripts/**', '**/internal/**', '**/docs/**'],
    rules: {
      'no-console': 'off',
    },
  },
];
