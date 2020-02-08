import fs from 'fs'
import path from 'path'

import { entries } from '@pkgr/es-modules'
import { namedExports } from '@pkgr/named-exports'
import {
  StringMap,
  getGlobals,
  normalizePkg,
  upperCamelCase,
} from '@pkgr/umd-globals'
import {
  CWD,
  EXTENSIONS,
  PROD,
  __DEV__,
  __PROD__,
  arrayify,
  identify,
  isTsAvailable,
  monorepoPkgs,
  tryExtensions,
  tryGlob,
  tryRequirePkg,
} from '@pkgr/utils'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import typescript, { RollupTypescriptOptions } from '@rollup/plugin-typescript'
import url from '@rollup/plugin-url'
import alias, { AliasOptions } from '@rxts/rollup-plugin-alias'
import builtinModules from 'builtin-modules'
import debug from 'debug'
import isGlob from 'is-glob'
import flatMap from 'lodash/flatMap'
import { isMatch } from 'micromatch'
import {
  ModuleFormat,
  OutputOptions,
  RollupOptions,
  RollupWarning,
  WarningHandler,
} from 'rollup'
import babel from 'rollup-plugin-babel'
import copy, { CopyOptions } from 'rollup-plugin-copy'
import postcss, { PostCssPluginOptions } from 'rollup-plugin-postcss'
import { Options as TerserOptions, terser } from 'rollup-plugin-terser'
import vue, { VuePluginOptions } from 'rollup-plugin-vue'

const info = debug('r:info')

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

const DEFAULT_FORMATS = ['cjs', 'es2015', 'esm']

const regExpCacheMap = new Map<string | RegExp, string | RegExp>()

const tryRegExp = (exp: string | RegExp) => {
  if (typeof exp === 'string' && (exp = exp.trim())) {
    const cached = regExpCacheMap.get(exp)
    if (cached != null) {
      return cached
    }

    const matched = /^\/(.*)\/([gimsuy]*)$/.exec(exp)
    if (matched) {
      try {
        const regExp = new RegExp(matched[1], matched[2])
        regExpCacheMap.set(exp, regExp)
        return regExp
      } catch {}
    }

    regExpCacheMap.set(exp, exp)
  }

  return exp
}

const onwarn = (warning: RollupWarning, warn: WarningHandler) => {
  if (warning.code === 'THIS_IS_UNDEFINED') {
    return
  }
  warn(warning)
}

export type Format = 'cjs' | 'es2015' | 'es5' | 'esm' | 'umd'

export type External =
  | string
  | string[]
  | ((id: string, collectedExternals?: string[]) => boolean)

