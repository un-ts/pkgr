import { MODULE_DEFINITIONS, alias, entries } from '..'

describe('es modules', () => {
  it('entries should contain all definition keys', () => {
    expect(entries.map(({ find }) => find)).toEqual(
      expect.arrayContaining(Object.keys(MODULE_DEFINITIONS)),
    )
  })

  it('should contain extra keys from definitions', () => {
    const extraKeys = entries
      .map(({ find }) => find)
      .filter(_ => !Object.keys(MODULE_DEFINITIONS).includes(_ as string))
    expect(extraKeys).toBeTruthy()
    expect(extraKeys.every(key => key instanceof RegExp)).toBe(true)
  })

  // it('alias should not contain all definition keys', () => {
  //   expect(Object.keys(alias)).not.toEqual(
  //     expect.arrayContaining(Object.keys(MODULE_DEFINITIONS)),
  //   )
  // })

  it('alias should contain same number of definition keys', () => {
    expect(Object.keys(alias).length).toEqual(
      Object.keys(MODULE_DEFINITIONS).length,
    )
  })
})
