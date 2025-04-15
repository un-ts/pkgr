/// <reference types="node" preserve="true" />

import { createRequire } from 'node:module'

export const CWD = process.cwd()

export interface CjsRequire extends NodeJS.Require {
  <T>(id: string): T
}

export const cjsRequire: CjsRequire =
  typeof require === 'undefined' || __filename === '[eval]'
    ? createRequire(import.meta.url)
    : require

// eslint-disable-next-line sonarjs/deprecation
export const EXTENSIONS = ['.ts', '.tsx', ...Object.keys(cjsRequire.extensions)]
