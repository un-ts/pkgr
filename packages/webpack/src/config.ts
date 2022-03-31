/* eslint-disable unicorn/no-await-expression-member */
import path from 'path'
import { fileURLToPath } from 'url'

import { alias } from '@pkgr/es-modules'
import {
  DEV,
  EXTENSIONS,
  NODE_MODULES_REG,
  PROD,
  __DEV__,
  __PROD__,
  findUp,
  identify,
  isAngularAvailable,
  isPkgAvailable,
  isReactAvailable,
  isSvelteAvailable,
  isTsAvailable,
  isVueAvailable,
  tryExtensions,
  tryFile,
  tryPkg,
  tryRequirePkg,
} from '@pkgr/utils'
import CaseSensitivePathsWebpackPlugin from 'case-sensitive-paths-webpack-plugin'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import debug from 'debug'
import FriendlyErrorsWebpackPlugin from 'friendly-errors-webpack-plugin'
import HtmlWebpackHarddiskPlugin from 'html-webpack-harddisk-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import TsconfigPathsWebpackPlugin from 'tsconfig-paths-webpack-plugin'
import webpack, { Configuration } from 'webpack'
import { GenerateSW } from 'workbox-webpack-plugin'

import { InlineChunkHtmlPlugin } from './inline-chunk-html-plugin.js'

const NGTOOLS_WEBPACK = '@ngtools/webpack'

const info = debug('w:info')

export interface ConfigOptions {
  entry?: string
  type?: 'angular' | 'react' | 'svelte' | 'vue'
  outputDir?: string
  externals?: Configuration['externals']
  copies?: Array<
    | string
    | {
        from: string
        to?: string
      }
  >
  preferCssModules?: boolean
  publicPath?: string
  prod?: boolean
}

const baseTsconfigFile = tryFile([
  'tsconfig.app.json',
  'tsconfig.base.json',
  'tsconfig.json',
  tryPkg('@1stg/tsconfig')!,
])

const extraLoaderOptions: Record<string, object> = {
  less: {
    javascriptEnabled: true,
  },
}

const _dirname =
  typeof __dirname === 'undefined'
    ? path.dirname(fileURLToPath(import.meta.url))
    : __dirname

const configsPath = path.resolve(_dirname, '../.config')

const DEFAULT_PROT = 8080

export const port = Number(process.env.PORT) || DEFAULT_PROT

