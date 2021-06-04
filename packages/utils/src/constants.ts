export const DEV = 'development' as const
export const PROD = 'production' as const

export const NODE_ENV = process.env.NODE_ENV ?? DEV

export const __DEV__ = NODE_ENV === DEV
export const __PROD__ = NODE_ENV === PROD

export const NODE_MODULES_REG = /[/\\]node_modules[/\\]/

export const CWD = process.cwd()

// eslint-disable-next-line node/no-deprecated-api, sonar/deprecation
export const EXTENSIONS = ['.ts', '.tsx', ...Object.keys(require.extensions)]
