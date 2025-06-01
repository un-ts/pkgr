import fs, { type Stats } from 'node:fs'
import path from 'node:path'

import { CWD, EXTENSIONS, cjsRequire } from './constants.js'

export const tryPkg = (pkg: string) => {
  try {
    return cjsRequire.resolve(pkg)
  } catch {}
}

export const isPkgAvailable = (pkg: string) => Boolean(tryPkg(pkg))

export type FileTypeBase =
  | 'blockDevice'
  | 'characterDevice'
  | 'directory'
  | 'FIFO'
  | 'file'
  | 'socket'
  | 'symbolicLink'

export type FileType = Capitalize<FileTypeBase> | FileTypeBase

export type FileTypes = FileType | FileType[] | boolean | 'any'

const ANY_FILE_TYPES = new Set(['any', true])

const isAnyFileType = (type: FileTypes): type is 'any' | true =>
  ANY_FILE_TYPES.has(type as boolean | string)

export const tryFileStats = (
  filename?: string[] | string,
  type: FileTypes = 'file',
  base = CWD,
): { filepath: string; stats: Stats } | undefined => {
  if (!type) {
    type = 'file'
  }

  if (typeof filename === 'string') {
    const filepath = path.resolve(base, filename)
    const stats = fs.statSync(filepath, { throwIfNoEntry: false })
    return stats &&
      (isAnyFileType(type) ||
        (Array.isArray(type) ? type : [type]).some(type =>
          stats[
            `is${type[0].toUpperCase()}${type.slice(1)}` as `is${Capitalize<FileTypeBase>}`
          ](),
        ))
      ? { filepath, stats }
      : undefined
  }

  for (const file of filename ?? []) {
    const result = tryFileStats(file, type, base)
    if (result) {
      return result
    }
  }
}

export const tryFile = (
  filename?: string[] | string,
  type: FileTypes = 'file',
  base?: string,
): string => tryFileStats(filename, type, base)?.filepath ?? ''

export const tryExtensions = (filepath: string, extensions = EXTENSIONS) => {
  const ext = [...extensions, ''].find(ext => tryFile(filepath + ext))
  return ext == null ? '' : filepath + ext
}

export interface FindUpOptions {
  entry?: string
  search?: string[] | string
  type?: FileTypes
  stop?: string
  throwOnStopNotFound?: boolean
  throwOnInvalidStop?: boolean
}

export const findUp = (
  entryOrOptions?: FindUpOptions | string,
  options?: FindUpOptions,
  // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
  if (typeof entryOrOptions === 'string') {
    options = {
      entry: entryOrOptions,
      ...options,
    }
  }

  let {
    entry = CWD,
    search = 'package.json',
    type,
    stop,
    throwOnStopNotFound,
    throwOnInvalidStop,
  } = options ?? {}

  search = Array.isArray(search) ? search : [search]

  if (stop) {
    const stopStats = tryFileStats(stop, ['file', 'directory'])
    if (!stopStats) {
      const message = `Cannot find stop path: ${stop}`
      if (throwOnStopNotFound) {
        throw new Error(message)
      } else if (throwOnStopNotFound !== false) {
        console.warn(message)
      }
      return ''
    }
    stop = stopStats.stats.isDirectory()
      ? stopStats.filepath
      : path.dirname(stopStats.filepath)

    if (entry !== stop && !entry.startsWith(stop + path.sep)) {
      const message = `Invalid stop path: ${stop} is not a parent of ${entry}`
      if (throwOnInvalidStop) {
        throw new Error(message)
      } else if (throwOnInvalidStop !== false) {
        console.warn(message)
      }
      return ''
    }
  }

  const entryStats = tryFileStats(entry, ['file', 'directory'])

  if (!entryStats) {
    return ''
  }

  entry = entryStats.stats.isDirectory()
    ? entryStats.filepath
    : path.dirname(entryStats.filepath)

  do {
    const searched = tryFile(search, type, entry)
    if (searched) {
      return searched
    }
    const lastEntry = entry
    entry = path.dirname(entry)
    if (entry === lastEntry) {
      break
    }
  } while (!stop || entry !== stop)

  return ''
}
