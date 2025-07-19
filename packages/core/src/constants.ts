/// <reference types="node" preserve="true" />

import { createRequire } from 'node:module'

export interface CjsRequire extends NodeJS.Require {
  <T>(id: string): T
}

export const cjsRequire: CjsRequire =
  typeof require === 'function' ? require : createRequire(import.meta.url)

// eslint-disable-next-line sonarjs/deprecation
export const EXTENSIONS = ['.ts', '.tsx', ...Object.keys(cjsRequire.extensions)]