export interface ConfigOptions {
  formats?: ModuleFormat[]
  monorepo?: boolean | string[]
  input?: string
  exclude?: string[]
  outputDir?: string
  exports?: OutputOptions['exports']
  external?: External
  externals?: External
  globals?: StringMap
  aliases?: StringMap | AliasOptions['entries']
  copies?: StringMap | CopyOptions['targets'] | CopyOptions
  sourceMap?: boolean
  typescript?: RollupTypescriptOptions
  postcss?: PostCssPluginOptions
  vue?: VuePluginOptions
  define?: boolean | {}
  terser?: TerserOptions
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

export const config = ({
  formats,
  monorepo,
  input,
  exclude = [],
  outputDir = 'lib',
  exports,
  external,
  externals = external || [],
  globals: umdGlobals,
  aliases = [],
  copies = [],
  sourceMap = false,
  typescript: typescriptOptions,
  postcss: postcssOptions,
  vue: vueOptions,
  define,
  terser: terserOptions,
  prod = __PROD__,
}: // eslint-disable-next-line sonarjs/cognitive-complexity
ConfigOptions = {}): RollupOptions[] => {
  let pkgs =
    monorepo === false
      ? [CWD]
      : Array.isArray(monorepo)
      ? tryGlob(monorepo)
      : monorepoPkgs

  if (monorepo == null && pkgs.length === 0) {
    pkgs = [CWD]
  }

  const globals = getGlobals({
    globals: umdGlobals,
  })

  const aliasOptions = {
    resolve: EXTENSIONS.concat(ASSETS_EXTENSIONS),
    entries: (Array.isArray(aliases)
      ? aliases.map(({ find, replacement }) => ({
          find: tryRegExp(find),
          replacement,
        }))
      : Object.entries(aliases).map(([find, replacement]) => ({
          find: tryRegExp(find),
          replacement,
        }))
    ).concat(entries),
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
    const srcPath = path.resolve(pkg, 'src')

    let pkgInput = input
    let pkgOutputDir = outputDir

    if (!fs.existsSync(srcPath) && pkgInput == null) {
      pkgInput = 'index'
    }

    pkgInput = tryExtensions(path.resolve(pkg, pkgInput || 'src/index'))

    if (pkgOutputDir && !pkgOutputDir.endsWith('/')) {
      pkgOutputDir = pkgOutputDir + '/'
    }

    if (!pkgInput || !pkgInput.startsWith(pkg)) {
      return []
    }

    const pkgJson = tryRequirePkg<{
      name: string
      engines: StringMap
      dependencies: StringMap
      peerDependencies: StringMap
    }>(path.resolve(pkg, 'package.json'))

    if (
      !pkgJson ||
      exclude.includes(pkgJson.name) ||
      tryGlob(exclude, path.resolve(pkg, '..')).includes(pkg)
    ) {
      return []
    }

    const {
      name,
      engines: { node = null } = {},
      dependencies = {},
      peerDependencies = {},
    } = pkgJson

    const deps = Object.keys(dependencies)

    const collectedExternals =
      typeof externals === 'function'
        ? []
        : arrayify(externals).concat(
            Object.keys(peerDependencies),
            node ? deps.concat(builtinModules) : [],
          )

    const isTsInput = /\.tsx?/.test(pkgInput)
    const pkgFormats =
      formats && formats.length > 0
        ? formats
        : DEFAULT_FORMATS.concat(node ? [] : 'umd')
    const pkgGlobals = collectedExternals.reduce((pkgGlobals, pkg) => {
      if (pkgGlobals[pkg] == null) {
        pkgGlobals[pkg] = upperCamelCase(normalizePkg(pkg))
      }
      return pkgGlobals
    }, globals)

    let defineValues: {} | undefined

    if (define) {
      defineValues = Object.entries(define).reduce(
        (acc, [key, value]) =>
          Object.assign(acc, {
            [key]: JSON.stringify(value),
          }),
        {},
      )
    }

    return pkgFormats.map(format => {
      const isEsVersion = /^es(\d+|next)$/.test(format) && format !== 'es5'
      return {
        input: pkgInput,
        output: {
          file: path.resolve(
            pkg,
            `${pkgOutputDir}${format}${prod ? '.min' : ''}.js`,
          ),
          format: isEsVersion ? 'esm' : (format as ModuleFormat),
          name: pkgGlobals[name] || upperCamelCase(normalizePkg(name)),
          globals,
          exports,
        },
        external(id: string) {
          if (typeof externals === 'function') {
            return externals.call(this, id, collectedExternals)
          }
          return collectedExternals.some(pkg => {
            const pkgRegExp = tryRegExp(pkg)
            return pkgRegExp instanceof RegExp
              ? pkgRegExp.test(id)
              : isGlob(pkg)
              ? isMatch(id, pkg)
              : id === pkg || id.startsWith(`${pkg}/`)
          })
        },
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
          resolve({
            deps,
            node: !!node,
          }),
          cjs(sourceMap),
          copy(copyOptions),
          json(),
          url({ include: IMAGE_EXTENSIONS.map(ext => `**/*${ext}`) }),
          postcss(postcssOptions),
          vue(vueOptions),
        ].concat(
          [
            // __DEV__ and __PROD__ will always be replaced while `process.env.NODE_ENV` will be preserved except on production
            define &&
              replace(
                prod
                  ? {
                      ...defineValues,
                      __DEV__: JSON.stringify(false),
                      __PROD__: JSON.stringify(true),
                      'process.env.NODE_ENV': JSON.stringify(PROD),
                    }
                  : {
                      ...defineValues,
                      __DEV__: JSON.stringify(__DEV__),
                      __PROD__: JSON.stringify(__PROD__),
                    },
              ),
            prod && terser(terserOptions),
          ].filter(identify),
        ),
      }
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
