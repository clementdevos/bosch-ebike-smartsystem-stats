import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import * as reactPlugin from '@eslint-react/eslint-plugin'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactPlugin.configs['recommended-typescript'],
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_', varsIgnorePattern: '^_'}],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    ignores: ['dist/', 'src/routeTree.gen.ts'],
  }
)
