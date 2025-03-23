import path from 'node:path'

import { CWD, cjsRequire, isPkgAvailable, tryFile } from '@pkgr/core'
import { isDynamicPattern, globSync } from 'tinyglobby'

import { SCRIPT_RUNNERS, SCRIPT_EXECUTORS } from './constants.js'

export const tryRequirePkg = <T>(pkg: string): T | undefined => {
  try {
    return cjsRequire<T>(pkg)
  } catch {}
}

export const isTsAvailable = () => isPkgAvailable('typescript')

export const isAngularAvailable = () => isPkgAvailable('@angular/core')

export const isMdxAvailable = () =>
  isPkgAvailable('@mdx-js/mdx') || isPkgAvailable('@mdx-js/react')

export const isReactAvailable = () => isPkgAvailable('react')

export const isSvelteAvailable = () => isPkgAvailable('svelte')

export const isVueAvailable = () => isPkgAvailable('vue')

export const tryGlob = (
  paths: string[],
  options:
    | string
    | {
        absolute?: boolean
        baseDir?: string
        ignore?: [string]
      } = {},
) => {
  const {
    absolute = true,
    baseDir = CWD,
    ignore = ['**/node_modules/**'],
  } = typeof options === 'string' ? { baseDir: options } : options
  return paths.reduce<string[]>(
    (acc, pkg) =>
      [
        ...acc,
        ...(isDynamicPattern(pkg)
          ? globSync(pkg, {
              cwd: baseDir,
              ignore,
              onlyFiles: false,
            })
              // https://github.com/SuperchupuDev/tinyglobby/issues/102
              .map(file => (absolute ? path.resolve(baseDir, file) : file))
          : [tryFile(pkg, true, baseDir)]),
      ].filter(Boolean),
    [],
  )
}

/**
 * type guard for non-empty values
 */
export const identify = <T>(
  _: T,
): _ is Exclude<
  T,
  '' | (T extends boolean ? false : boolean) | null | undefined
> => !!_

/**
 * flat array and remove nullish values
 */
export const arrayify = <
  T,
  R = T extends Array<infer S> ? NonNullable<S> : NonNullable<T>,
>(
  ...args: Array<R | R[]>
) =>
  args.reduce<R[]>((arr, curr) => {
    if (curr != null) {
      arr.push(
        ...(Array.isArray(curr) ? curr.filter(it => it != null) : [curr]),
      )
    }
    return arr
  }, [])

export const getPackageManager = () => {
  const execPath = process.env.npm_execpath

  if (!execPath) {
    return
  }

  if (/\byarn\b/.test(execPath)) {
    return 'yarn'
  }

  if (/\bpnpm\b/.test(execPath)) {
    return 'pnpm'
  }

  if (/\bnpm\b/.test(execPath)) {
    return 'npm'
  }

  if (/\bbun\b/.test(execPath)) {
    return 'bun'
  }

  console.warn('unknown package manager:', execPath)
}

export const getScriptRunner = () => {
  const pm = getPackageManager()

  if (!pm) {
    return
  }

  return SCRIPT_RUNNERS[pm]
}

export const getScriptExecutor = () => {
  const pm = getPackageManager()

  if (!pm) {
    return
  }

  return SCRIPT_EXECUTORS[pm]
}
