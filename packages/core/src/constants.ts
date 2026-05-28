/// <reference types="node" preserve="true" />

import { createRequire } from 'node:module'

export interface CjsRequire extends NodeJS.Require {
  <T>(id: string): T
}

export const cjsRequire: CjsRequire =
  typeof require === 'function' ? require : createRequire(import.meta.url)

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, sonarjs/deprecation
const DEFAULT_EXTENSIONS = cjsRequire.extensions
  ? // eslint-disable-next-line sonarjs/deprecation
    Object.keys(cjsRequire.extensions)
  : // `require.extensions` could be `undefined` - #430
    ['.js', '.json', '.node']

export const EXTENSIONS = ['.ts', '.tsx', ...DEFAULT_EXTENSIONS]
