import { resolve } from 'path'

import { tryGlob, tryRequirePkg } from './helpers'

const pkg =
  tryRequirePkg<{ workspaces?: string[] }>(resolve('package.json')) || {}

const lernaConfig =
  tryRequirePkg<{ packages?: string[] }>(resolve('lerna.json')) || {}

const pkgsPath = lernaConfig.packages || pkg.workspaces || []

export const isMonorepo = Array.isArray(pkgsPath) && !!pkgsPath.length

export const monorepoPkgs = isMonorepo ? tryGlob(pkgsPath) : []
