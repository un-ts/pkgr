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
  import { TransformOptions } from '@babel/core'
  import { Plugin, WatcherOptions } from 'rollup'

  namespace babel {
    interface BabelOptions extends TransformOptions, WatcherOptions {
      target?: string
    }

    interface Babel extends Plugin {
      (options?: BabelOptions): Plugin
    }
  }

  const babel: babel.Babel

  export = babel
}

declare module 'rollup-plugin-typescript' {
  import { Plugin, WatcherOptions } from 'rollup'
  import { CompilerOptions } from 'typescript'

  namespace typescript {
    interface TypeScriptOptions extends CompilerOptions {
      jsx?: string
      module?: string
      target?: string
    }

    interface TypeScript extends Plugin {
      (options?: TypeScriptOptions): Plugin
    }
  }

  const typescript: typescript.TypeScript

  export = typescript
}
