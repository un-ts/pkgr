// tslint:disable ordered-imports
declare module '@rxts/rollup-plugin-alias' {
  import { Plugin } from 'rollup'

  namespace alias {}

  export interface AliasOptions {
    resolve?: string[]
    entries?: Array<{
      find: string | RegExp
      replacement: string
    }>
  }

  export interface Alias extends Plugin {
    (options: AliasOptions): Plugin
  }

  const alias: Alias

  export = alias
}

declare module 'jsox' {
  export = JSON
}

declare module 'rollup-plugin-babel' {
  // eslint-disable-next-line node/no-extraneous-import
  import { TransformOptions } from '@babel/core'
  import { Plugin, WatcherOptions } from 'rollup'

  export interface BabelOptions extends TransformOptions, WatcherOptions {
    target?: string
  }

  interface Babel extends Plugin {
    (options?: BabelOptions): Plugin
  }

  const babel: Babel

  export = babel
}

declare module 'rollup-plugin-typescript' {
  import { Plugin } from 'rollup'

  export interface TypeScriptOptions {
    target?: string
  }

  interface TypeScript extends Plugin {
    (options?: TypeScriptOptions): Plugin
  }

  const typescript: TypeScript

  export = typescript
}
