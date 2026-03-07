import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Warn on unused vars instead of error to allow gradual cleanup
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      // Disable useless escape as it's often false positives in regex
      'no-useless-escape': 'warn',
      // Disable case declarations as it's a style preference
      'no-case-declarations': 'warn',
      // Disable overly strict rules that flag valid React patterns
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      // Allow mixed exports in context files (hooks + components)
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
])
