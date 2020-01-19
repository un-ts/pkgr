export const DEV = 'development' as const
export const PROD = 'production' as const

export const { NODE_ENV = DEV } = process.env

export const __DEV__ = NODE_ENV === DEV
export const __PROD__ = NODE_ENV === PROD

export const NODE_MODULES_REG = /[/\\]node_modules[/\\]/

export const CWD = process.cwd()

export const EXTENSIONS = ['.ts', '.tsx'].concat(
  // eslint-disable-next-line node/no-deprecated-api
  Object.keys(require.extensions),
)
