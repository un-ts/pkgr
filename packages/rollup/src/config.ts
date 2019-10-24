import { namedExports } from '@pkgr/named-exports'
import {
  StringMap,
  getGlobals,
  normalizePkg,
  upperCamelCase,
} from '@pkgr/umd-globals'
import alias, { AliasOptions } from '@rxts/rollup-plugin-alias'
import builtinModules from 'builtin-modules'
import debug from 'debug'
import fs from 'fs'
import flatMap from 'lodash/flatMap'
import path from 'path'
import {
  ModuleFormat,
  OutputOptions,
  RollupOptions,
  RollupWarning,
  WarningHandler,
} from 'rollup'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import copy, { CopyOptions } from 'rollup-plugin-copy'
import json from 'rollup-plugin-json'
import nodeResolve from 'rollup-plugin-node-resolve'
import postcss, { PostCssPluginOptions } from 'rollup-plugin-postcss'
import replace from 'rollup-plugin-replace'
import { terser } from 'rollup-plugin-terser'
import typescript, { TypeScriptOptions } from 'rollup-plugin-typescript'
import url from 'rollup-plugin-url'

const info = debug('r:info')

const DEV = 'development'
const PROD = 'production'

const { NODE_ENV = DEV } = process.env
const __DEV__ = NODE_ENV === DEV

const STYLE_EXTENSIONS = [
  '.css',
  '.less',
  '.pcss',
  '.sass',
  '.scss',
  '.styl',
  '.stylus',
]
const IMAGE_EXTENSIONS = [
  '.bmp',
  '.gif',
  '.jpeg',
  '.jpg',
  '.png',
  '.svg',
  '.webp',
]
const ASSETS_EXTENSIONS = STYLE_EXTENSIONS.concat(IMAGE_EXTENSIONS)

const resolve = ({ deps, node }: { deps?: string[]; node?: boolean } = {}) =>
  nodeResolve({
    dedupe: node ? undefined : deps,
    mainFields: [
      !node && 'browser',
      'esnext',
      'es2015',
      'esm2015',
      'fesm2015',
      'esm5',
      'fesm5',
      'module',
      'jsnext:main',
      'main',
    ].filter(Boolean) as readonly string[],
    preferBuiltins: node,
  })

const cjs = (sourceMap: boolean) =>
  commonjs({
    // TODO: add package @pkgr/cjs-ignore ?
    // see also: https://github.com/rollup/rollup-plugin-commonjs/issues/244#issuecomment-536168280
    // hard-coded temporarily
    ignore: ['invariant', 'react-draggable'],
    namedExports,
    sourceMap,
  })

const BASIC_PLUGINS = [
  json(),
  url({ include: IMAGE_EXTENSIONS.map(ext => `**/*${ext}`) }),
]

const DEFAULT_FORMATS = ['cjs', 'es2015', 'esm']

let isTsAvailable = false

try {
  // eslint-disable-next-line node/no-extraneous-require
  isTsAvailable = !!require.resolve('typescript')
} catch (e) {}

// eslint-disable-next-line node/no-deprecated-api
const EXTENSIONS = Object.keys(require.extensions)

if (isTsAvailable) {
  EXTENSIONS.unshift('.ts', '.tsx')
}

const tryExtensions = (filepath: string) => {
  const ext = EXTENSIONS.find(ext => fs.existsSync(filepath + ext))
  return ext ? filepath + ext : filepath
}

const tryRegExp = (exp: string | RegExp) => {
  if (typeof exp !== 'string' || !(exp = exp.trim())) {
    return exp
  }
  const matched = /^\/(.*)\/([gimsuy]*)$/.exec(exp)
  if (matched) {
    try {
      return new RegExp(matched[1], matched[2])
    } catch {}
  }
  return exp
}

const onwarn = (warning: string | RollupWarning, warn: WarningHandler) => {
  if (typeof warning !== 'string' && warning.code === 'THIS_IS_UNDEFINED') {
    return
  }
  warn(warning)
}

export type Format = 'cjs' | 'es2015' | 'es5' | 'esm' | 'umd'

export interface ConfigOptions {
  formats?: ModuleFormat[]
  monorepo?: boolean | string
  input?: string
  exclude?: string[]
  outputDir?: string
  exports?: OutputOptions['exports']
  externals?: string[]
  globals?: StringMap
  aliases?: StringMap | AliasOptions['entries']
  copies?: StringMap | CopyOptions['targets'] | CopyOptions
  sourceMap?: boolean
  typescript?: TypeScriptOptions
  postcss?: PostCssPluginOptions
  prod?: boolean
}

export const COPY_OPTIONS_KEYS: Array<keyof CopyOptions> = [
  'targets',
  'verbose',
  'hook',
  'copyOnce',
]

const isCopyOptions = (
  copies: ConfigOptions['copies'],
): copies is CopyOptions =>
  !Array.isArray(copies) &&
  Object.keys(copies!).every(key =>
    COPY_OPTIONS_KEYS.includes(key as keyof CopyOptions),
  )

