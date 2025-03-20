import fs from 'node:fs'
import path from 'node:path'

import { CWD, EXTENSIONS, cjsRequire } from './constants.js'

export const tryPkg = (pkg: string) => {
  try {
    return cjsRequire.resolve(pkg)
  } catch {}
}

export const isPkgAvailable = (pkg: string) => !!tryPkg(pkg)

export const tryFile = (
  filename?: string[] | string,
  includeDir = false,
  base = CWD,
): string => {
  if (typeof filename === 'string') {
    const filepath = path.resolve(base, filename)
    return fs.existsSync(filepath) &&
      (includeDir || fs.statSync(filepath).isFile())
      ? filepath
      : ''
  }

  for (const file of filename ?? []) {
    const filepath = tryFile(file, includeDir, base)
    if (filepath) {
      return filepath
    }
  }

  return ''
}

export const tryExtensions = (filepath: string, extensions = EXTENSIONS) => {
  const ext = [...extensions, ''].find(ext => tryFile(filepath + ext))
  return ext == null ? '' : filepath + ext
}

export const findUp = (
  searchEntry: string,
  searchFileOrIncludeDir?: boolean | string,
  includeDir?: boolean,
) => {
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

  const isSearchFile = typeof searchFileOrIncludeDir === 'string'

  const searchFile = isSearchFile ? searchFileOrIncludeDir : 'package.json'

  do {
    const searched = tryFile(
      path.resolve(searchEntry, searchFile),
      isSearchFile && includeDir,
    )
    if (searched) {
      return searched
    }
    searchEntry = path.resolve(searchEntry, '..')
  } while (searchEntry === CWD || searchEntry.startsWith(CWD + path.sep))

  return ''
}
