export const AS_IS_PKGS = [
  'dayjs',
  'moment',
  'prettier',
  'rxjs',
  // pkgs which has no umd module actually for now
  'tslib',
]

export const UPPER_CAMEL_CASE_PKGS = ['react', 'react-router', 'redux', 'vue']

export const normalizePkg = (pkg: string) => {
  if (pkg.startsWith('@')) {
    pkg = pkg.split('/').slice(1).join('/')
  }
  return pkg
}

export interface StringMap {
  [key: string]: string
}

export const asIsReducer = (
  globals: StringMap | string,
  pkg?: string,
): StringMap => ({
  ...(typeof globals === 'string'
    ? {
        [globals]: normalizePkg(globals),
      }
    : globals),
  ...(pkg && {
    [pkg]: normalizePkg(pkg),
  }),
})

export const upperCamelCase = (pkg: string) =>
  // eslint-disable-next-line unicorn/prefer-string-replace-all
  pkg.replace(/(^|-)([a-z])/g, (_, _$1: string, $2: string) => $2.toUpperCase())

export const upperCamelCaseReducer = (
  globals: StringMap | string,
  pkg?: string,
): StringMap => ({
  ...(typeof globals === 'string'
    ? {
        [globals]: upperCamelCase(normalizePkg(globals)),
      }
    : globals),
  ...(pkg && {
    [pkg]: upperCamelCase(normalizePkg(pkg)),
  }),
})

const GLOBALS = {
  lodash: '_',
  qrcode: 'QRCode',
  qrious: 'QRious',
  'react-dom': 'ReactDOM',
  underscore: '_',
}

export const getGlobals = ({
  asIsPkgs,
  upperCamelCasePkgs,
  globals,
}: {
  asIsPkgs?: string[]
  upperCamelCasePkgs?: string[]
  globals?: StringMap
} = {}): StringMap => ({
  ...GLOBALS,
  ...AS_IS_PKGS.reduce(asIsReducer, {}),
  ...UPPER_CAMEL_CASE_PKGS.reduce(upperCamelCaseReducer, {}),
  ...(asIsPkgs ?? []).reduce(asIsReducer, {}),
  ...(upperCamelCasePkgs ?? []).reduce(upperCamelCaseReducer, {}),
  ...globals,
})

export const globals = getGlobals()

export default globals
