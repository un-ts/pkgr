import { createRequire } from 'node:module'

export const CWD = process.cwd()

export const cjsRequire =
  typeof require === 'undefined' ? createRequire(import.meta.url) : require

// eslint-disable-next-line sonarjs/deprecation
export const EXTENSIONS = ['.ts', '.tsx', ...Object.keys(cjsRequire.extensions)]
