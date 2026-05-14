import eslint from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import importX from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';

export const luarizerEslintConfig = tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/vitest.config.ts',
      '**/vite.config.ts',
    ],
  },
  eslint.configs.recommended,
  {
    files: ['**/src/**/*.ts', '**/src/**/*.tsx', '**/*.test.ts'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      boundaries,
      'import-x': importX,
    },
    settings: {
      'boundaries/ignore': ['**/*.test.ts', '**/*.test.tsx'],
      'boundaries/include': ['**/src/**/*.ts', '**/src/**/*.tsx'],
      'boundaries/elements': [
        { type: 'domain', pattern: '**/src/domain/**/*' },
        { type: 'application', pattern: '**/src/application/**/*' },
        { type: 'infrastructure', pattern: '**/src/infrastructure/**/*' },
        { type: 'presentation', pattern: '**/src/presentation/**/*' },
      ],
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports', prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      'import-x/no-default-export': 'error',
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'domain', allow: ['domain'] },
            { from: 'application', allow: ['domain', 'application'] },
            { from: 'infrastructure', allow: ['domain', 'application', 'infrastructure'] },
            { from: 'presentation', allow: ['domain', 'application', 'presentation'] },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message: 'Use named exports only (no default exports in src).',
        },
      ],
    },
  },
  {
    files: ['**/examples/business-scripting-engine/src/businessSurface.ts'],
    rules: {
      'import-x/no-default-export': 'off',
      'no-restricted-syntax': 'off',
    },
  },
);
