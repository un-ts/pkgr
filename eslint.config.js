import recommended from '@1stg/eslint-config'

export default [
  ...recommended,
  {
    rules: {
      'sonarjs/no-nested-conditional': 'off',
    },
  },
]
