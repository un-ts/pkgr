export const DEV = 'development' as const
export const PROD = 'production' as const

export const NODE_ENV = process.env.NODE_ENV ?? DEV

export const __DEV__ = NODE_ENV === DEV
export const __PROD__ = NODE_ENV === PROD

export const NODE_MODULES_REG = /[/\\]node_modules[/\\]/

export const SCRIPT_RUNNERS = {
  npm: 'npx',
  pnpm: 'pnpm',
  yarn: 'yarn',
} as const

export const SCRIPT_EXECUTORS = {
  npm: 'npx',
  pnpm: 'pnpx', // same as 'pnpm dlx'
  yarn: 'yarn dlx',
} as const
