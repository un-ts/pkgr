/// <reference types="node" preserve="true" />

import { createRequire } from 'node:module'

export const CWD = process.cwd()

export interface CjsRequire extends NodeJS.Require {
  <T>(id: string): T
}

const importMetaUrl = import.meta.url

export const cjsRequire: CjsRequire = importMetaUrl
  ? createRequire(importMetaUrl)
  : require

export const EVAL_FILENAMES = new Set(['[eval]', '[worker eval]'])

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, sonarjs/deprecation
const DEFAULT_EXTENSIONS = cjsRequire.extensions
  ? // eslint-disable-next-line sonarjs/deprecation
    Object.keys(cjsRequire.extensions)
  : // `require.extensions` could be `undefined` - #430
    ['.js', '.json', '.node']

export const EXTENSIONS = ['.ts', '.tsx', ...DEFAULT_EXTENSIONS]
