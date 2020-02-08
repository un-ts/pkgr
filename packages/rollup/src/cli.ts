#!/usr/bin/env node
import program from 'commander'
import debug from 'debug'
import JSOX from 'jsox'
import pick from 'lodash/pick'
import { InputOptions, OutputOptions, rollup, watch } from 'rollup'

import config, { ConfigOptions } from './config'

const info = debug('r:info')

const parseArrayArgs = (curr: string, prev?: string[]) => {
  const next = curr.split(',')
  return prev ? prev.concat(next) : next
}

program
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  .version(require('../package.json').version)
  .option('-i, --input <filename>', 'input entry file path')
  .option('--exclude <path>', 'exclude package(s) for monorepo', parseArrayArgs)
  .option('-o, --output-dir [output]', 'output destination directory')
  .option(
    '-f, --formats <format>',
    'Type of output (amd, cjs, esm, iife, umd, and es versions like es2015)',
    parseArrayArgs,
  )
  .option(
    '-m, --monorepo <false | glob | paths>',
    'whether try to resolve the project as a monorepo automatically, or custom the packages path',
    JSOX.parse,
  )
  .option(
    '-e, --exports <mode>',
    'Specify export mode (auto, default, named, none)',
  )
  .option(
    '-x, --external, --externals <package>',
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
    'entries setting for @rxts/rollup-plugin-alias, could be array or object',
    JSOX.parse,
  )
  .option(
    '-c, --copies <JSOX>',
    'targets setting or whole CopyOptions for rollup-plugin-copy, could be array or object',
    JSOX.parse,
  )
  .option(
    '-s, --source-map <boolean>',
    'whether or not to enable sourceMap generation for CommonJS modules, which may cause performance issue',
    false,
  )
  .option(
    '-w, --watch [boolean]',
    'whether to enable watch mode for development',
  )
  // FIXME: should be removed this option and PR to `rollup-plugin-typescript` instead
  .option(
    '-t, --typescript <JSOX>',
    'Overrides the TypeScript compiler options for `rollup-plugin-typescript`',
    JSOX.parse,
  )
  .option('--postcss <JSOX>', 'options for `rollup-plugin-postcss`', JSOX.parse)
  .option('--vue <JSOX>', 'options for `rollup-plugin-vue`', JSOX.parse)
  .option(
    '-d, --define [boolean | JSOX]',
    'options for `rollup-plugin-replace`, enable `__DEV__` and `__PROD__` by default',
    JSOX.parse,
    true,
  )
  .option('--terser <JSOX>', 'options for `rollup-plugin-terser`', JSOX.parse)
  .option(
    '-p, --prod [boolean]',
    'whether to enable production(.min.js) bundle together at the same time',
  )
  .parse(process.argv)

const options: ConfigOptions = pick(
  program,
  'input',
  'exclude',
  'outputDir',
  'formats',
  'monorepo',
  'exports',
  'external',
  'externals',
  'globals',
  'aliases',
  'sourceMap',
  'typescript',
  'postcss',
  'vue',
  'terser',
  'prod',
)

info('options: %O', options)

const startWatcher = (configs: InputOptions[]) => {
  const watcher = watch(configs)
  watcher.on('event', event => {
    switch (event.code) {
      case 'START':
        info('🚀 (re)starting...')
        break
      case 'END':
        info('🎉 bundled successfully.')
        break
      case 'ERROR':
        console.error(event)
        break
    }
  })
}

const configs = config(options)

if (program.watch) {
  startWatcher(configs)
} else {
  Promise.all(
    configs.map(opts =>
      rollup(opts).then(bundle => bundle.write(opts.output as OutputOptions)),
    ),
  ).catch(e => {
    console.error(e)
    process.exitCode = 1
  })
}
