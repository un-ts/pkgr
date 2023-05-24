import path from 'node:path'

import { tryGlob, tryRequirePkg } from './helpers.js'

const pkg =
  tryRequirePkg<{ workspaces?: string[] }>(path.resolve('package.json')) ?? {}

const lernaConfig =
  tryRequirePkg<{ packages?: string[] }>(path.resolve('lerna.json')) ?? {}

const pkgsPath = lernaConfig.packages ?? pkg.workspaces ?? []

export const isMonorepo = Array.isArray(pkgsPath) && pkgsPath.length > 0

export const monorepoPkgs = isMonorepo
  ? tryGlob(
      pkgsPath.map(pkg =>
        pkg.endsWith('/package.json') ? pkg : `${pkg}/package.json`,
      ),
    )
  : []
