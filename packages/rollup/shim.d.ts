declare module 'jsox' {
  export const JSOX: typeof JSON
}

declare module 'unassert' {
  export interface UnassertOptions {
    modules?: string[]
  }

  export const defaultOptions: () => Required<UnassertOptions>
}

declare module 'rollup-plugin-unassert' {
  import { FilterPattern } from '@rollup/pluginutils'
  import { Plugin } from 'rollup'
  import { UnassertOptions as _UnassertOptions } from 'unassert'

  export interface UnassertOptions extends _UnassertOptions {
    sourcemap?: boolean
    include?: FilterPattern
    exclude?: FilterPattern
  }

  const unassert: (options?: UnassertOptions) => Plugin

  export default unassert
}
