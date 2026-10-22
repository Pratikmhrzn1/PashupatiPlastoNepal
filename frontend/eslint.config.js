import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dev-dist', 'node_modules', 'public/mockServiceWorker.js']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  // Module boundaries: features must not import from other features.
  // A feature's own files are imported relatively (./ProductCard), so any
  // "@/features/*" import from inside a feature folder is by definition a
  // cross-feature import and is banned. shared/services/config/i18n are allowed.
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', '@/features'],
              message:
                'Features must not import each other. Put shared code in src/shared, or re-export through a feature barrel only if you own it.',
            },
          ],
        },
      ],
    },
  },
  // shared/ must stay dependency-light: no feature, service, or app imports.
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', '@/services/*', '@/app/*'],
              message: 'shared/ must not depend on features, services, or app.',
            },
          ],
        },
      ],
    },
  },
  // services/ is the only place allowed to talk to the network.
  {
    files: ['src/services/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', '@/shared/*'],
              message: 'services/ must not depend on features or shared UI.',
            },
          ],
        },
      ],
    },
  },
])
