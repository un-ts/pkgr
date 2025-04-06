import recommended from '@1stg/eslint-config'

export default [
  ...recommended,
  {
    rules: {
      'sonarjs/no-nested-conditional': 'off',
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      '@eslint-react/jsx-uses-react': 'off',
    },
  },
]
