/* eslint-disable node/no-extraneous-import */

import { writeFile } from 'fs'
import path from 'path'
import { promisify } from 'util'

import glob from 'tiny-glob'

import prettier from 'prettier'
import isGlob from 'is-glob'

interface Pkg {
  core: string
  extra?: string | string[]
}

const PKGS: Array<Pkg | string> = [
  {
    core: 'prettier',
    extra: 'parser-*',
  },
  'react',
  'react-dom',
]

const combinePkg = (pkg: string, exports: {}) =>
  Object.assign(exports, {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    [pkg]: Object.keys(require(pkg)).filter(key => !/^[_$]/.test(key)),
  })

const namedExports = PKGS.reduce(async (exported, pkg) => {
  const exports = await exported
  const { core, extra }: Pkg = typeof pkg === 'string' ? { core: pkg } : pkg
  combinePkg(core, exports)
  if (extra != null) {
    const extras = Array.isArray(extra) ? extra : [extra]
    for (const sub of extras) {
      if (isGlob(sub)) {
        const cwd = path.resolve(require.resolve(core + '/package.json'), '..')
        const matched = await glob(sub, {
          cwd,
        })
        if (matched.length) {
          matched.forEach(match => {
            try {
              const pathWithExt = [core, match].join('/')
              const resolved = require.resolve(pathWithExt)
              const pathWithoutExt = path.relative(
                path.resolve(cwd, '..'),
                resolved.slice(0, -path.extname(resolved).length || undefined),
              )
              combinePkg(pathWithExt, exports)
              combinePkg(pathWithoutExt, exports)
            } catch {
              // ignore unrequirable files
            }
          })
        }
      } else {
        combinePkg([core, sub].join('/'), exports)
      }
    }
  }
  return exports
}, Promise.resolve({}))

namedExports
  .then(exports =>
    promisify(writeFile)(
      path.resolve(__dirname, 'index.ts'),
      prettier.format(`
    export const namedExports = ${JSON.stringify(exports)}

    export { namedExports as default }
    `),
    ),
  )
  .catch((e: Error) => {
    console.error(e)
    process.exitCode = 1
  })
