import recommended from '@1stg/eslint-config'

export default [
  ...recommended,
  {
    rules: {
      'sonarjs/no-nested-conditional': 'off',
      'unicorn-x/no-nested-ternary': 'off',
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      '@eslint-react/jsx-uses-react': 'off',
    },
  },
]
