import fs from 'fs'
import path from 'path'

import { CWD, EXTENSIONS } from './constants'

export const tryPkg = (pkg: string) => {
  try {
    return require.resolve(pkg)
  } catch {}
}

export const isPkgAvailable = (pkg: string) => !!tryPkg(pkg)

export const isTsAvailable = isPkgAvailable('typescript')

export const isAngularAvailable = isPkgAvailable('@angular/core')

export const isReactAvailable = isPkgAvailable('react')

export const isMdxAvailable =
  isPkgAvailable('@mdx/mdx') || isPkgAvailable('@mdx/react')

export const isVueAvailable = isPkgAvailable('vue')

export const tryFile = (filePath?: string | string[], includeDir?: boolean) => {
  if (typeof filePath === 'string') {
    return fs.existsSync(filePath) &&
      (includeDir || fs.statSync(filePath).isFile())
      ? filePath
      : ''
  }

  for (const file of filePath || []) {
    if (tryFile(file, includeDir)) {
      return file
    }
  }

  return ''
}

export const tryExtensions = (filepath: string, extensions = EXTENSIONS) => {
  const ext = extensions.concat('').find(ext => tryFile(filepath + ext))
  return ext == null ? '' : filepath + ext
}

export const identify = <T>(
  _: T,
): _ is Exclude<
  T,
  (T extends boolean ? false : boolean) | '' | null | undefined
> => !!_

export const findUp = (searchEntry: string, searchFile = 'package.json') => {
  console.assert(path.isAbsolute(searchEntry))

  if (
    !tryFile(searchEntry, true) ||
    (searchEntry !== CWD && !searchEntry.startsWith(CWD + path.sep))
  ) {
    return ''
  }

  searchEntry = path.resolve(
    fs.statSync(searchEntry).isDirectory()
      ? searchEntry
      : path.resolve(searchEntry, '..'),
  )

  do {
    const searched = tryFile(path.resolve(searchEntry, searchFile))
    if (searched) {
      return searched
    }
    searchEntry = path.resolve(searchEntry, '..')
  } while (searchEntry === CWD || searchEntry.startsWith(CWD + path.sep))

  return ''
}
