#!/usr/bin/env node
/// <reference path="../shim.d.ts" />

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { tryRequirePkg } from '@pkgr/utils'
import { program } from 'commander'
import debug from 'debug'
import { JSOX } from 'jsox'
import { type InputOptions, type OutputOptions, rollup, watch } from 'rollup'

import getConfigs, { type ConfigOptions } from './config.js'

const info = debug('r:info')

const _dirname =
  typeof __dirname === 'undefined'
    ? path.dirname(fileURLToPath(import.meta.url))
    : __dirname

const parseArrayArgs = (curr: string, prev?: string[]) => {
  const next = curr.split(',')
  return prev ? [...prev, ...next] : next
}

const jsoxParse = <T>(text: string) => JSOX.parse(text) as T

const main = async () => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const options = program.opts() as ConfigOptions

  info('options: %O', options)

  const startWatcher = (configs: InputOptions[]) => {
    const watcher = watch(configs)
    watcher.on('event', event => {
      switch (event.code) {
        case 'START': {
          info('🚀 (re)starting...')
          break
        }
        case 'END': {
          info('🎉 bundled successfully.')
          break
        }
        case 'ERROR': {
          console.error(event)
          break
        }
      }
    })
  }

  const configs = await getConfigs(options)

  if (options.watch) {
    startWatcher(configs)
  } else {
    await Promise.allSettled(
      configs.map(async opts => {
        const bundle = await rollup(opts)
        return bundle.write(opts.output as OutputOptions)
      }),
    )
  }
}

program
  .version(
    tryRequirePkg<{ version: string }>(
      path.resolve(_dirname, '../package.json'),
    )!.version,
  )
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
    jsoxParse,
  )
  .option(
    '-e, --exports <mode>',
    'Specify export mode (auto, default, named, none)',
    'auto',
  )
  .option(
    '-x, --external <package>',
    'extra external packages, peerDependencies, and dependencies for node by default',
    parseArrayArgs,
  )
  .option(
    '-g, --globals <JSOX>',
    'JSON string to be parsed as umd globals map',
    jsoxParse,
  )
  .option(
    '-a, --alias-entries <JSOX>',
    'entries setting for @rxts/rollup-plugin-alias, could be array or object',
    jsoxParse,
  )
  .option(
    '-c, --copies <JSOX>',
    'targets setting or whole CopyOptions for rollup-plugin-copy, could be array or object',
    jsoxParse,
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
  .option(
    '--esbuild <JSOX>',
    'Overrides the esbuild options for `rollup-plugin-esbuild`',
    jsoxParse,
  )
  .option(
    '--vue [boolean | JSOX]',
    'options for `@vitejs/plugin-vue`, you need to install it manually',
    jsoxParse,
  )
  .option(
    '--vue-jsx [boolean | JSOX]',
    'options for `@vitejs/plugin-vue-jsx`, you need to install it manually',
    jsoxParse,
  )
  .option(
    '-d, --define [boolean | JSOX]',
    'options for `@rollup/plugin-replace`, enable `__DEV__` and `__PROD__` by default',
    jsoxParse,
    true,
  )
  .action(main)
  .option(
    '-p, --prod [boolean]',
    'whether to enable production(.min.js) bundle together at the same time',
  )
  .parse(process.argv)
