#!/usr/bin/env node
import { __DEV__, openBrowser } from '@pkgr/utils'
import program from 'commander'
import debug from 'debug'
import JSOX from 'jsox'
import pick from 'lodash/pick'
import webpack, { Compiler, Stats } from 'webpack'
import WebpackDevServer from 'webpack-dev-server'

import config, { ConfigOptions } from './config'

const info = debug('w:info')

const parseArrayArgs = (curr: string, prev?: string[]) => {
  const next = curr.split(',')
  return prev ? prev.concat(next) : next
}

program
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  .version(require('../package.json').version)
  .option('-e, --entry <filename>', 'input entry file path')
  .option(
    '-t, --type <enum>',
    'app type, could be angular, react, vue currently',
  )
  .option('--exclude <path>', 'exclude package(s) for monorepo', parseArrayArgs)
  .option('-o, --output-dir [output]', 'output destination directory')
  .option(
    '-f, --formats <format>',
    'Type of output (amd, cjs, esm, iife, umd, and es versions like es2015)',
    parseArrayArgs,
  )
  .option(
    '-m, --monorepo <false | path>',
    'whether consider the project as a monorepo, or custom the packages path',
  )
  .option(
    '-x, --externals <package>',
    'extra external packages, peerDependencies, and dependencies for node by default',
    parseArrayArgs,
  )
  .option(
    '-g, --globals <JSOX>',
    'JSON string to be parsed as umd globals map',
    JSOX.parse,
  )
  .option(
    '-a, --aliases <JSOX>',
    'entries setting for rollup-plugin-alias, could be array or object',
    JSOX.parse,
  )
  .option(
    '-c, --copies <JSOX>',
    'targets setting or whole CopyOptions for copy-webpack-plugin, could be array or object',
    JSOX.parse,
  )
  .option(
    '-p, --prod [boolean]',
    'whether to enable production(.min.js for lib) bundle together at the same time',
  )
  .parse(process.argv)

const options: ConfigOptions = pick(
  program,
  'entry',
  'type',
  'exclude',
  'outputDir',
  'formats',
  'monorepo',
  'externals',
  'globals',
  'aliases',
  'sourceMap',
  'prod',
)

info('options: %O', options)

const DEFAULT_PROT = 8080
const port = Number(process.env.PORT) || DEFAULT_PROT

const startWatcher = (compiler: Compiler) => {
  const devServer = new WebpackDevServer(compiler, compiler.options.devServer)
  devServer.listen(port)
  let isFirstCompile = true
  compiler.hooks.done.tap('@pkgr/webpack watcher', () => {
    if (!isFirstCompile) {
      return
    }
    isFirstCompile = false
    openBrowser(`http://localhost:${port}`)
  })
}

const webpackConfig = config(options)

const compiler = webpack(webpackConfig)

const handlerError = (error: Error | Stats.ToJsonOutput) => {
  console.error(error)
  process.exitCode = 1
}

if (__DEV__ && !program.prod) {
  startWatcher(compiler)
} else {
  compiler.run((error, stats) => {
    if (error) {
      return handlerError(error)
    }

    if (stats.hasErrors()) {
      return handlerError(stats.toJson())
    }
  })
}
