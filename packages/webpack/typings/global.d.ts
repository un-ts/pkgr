import HtmlWebpackPlugin from 'html-webpack-plugin'

declare global {
  const __DEV__: boolean
  const __PROD__: boolean
}

declare module 'html-webpack-plugin' {
  namespace HtmlWebpackPlugin {
    interface Options {
      alwaysWriteToDisk?: boolean
      inlineSource?: string | RegExp
    }
  }

  export = HtmlWebpackPlugin
}
