import _, { namedExports } from '..'

describe('named exports', () => {
  it('default export and `namedExports` named export should be same exactly ', () =>
    expect(_).toBe(namedExports))

  it('should be a string array map', () =>
    expect(
      Object.values(namedExports).every(
        exports =>
          Array.isArray(exports) && exports.every(_ => typeof _ === 'string'),
      ),
    ).toBeTruthy())

  it('should not include any private member nor property', () =>
    expect(
      Object.values(namedExports).every(_ => _.every(_ => !/^[_$]/.test(_))),
    ).toBeTruthy())
})
