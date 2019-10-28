/* eslint-disable import/no-duplicates */
declare module '*.css' {
  const styles: Record<string, string>
  export = styles
}

declare module '*.less' {
  const styles: Record<string, string>
  export = styles
}

declare module '*.scss' {
  const styles: Record<string, string>
  export = styles
}

declare module '*.svg' {
  import React from 'react'
  const Component: React.ComponentType
  export = Component
}

declare module 'html-webpack-harddisk-plugin' {
  // tslint:disable-next-line: ordered-imports
  import { Plugin } from 'webpack'
  class HtmlWebpackHarddiskPlugin extends Plugin {}
  export = HtmlWebpackHarddiskPlugin
}

declare module 'html-webpack-inline-source-plugin' {
  import { Plugin } from 'webpack'
  class HtmlWebpackInlineSourcePlugin extends Plugin {}
  export = HtmlWebpackInlineSourcePlugin
}

declare module 'lazy-compile-webpack-plugin' {
  import { Plugin } from 'webpack'

  namespace LazyCompileWebpackPlugin {
    interface Options {
      refreshAfterCompile?: boolean
    }
  }

  class LazyCompileWebpackPlugin extends Plugin {
    constructor(options?: LazyCompileWebpackPlugin.Options)
  }

  export = LazyCompileWebpackPlugin
}

declare module 'jsox' {
  export = JSON
}

declare module 'dayjs/locale/zh-cn'
declare module 'dayjs/locale/en'
