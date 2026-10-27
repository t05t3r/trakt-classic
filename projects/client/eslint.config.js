import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.svelte'],

    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },
    rules: {
      // TypeScript reports undefined names; typescript-eslint turns this rule off for .ts the same way.
      'no-undef': 'off',
    },
  },
  {
    files: ['**/*.svelte.ts'],
    languageOptions: {
      parser: ts.parser,
    },
  },
  {
    ignores: [
      'build/',
      '.svelte-kit/',
      'dist/',
      'node_modules/',
      'src/lib/paraglide/',
    ],
  },
  {
    'rules': {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          'args': 'all',
          'argsIgnorePattern': '^_',
          'caughtErrors': 'all',
          'caughtErrorsIgnorePattern': '^_',
          'destructuredArrayIgnorePattern': '^_',
          'ignoreRestSiblings': true,
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          'patterns': [
            {
              'regex': '(^|/)paraglide/messages(?:\\.js|/.*)?$',
              'message':
                "Import messages with `import * as m from '$lib/features/i18n/messages.ts'`.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.svelte'],
    ignores: [
      'src/**/*.spec.ts',
      'src/**/*.test.ts',
      'src/lib/features/query/QueryDevtools.svelte',
    ],
    'rules': {
      'no-restricted-syntax': [
        'error',
        {
          'selector': 'ImportExpression',
          'message':
            "A lazy import() outside SvelteKit's loaders needs a reload-once vite:preloadError handler in hooks.client.ts first.",
        },
      ],
    },
  },
  {
    files: ['src/lib/features/i18n/messages.ts'],
    'rules': {
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['src/lib/features/navigation/NavigationProvider.svelte'],
    'rules': {
      // page.url is already resolved; resolve() would parse it as a route ID.
      'svelte/no-navigation-without-resolve': ['error', {
        'ignoreReplaceState': true,
      }],
    },
  },
  {
    files: ['src/lib/features/view-params/stores/useViewParam.ts'],
    'rules': {
      // A copy of page.url is already resolved; resolve() takes a route ID.
      'svelte/no-navigation-without-resolve': ['error', {
        'ignoreGoto': true,
      }],
    },
  },
);
