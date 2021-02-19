import _, {
  asIsReducer,
  getGlobals,
  globals,
  normalizePkg,
  upperCamelCase,
  upperCamelCaseReducer,
} from '..'

const UPPER_CAMEL_CASE = 'upper-camel-case'

describe('umd globals', () => {
  it('default export and `globals` named export should be same exactly', () =>
    expect(_).toBe(globals))

  it('should be a string map', () =>
    expect(
      Object.values(globals).every(_ => typeof _ === 'string'),
    ).toBeTruthy())

  it('should be able to parse empty params', () =>
    expect(getGlobals({})).toStrictEqual(globals))

  it('should be able to override globals', () =>
    expect(
      getGlobals({
        globals: {
          'react-dom': upperCamelCase('react-dom'),
        },
      }),
    ).toMatchObject({
      'react-dom': 'ReactDom',
    }))
})

describe('normalize pkg name', () => {
  it('should normalize scoped pkg correctly', () =>
    expect(normalizePkg('@rxts/vue-qrcode')).toBe('vue-qrcode'))
})

describe('upperCamelCase util', () => {
  it('should resolve pkg case correctly', () => {
    expect(upperCamelCase('react')).toBe('React')
    expect(upperCamelCase('react-router')).toBe('ReactRouter')
  })
})

describe('reducer', () => {
  it('should work with single string param', () => {
    expect(asIsReducer('as-is')).toStrictEqual({
      'as-is': 'as-is',
    })
    expect(upperCamelCaseReducer(UPPER_CAMEL_CASE)).toStrictEqual({
      [UPPER_CAMEL_CASE]: 'UpperCamelCase',
    })
  })
  it('should work with single object param', () => {
    expect(asIsReducer({ 'as-is': 'as-is' })).toStrictEqual({
      'as-is': 'as-is',
    })
    expect(
      upperCamelCaseReducer({ [UPPER_CAMEL_CASE]: 'UpperCamelCase' }),
    ).toStrictEqual({
      [UPPER_CAMEL_CASE]: 'UpperCamelCase',
    })
  })
})
