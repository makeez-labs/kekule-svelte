import eslint from '@eslint/js';
import tsEslint from 'typescript-eslint';
import svelteEslint from 'eslint-plugin-svelte';
import globals from 'globals';

export default [
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  ...svelteEslint.configs['flat/recommended'],
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'svelte/no-dom-manipulating': 'off',
    },
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
        parser: tsEslint.parser,
        extraFileExtensions: ['.svelte'],
      },
    },
  },
];