export default async ({
  entry = 'src',
  outputDir = 'dist',
  externals,
  type,
  copies = [],
  preferCssModules,
  publicPath,
  prod = __PROD__,
}: // eslint-disable-next-line sonarjs/cognitive-complexity
ConfigOptions = {}) => {
  entry = tryFile(
    ['', 'index', 'main', 'app'].map(_ =>
      tryExtensions(path.resolve(entry, _)),
    ),
  )

  const angular =
    type === 'angular' ||
    (!type && isAngularAvailable && isPkgAvailable('@pkgr/webpack-angular'))
  const react =
    type === 'react' ||
    (!type && isReactAvailable && isPkgAvailable('@pkgr/webpack-react'))
  const svelte =
    type === 'svelte' ||
    (!type && isSvelteAvailable && isPkgAvailable('@pkgr/webpack-svelte'))
  const vue =
    type === 'vue' ||
    (!type && isVueAvailable && isPkgAvailable('@pkgr/webpack-vue'))

  const mdx = isPkgAvailable('@pkgr/webpack-mdx')

  const filenamePrefix = `[name].[contenthash].`

  const sourceMap = !prod

  const tsconfigFile =
    (prod && tryFile('tsconfig.prod.json')) || baseTsconfigFile

  const babelLoader = {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      rootMode: 'upward-optional',
      presets: [
        [
          '@1stg',
          {
            typescript: true,
            metadata: angular,
            react,
            vue,
            isTSX: mdx,
          },
        ],
      ],
      plugins: [
        angular && (await import('@angular/compiler-cli/linker/babel')).default,
      ].filter(identify),
      targets: {
        esmodules: true,
      },
    },
  }

  let postcssConfig: string | undefined

  try {
    postcssConfig = (
      await tryRequirePkg<typeof import('postcss-load-config')>(
        'postcss-load-config',
      )!()
    ).file
  } catch {
    postcssConfig = path.resolve(configsPath, '.postcssrc.cjs')
  }

  const baseCssLoaders = (modules = false, extraLoader?: string) =>
    [
      prod && (!angular || modules)
        ? MiniCssExtractPlugin.loader
        : angular && !modules
        ? 'raw-loader'
        : vue
        ? 'vue-style-loader'
        : 'style-loader',
      {
        loader: 'css-loader',
        options: {
          importLoaders: extraLoader ? 1 : 2,
          modules: modules && {
            exportLocalsConvention: 'camelCaseOnly',
            localIdentName: prod
              ? '[hash:base64:10]'
              : '[path][name]__[local]---[hash:base64:5]',
          },
          sourceMap,
        },
      },
      {
        loader: 'postcss-loader',
        options: {
          sourceMap,
          postcssOptions: {
            config: postcssConfig,
          },
        },
      },
      extraLoader && {
        loader: extraLoader + '-loader',
        options: {
          ...extraLoaderOptions[extraLoader],
          sourceMap,
        },
      },
    ].filter(identify)

  const cssLoaders = (extraLoader?: string) => [
    {
      test: /(\.(component|g)\.[\w-]+$)|\b(globals?|node_modules)\b/,
      use: baseCssLoaders(false, extraLoader),
    },
    {
      test: /\.(m|modules?)\.[\w-]+$/,
      use: baseCssLoaders(true, extraLoader),
    },
    {
      use: baseCssLoaders(preferCssModules, extraLoader),
    },
  ]

  const svgLoader = react ? '@svgr/webpack' : vue && 'vue-svg-loader'

  const template =
    tryExtensions(path.resolve(entry, '../index'), ['.pug', '.html', '.ejs']) ||
    path.resolve(_dirname, '../index.pug')

  const pkgFile = findUp(entry)

  const pkg = pkgFile ? tryRequirePkg<Record<string, string>>(pkgFile)! : {}

  const copyPatterns = [
    ...copies,
    tryFile(path.resolve(entry, '../public'), true),
  ].filter(identify)

  const config: Configuration = {
    mode: prod ? PROD : DEV,
    devtool: !prod && 'eval-cheap-module-source-map',
    devServer: {
      client: {
        logging: 'warn',
      },
      host: '0.0.0.0',
      hot: true,
      port,
      allowedHosts: 'all',
      historyApiFallback: true,
    },
    entry: {
      app: entry,
    },
    externals,
    resolve: {
      alias,
      extensions: [
        '.ts',
        '.tsx',
        vue && '.vue',
        svelte && '.svelte',
        mdx && '.mdx',
        ...EXTENSIONS,
      ].filter(identify),
      mainFields: [
        svelte && 'svelte',
        'browser',
        'module',
        'esnext',
        'es2015',
        'fesm',
        'fesm5',
        'main',
      ].filter(identify),
      plugins: [
        isTsAvailable &&
          new TsconfigPathsWebpackPlugin({
            configFile: tsconfigFile,
          }),
      ].filter(identify),
    },
    output: {
      filename: filenamePrefix + 'js',
      path: path.resolve(outputDir),
      publicPath,
    },
    module: {
      rules: [
        vue && {
          test: /\.vue$/,
          loader: 'vue-loader',
        },
        {
          parser: {
            system: false,
          },
        },
        {
          test: /\.([cm]?j|t)sx?$/,
          use: [babelLoader, angular && NGTOOLS_WEBPACK].filter(identify),
          exclude: (file: string) =>
            NODE_MODULES_REG.test(file) &&
            !/\.(mjs|jsx|tsx?|vue\.js)$/.test(file),
        },
        mdx && {
          test: /\.mdx?$/,
          use: [
            babelLoader,
            {
              loader: '@mdx-js/loader',
              options: {
                remarkPlugins: [(await import('remark-gfm')).default],
              },
            },
          ],
        },
        svelte && {
          test: /\.svelte$/,
          loader: 'svelte-loader',
        },
        {
          test: /\.css$/,
          oneOf: cssLoaders(),
        },
        {
          test: /\.less$/,
          oneOf: cssLoaders('less'),
        },
        {
          test: /\.s[ac]ss$/,
          oneOf: cssLoaders('sass'),
        },
        {
          test: /\.styl(us)?$/,
          oneOf: cssLoaders('stylus'),
        },
        {
          test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
          oneOf: [
            svgLoader && {
              issuer: /\.m?[jt]sx?$/,
              loader: svgLoader,
            },
            {
              loader: 'url-loader',
            },
          ].filter(identify),
        },
        {
          test: /\.(eot|gif|jpe?g|png|ttf|woff2?)(\?v=\d+\.\d+\.\d+)?$/,
          loader: 'url-loader',
        },
        {
          test: /\.html$/,
          loader: 'html-loader',
          options: {
            minimize: prod && {
              caseSensitive: true,
              collapseWhitespace: true,
              conservativeCollapse: true,
              keepClosingSlash: true,
              minifyCSS: true,
              minifyJS: true,
              removeAttributeQuotes: !angular,
              removeComments: true,
              removeScriptTypeAttributes: true,
              removeStyleLinkTypeAttributes: true,
              useShortDoctype: true,
            },
            esModule: true,
          },
        },
        {
          test: /\.pug$/,
          oneOf: [
            {
              include: template,
              loader: 'pug-loader',
            },
            {
              resourceQuery: /^\?vue/,
              loader: 'pug-plain-loader',
            },
            {
              use: ['raw-loader', 'pug-plain-loader'],
            },
          ],
        },
      ].filter(identify),
    },
    plugins: [
      new webpack.DefinePlugin({
        __DEV__: !prod && __DEV__,
        __PROD__: prod,
      }),
      new CaseSensitivePathsWebpackPlugin(),
      copyPatterns.length > 0 &&
        new CopyWebpackPlugin({
          patterns: copyPatterns,
        }),
      new FriendlyErrorsWebpackPlugin(),
      prod &&
        new GenerateSW({
          cacheId: pkg.name + (type ? '-' + type : ''),
          clientsClaim: true,
          skipWaiting: true,
          exclude: [/\.map$/, /index.html$/],
          runtimeCaching: [
            {
              urlPattern: /\/api\//,
              handler: 'NetworkFirst',
            },
          ],
        }),
      new HtmlWebpackPlugin({
        title: [pkg.name, pkg.description].filter(identify).join(' - '),
        type,
        template,
        alwaysWriteToDisk: true,
        inlineSource: /(^|[/\\])manifest\.\w+\.js$/,
        minify: prod,
      }),
      new HtmlWebpackHarddiskPlugin(),
      prod &&
        new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/^manifest.+\.js$/]),
      new MiniCssExtractPlugin({
        filename: filenamePrefix + 'css',
      }),
      angular &&
        new (await import('@ngtools/webpack')).AngularWebpackPlugin({
          tsconfig:
            tryFile(path.resolve(entry, '../tsconfig.json')) || tsconfigFile,
          compilerOptions: {
            emitDecoratorMetadata: true,
            target: 99, // represents esnext
          },
        }),
      vue && new (await import('vue-loader')).VueLoaderPlugin(),
    ].filter(identify),
    optimization: {
      runtimeChunk: {
        name: 'manifest',
      },
      splitChunks: {
        cacheGroups: {
          vendors: {
            chunks: 'initial',
            name: 'vendors',
            test: NODE_MODULES_REG,
          },
        },
      },
    },
    ignoreWarnings: [
      {
        message: /^Zone\.js does not support native async\/await/,
      },
    ],
  }

  info('config: %O', config)

  return config
}
