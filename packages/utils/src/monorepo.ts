import path from 'node:path'

import { tryGlob, tryRequirePkg } from './helpers.js'

const getPkgPaths = () => {
  const pkg =
    tryRequirePkg<{ workspaces?: string[] }>(path.resolve('package.json')) ?? {}

  const lernaConfig =
    tryRequirePkg<{ packages?: string[] }>(path.resolve('lerna.json')) ?? {}

  return lernaConfig.packages ?? pkg.workspaces ?? []
}

export const isMonorepo = () => {
  const pkgPaths = getPkgPaths()
  return Array.isArray(pkgPaths) && pkgPaths.length > 0
}

export const getMonorepoPkgs = () =>
  isMonorepo()
    ? tryGlob(
        getPkgPaths().map(pkg =>
          pkg.endsWith('/package.json') ? pkg : `${pkg}/package.json`,
        ),
      )
    : []
