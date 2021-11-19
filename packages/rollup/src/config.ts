import fs from 'fs'
import path from 'path'

import { DEFAULT_EXTENSIONS } from '@babel/core'
import { entries } from '@pkgr/es-modules'
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
  monorepoPkgs,
  tryExtensions,
  tryFile,
  tryGlob,
  tryPkg,
  tryRequirePkg,
} from '@pkgr/utils'
import babel, { RollupBabelInputPluginOptions } from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import url from '@rollup/plugin-url'
import alias, { AliasOptions } from '@rxts/rollup-plugin-alias'
import builtinModules from 'builtin-modules'
import debug from 'debug'
import isGlob from 'is-glob'
import { flatMap } from 'lodash-es'
import {
  ModuleFormat,
  OutputOptions,
  Plugin,
  RollupOptions,
  RollupWarning,
  WarningHandler,
} from 'rollup'
import copy, { CopyOptions } from 'rollup-plugin-copy'
import esbuild, { Options as EsBuildOptions } from 'rollup-plugin-esbuild'
import postcss, { PostCSSPluginConf } from 'rollup-plugin-postcss'
import { Options as TerserOptions, terser } from 'rollup-plugin-terser'
import vueJsx, { Options as VueJsxOptions } from 'rollup-plugin-vue-jsx-compat'

type VuePluginOptions = import('rollup-plugin-vue').Options

const vue =
  tryRequirePkg<(opts?: Partial<VuePluginOptions>) => Plugin>(
    'rollup-plugin-vue',
  )

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
const ASSETS_EXTENSIONS = [...STYLE_EXTENSIONS, ...IMAGE_EXTENSIONS]

const resolve = ({
  deps,
  node,
  ts,
}: {
  deps: string[]
  node?: boolean
  ts?: boolean
}) =>
  nodeResolve({
    dedupe: node ? [] : deps,
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
    ...(ts && {
      extensions: EXTENSIONS,
    }),
  })

const cjs = (sourceMap: boolean) => commonjs({ sourceMap })

const DEFAULT_FORMATS = ['cjs', 'es2015', 'esm']

const regExpCacheMap = new Map<string, RegExp | string>()

