import fs from 'fs'
import path from 'path'

export const tryPkg = (pkg: string) => {
  try {
    return require.resolve(pkg)
  } catch {}
}

export const isPkgAvailable = (pkg: string) => !!tryPkg(pkg)

export const isTsAvailable = tryPkg('typescript')

export const isReactAvailable = tryPkg('react')

export const isMdxAvailable = tryPkg('@mdx/mdx') || tryPkg('@mdx/react')

export const isVueAvailable = tryPkg('vue')

export const tryFile = (filePath?: string | string[]) => {
  if (typeof filePath === 'string') {
    return fs.existsSync(filePath) ? filePath : ''
  }

  for (const file of filePath || []) {
    if (tryFile(file)) {
      return file
    }
  }

  return ''
}

// eslint-disable-next-line node/no-deprecated-api
export const EXTENSIONS = Object.keys(require.extensions)

if (isTsAvailable) {
  EXTENSIONS.unshift('.ts', '.tsx')
}

export const tryExtensions = (filepath: string, extensions = EXTENSIONS) => {
  const ext = extensions.find(ext => fs.existsSync(filepath + ext))
  return ext ? filepath + ext : ''
}

export const identify = <T>(
  _: T,
): _ is Exclude<
  T,
  (T extends boolean ? false : boolean) | '' | null | undefined
> => !!_

const cwd = process.cwd()

export const findUp = (searchEntry: string, searchFile = 'package.json') => {
  console.assert(path.isAbsolute(searchEntry))

  if (
    !tryFile(searchEntry) ||
    (searchEntry !== cwd && !searchEntry.startsWith(cwd + path.sep))
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
  } while (searchEntry === cwd || searchEntry.startsWith(cwd + path.sep))

  return ''
}