const config = ({
  formats,
  monorepo,
  input,
  exclude = [],
  outputDir = 'lib',
  exports,
  externals = [],
  globals: umdGlobals,
  aliases = [],
  copies = [],
  sourceMap = false,
  typescript: typescriptOptions,
  postcss: postcssOpts,
  prod = process.env.NODE_ENV === PROD,
}: ConfigOptions = {}) => {
  const pkgsPath = path.resolve(
    typeof monorepo === 'string' ? monorepo : 'packages',
  )

  if (monorepo !== false) {
    monorepo = fs.existsSync(pkgsPath)
  }

  const pkgs = monorepo ? fs.readdirSync(pkgsPath) : ['']

  const globals = getGlobals({
    globals: umdGlobals,
  })

  const aliasOptions = {
    resolve: EXTENSIONS.concat(ASSETS_EXTENSIONS),
    entries: Array.isArray(aliases)
      ? aliases.map(({ find, replacement }) => ({
          find: tryRegExp(find),
          replacement,
        }))
      : Object.entries(aliases).map(([find, replacement]) => ({
          find: tryRegExp(find),
          replacement,
        })),
  }

  const copyOptions: CopyOptions = isCopyOptions(copies)
    ? copies
    : {
        targets: Array.isArray(copies)
          ? copies
          : Object.entries(copies).map(([src, dest]) => ({
              src,
              dest,
            })),
      }

  const configs = flatMap(pkgs, pkg => {
    const pkgPath = path.resolve(monorepo ? pkgsPath : '', pkg)
    const srcPath = path.resolve(pkgPath, 'src')

    let pkgInput = input
    let pkgOutputDir = outputDir

    if (!fs.existsSync(srcPath) && pkgInput == null) {
      pkgInput = 'index'
    }

    pkgInput = tryExtensions(path.resolve(pkgPath, pkgInput || 'src/index'))

    const isAbsolute = path.isAbsolute(pkgInput)

    if (pkgOutputDir && !pkgOutputDir.endsWith('/')) {
      pkgOutputDir = pkgOutputDir + '/'
    }

    if (
      !fs.existsSync(pkgInput) ||
      (isAbsolute && !pkgInput.startsWith(pkgPath))
    ) {
      return []
    }

    const {
      name,
      engines: { node } = {},
      dependencies = {},
      peerDependencies = {},
    }: {
      name: string
      engines: StringMap
      dependencies: StringMap
      peerDependencies: StringMap
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    } = require(path.resolve(pkgPath, 'package.json'))

    if (exclude.includes(name) || exclude.includes(pkg)) {
      return []
    }

    const deps = Object.keys(dependencies)

    const external = externals.concat(
      Object.keys(peerDependencies),
      node ? deps.concat(builtinModules) : [],
    )

    const isTsInput = /\.tsx?/.test(pkgInput)
    const pkgFormats =
      formats && formats.length
        ? formats
        : DEFAULT_FORMATS.concat(node ? [] : 'umd')
    const pkgGlobals = external.reduce((pkgGlobals, pkg) => {
      if (pkgGlobals[pkg] == null) {
        pkgGlobals[pkg] = upperCamelCase(normalizePkg(pkg))
      }
      return pkgGlobals
    }, globals)

    return pkgFormats.map(format => {
      const isEsVersion = /^es(\d+|next)$/.test(format) && format !== 'es5'
      const options: RollupOptions = {
        input: pkgInput,
        output: {
          file: path.resolve(
            pkgPath,
            `${pkgOutputDir}${format}${prod ? '.min' : ''}.js`,
          ),
          format: isEsVersion ? 'esm' : format,
          name: pkgGlobals[name] || upperCamelCase(normalizePkg(name)),
          globals,
          exports,
        } as RollupOptions['output'],
        external: id =>
          external.some(pkg => id === pkg || id.startsWith(pkg + '/')),
        onwarn,
        plugins: [
          alias(aliasOptions),
          isTsAvailable && isTsInput
            ? typescript({
                jsx: 'react',
                module: 'esnext',
                ...typescriptOptions,
                target: isEsVersion ? format : 'es5',
              })
            : babel({
                exclude: ['*.min.js', '*.production.js'],
                presets: [
                  [
                    '@babel/preset-env',
                    isEsVersion
                      ? {
                          targets: {
                            esmodules: true,
                          },
                        }
                      : undefined,
                  ],
                ],
              }),
        ].concat(
          resolve({
            deps,
            node: !!node,
          }),
          cjs(sourceMap),
          copy(copyOptions),
          BASIC_PLUGINS,
          postcss(postcssOpts),
          // __DEV__ will always be replaced while `process.env.NODE_ENV` will be preserved except on production
          prod
            ? [
                replace({
                  __DEV__: JSON.stringify(false),
                  'process.env.NODE_ENV': JSON.stringify(PROD),
                }),
                terser(),
              ]
            : [
                replace({
                  __DEV__: JSON.stringify(__DEV__),
                }),
              ],
        ),
      }

      return options
    })
  })

  console.assert(
    configs.length,
    "No configuration resolved, mark sure you've setup correctly",
  )

  return configs
}

export default (options: ConfigOptions = {}) => {
  const configs = config(options).concat(
    options.prod ? config(Object.assign({}, options, { prod: false })) : [],
  )

  info('configs: %O', configs)

  return configs
}