const tryRegExp = (exp: RegExp | string) => {
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

export type Format = 'cjs' | 'es5' | 'es2015' | 'esm' | 'umd'

export type External =
  | string[]
  | string
  | ((id: string, collectedExternals?: string[]) => boolean)

export interface ConfigOptions {
  formats?: ModuleFormat[]
  monorepo?: string[] | boolean
  input?: string
  exclude?: string[]
  outputDir?: string
  exports?: OutputOptions['exports']
  external?: External
  externals?: External
  globals?: StringMap
  aliasEntries?: AliasOptions['entries'] | StringMap
  copies?: CopyOptions | CopyOptions['targets'] | StringMap
  sourceMap?: boolean
  babel?: RollupBabelInputPluginOptions
  esbuild?: EsBuildOptions
  transformer?: 'babel' | 'esbuild'
  postcss?: Readonly<PostCSSPluginConf>
  vue?: VuePluginOptions
  define?: Record<string, string> | boolean
  terser?: TerserOptions
  prod?: boolean
  watch?: boolean
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
  !!copies &&
  !Array.isArray(copies) &&
  Object.keys(copies).every(key =>
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
  externals = external ?? [],
  globals: umdGlobals,
  aliasEntries = [],
  copies = [],
  sourceMap = false,
  babel: babelOptions,
  esbuild: esbuildOptions = {},
  transformer = 'esbuild',
  postcss: postcssOptions = {},
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
    resolve: [...EXTENSIONS, ...ASSETS_EXTENSIONS],
    entries: [
      ...(Array.isArray(aliasEntries)
        ? aliasEntries.map(({ find, replacement }) => ({
            find: tryRegExp(find),
            replacement,
          }))
        : Object.entries(aliasEntries).map(([find, replacement]) => ({
            find: tryRegExp(find),
            replacement,
          }))),
      ...entries,
    ],
  }

  const copyOptions: CopyOptions = isCopyOptions(copies)
    ? copies
    : {
        targets: Array.isArray(copies)
          ? copies
          : Object.entries(copies).map(
              ([src, dest]: [string, string[] | string]) => ({
                src,
                dest,
              }),
            ),
      }

  const configs = flatMap(pkgs, pkg => {
    const srcPath = path.resolve(pkg, 'src')

    let pkgInput = input
    let pkgOutputDir = outputDir

    if (!fs.existsSync(srcPath) && pkgInput == null) {
      pkgInput = 'index'
    }

    pkgInput = tryExtensions(path.resolve(pkg, pkgInput ?? 'src/index'))

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
        : [
            ...arrayify(externals),
            ...Object.keys(peerDependencies),
            ...(node ? [...deps, ...builtinModules] : []),
          ]

    const pkgFormats =
      formats && formats.length > 0
        ? formats
        : [...DEFAULT_FORMATS, ...(node ? [] : ['umd'])]
    const pkgGlobals = collectedExternals.reduce((pkgGlobals, pkg) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (pkgGlobals[pkg] == null) {
        pkgGlobals[pkg] = upperCamelCase(normalizePkg(pkg))
      }
      return pkgGlobals
    }, globals)

    let defineValues: Record<string, string> | undefined

    if (define) {
      defineValues = Object.entries(define).reduce<Record<string, string>>(
        (acc, [key, value]: [string, string]) =>
          Object.assign(acc, {
            [key]: JSON.stringify(value),
          }),
        // __DEV__ and __PROD__ will always be replaced while `process.env.NODE_ENV` will be preserved except on production
        prod
          ? {
              __DEV__: JSON.stringify(false),
              __PROD__: JSON.stringify(true),
              'process.env.NODE_ENV': JSON.stringify(PROD),
            }
          : {
              __DEV__: JSON.stringify(__DEV__),
              __PROD__: JSON.stringify(__PROD__),
            },
      )
    }

    const isTsInput = /\.tsx?/.test(pkgInput)
    const useEsBuild = transformer === 'esbuild'
    const { jsxFactory, target } = esbuildOptions
    const esbuildVueJsx =
      useEsBuild && vue && (!jsxFactory || jsxFactory === 'vueJsxCompat')

    return pkgFormats.map(format => {
      const isEsVersion = /^es(\d+|m|next)$/.test(format) && format !== 'es5'
      return {
        input: pkgInput,
        output: {
          file: path.resolve(
            pkg,
            `${pkgOutputDir}${path.basename(
              pkgInput!,
              path.extname(pkgInput!),
            )}${format === 'cjs' ? '' : '.' + format}${prod ? '.min' : ''}.${
              isEsVersion ? 'mjs' : format === 'cjs' ? 'cjs' : 'js'
            }`,
          ),
          format: isEsVersion ? 'esm' : (format as ModuleFormat),
          name: pkgGlobals[name] || upperCamelCase(normalizePkg(name)),
          globals,
          exports,
          sourcemap: sourceMap,
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
              ? tryRequirePkg<typeof import('micromatch')>(
                  'micromatch',
                )!.isMatch(id, pkg)
              : id === pkg || id.startsWith(`${pkg}/`)
          })
        },
        onwarn,
        plugins: [
          alias(aliasOptions),
          esbuildVueJsx && (vueJsx as (options?: VueJsxOptions) => Plugin)(),
          useEsBuild
            ? esbuild({
                jsxFactory: esbuildVueJsx ? 'vueJsxCompat' : undefined,
                tsconfig:
                  tryFile(path.resolve(pkg, 'tsconfig.json')) ||
                  tryFile('tsconfig.base.json') ||
                  tryPkg('@1stg/tsconfig'),
                define: defineValues,
                minify: prod,
                loaders: {
                  '.json': 'json',
                  '.js': 'jsx',
                },
                ...esbuildOptions,
                /**
                 * es5 is not supported temporarily
                 * @see https://github.com/evanw/esbuild/issues/297
                 */
                target: isEsVersion
                  ? format === 'esm'
                    ? 'es6'
                    : format
                  : target ?? 'es6',
                sourceMap,
              })
            : babel({
                babelHelpers: 'runtime',
                exclude: babelOptions?.filter
                  ? undefined
                  : ['*.min.js', '*.prod.js', '*.production.js'],
                extensions: isTsInput
                  ? ['.ts', '.tsx', ...DEFAULT_EXTENSIONS]
                  : undefined,
                presets: [
                  [
                    '@babel/env',
                    {
                      bugfixes: true,
                      corejs: { version: '3.13', proposals: true },
                      shippedProposals: true,
                      useBuiltIns: 'usage',
                      targets: isEsVersion ? { esmodules: true } : undefined,
                    },
                  ],
                  isTsInput && [
                    '@babel/typescript',
                    { allowDeclareFields: true, allowNamespaces: true },
                  ],
                ].filter(identify),
                plugins: [['@babel/proposal-decorators', { legacy: true }]],
                ...babelOptions,
              }),
          resolve({
            deps,
            node: !!node,
            ts: isTsInput,
          }),
          cjs(sourceMap),
          copy(copyOptions),
          json(),
          url({ include: IMAGE_EXTENSIONS.map(ext => `**/*${ext}`) }),
          postcss(postcssOptions),
          vue?.(vueOptions),
          !useEsBuild &&
            replace({ preventAssignment: true, values: defineValues }),
          prod && !useEsBuild && terser(terserOptions),
        ].filter(identify),
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
  const configs = [
    ...config(options),
    ...(options.prod ? config({ ...options, prod: false }) : []),
  ]

  info('configs: %O', configs)

  return configs
}
