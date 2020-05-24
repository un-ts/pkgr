import { resolve, sep } from 'path'

import { alias } from '@pkgr/es-modules'
import {
  DEV,
  EXTENSIONS,
  NODE_ENV,
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
import HtmlWebpackInlineSourcePlugin from 'html-webpack-inline-source-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import LazyCompileWebpackPlugin from 'lazy-compile-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import { sync } from 'postcss-load-config'
import TsconfigPathsWebpackPlugin from 'tsconfig-paths-webpack-plugin'
import webpack, { Configuration } from 'webpack'
import { GenerateSW } from 'workbox-webpack-plugin'

const NGTOOLS_WEBPACK = '@ngtools/webpack'

const { AngularCompilerPlugin } = tryRequirePkg<{
  AngularCompilerPlugin: import('@ngtools/webpack').AngularCompilerPlugin
}>(NGTOOLS_WEBPACK) || { AngularCompilerPlugin: null }
const VueLoaderPlugin = tryRequirePkg<import('vue-loader').VueLoaderPlugin>(
  'vue-loader/lib/plugin',
)

const info = debug('w:info')

export interface ConfigOptions {
  entry?: string
  // tslint:disable-next-line max-union-size
  type?: 'angular' | 'react' | 'svelte' | 'vue'
  outputDir?: string
  copies?: Array<
    | string
    | {
        from: string
        to?: string
      }
  >
  preferCssModules?: boolean
  prod?: boolean
}

const baseTsconfigFile = tryFile([
  'tsconfig.app.json',
  'tsconfig.base.json',
  'tsconfig.json',
  tryPkg('@1stg/tsconfig')!,
])

const extraLoaderOptions: Record<string, {}> = {
  less: {
    javascriptEnabled: true,
  },
}

const configsPath = resolve(__dirname, '../.config')

const CACHE_LOADER = 'cache-loader'

export default ({
  entry = 'src',
  outputDir = 'dist',
  type,
  copies = [],
  preferCssModules,
  prod = __PROD__,
}: // eslint-disable-next-line sonarjs/cognitive-complexity
ConfigOptions = {}) => {
  entry = tryFile(
    ['index', 'main', 'app'].map(_ =>
      tryExtensions(resolve([entry, _].join('/'))),
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

  const hashType = prod ? 'contenthash' : 'hash'
  const filenamePrefix = `[name].[${hashType}].`

  const sourceMap = !prod

  const tsconfigFile =
    (prod && tryFile('tsconfig.prod.json')) || baseTsconfigFile

  const baseBabelLoader = {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
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
    },
  }

  const babelLoader = [CACHE_LOADER, 'thread-loader', baseBabelLoader]

  let postcssConfig:
    | {
        path: string
        ctx: {
          env: string
        }
      }
    | undefined

  const postcssCtx = {
    env: prod ? PROD : NODE_ENV,
  }

  try {
    postcssConfig = {
      path: resolve(sync(postcssCtx).file, '..') + sep,
      ctx: postcssCtx,
    }
  } catch {
    postcssConfig = {
      path: configsPath + sep,
      ctx: postcssCtx,
    }
  }

  const baseCssLoaders = (modules = false, extraLoader?: string) =>
    [
      prod && (!angular || modules)
        ? MiniCssExtractPlugin.loader
        : angular && !modules
        ? 'exports-loader?exports.toString()'
        : vue
        ? 'vue-style-loader'
        : 'style-loader',
      CACHE_LOADER,
      {
        loader: 'css-loader',
        options: {
          importLoaders: extraLoader ? 1 : 2,
          localsConvention: 'camelCaseOnly',
          modules: modules && {
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
          config: postcssConfig,
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
    tryExtensions(resolve(entry, '../index'), ['.pug', '.html', '.ejs']) ||
    resolve(__dirname, '../index.pug')

  const pkgFile = findUp(entry)

  const pkg = pkgFile ? tryRequirePkg<Record<string, string>>(pkgFile)! : {}

  const copyOptions = copies
    .concat(tryFile(resolve(entry, '../public'), true))
    .filter(identify)

  const config: Configuration = {
    mode: prod ? PROD : DEV,
    devtool: !prod && 'cheap-module-eval-source-map',
    devServer: {
      clientLogLevel: 'warning',
      host: '0.0.0.0',
      hot: true,
      disableHostCheck: true,
      historyApiFallback: true,
    },
    entry: {
      app: [!prod && react && 'react-hot-loader/patch', entry].filter(identify),
    },
    node: {
      fs: 'empty',
    },
    resolve: {
      alias: Object.assign(
        {},
        alias,
        prod ||
          (react && {
            'react-dom': '@hot-loader/react-dom',
          }),
      ),
      extensions: [
        '.ts',
        '.tsx',
        vue && '.vue',
        svelte && '.svelte',
        mdx && '.mdx',
      ]
        .concat(EXTENSIONS)
        .filter(identify),
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
      path: resolve(outputDir),
    },
    module: {
      rules: [
        {
          parser: {
            system: false,
          },
        },
        {
          test: /\.(m?j|t)sx?$/,
          oneOf: [
            angular && {
              test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
              use: [CACHE_LOADER, baseBabelLoader, NGTOOLS_WEBPACK],
            },
            {
              use: babelLoader,
            },
          ].filter(identify),
          exclude: (file: string) =>
            NODE_MODULES_REG.test(file) &&
            !/\.(mjs|jsx|tsx?|vue\.js)$/.test(file),
        },
        mdx && {
          test: /\.mdx?$/,
          use: babelLoader.concat('@mdx-js/loader'),
        },
        svelte && {
          test: /\.svelte$/,
          loader: 'svelte-loader',
        },
        vue && {
          test: /\.vue$/,
          loader: 'vue-loader',
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
      copyOptions.length && new CopyWebpackPlugin(copyOptions),
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
        minify: prod as false,
      }),
      new HtmlWebpackHarddiskPlugin(),
      // @ts-ignore
      prod && new HtmlWebpackInlineSourcePlugin(HtmlWebpackPlugin),
      __DEV__ &&
        !prod &&
        new LazyCompileWebpackPlugin({
          ignores: angular
            ? [
                /\b(html|raw|to-string)-loader\b/,
                /\bexports-loader[^?]*\?exports\.toString\(\)/,
              ]
            : undefined,
        }),
      new MiniCssExtractPlugin({
        filename: filenamePrefix + 'css',
      }),
      angular &&
        AngularCompilerPlugin &&
        // @ts-ignore
        new AngularCompilerPlugin({
          compilerOptions: {
            emitDecoratorMetadata: true,
            target: 8, // represents esnext
          },
          mainPath: entry,
          tsConfigPath:
            tryFile(resolve(entry, '../tsconfig.json')) || tsconfigFile,
          sourceMap: !prod,
        }),
      vue &&
        VueLoaderPlugin &&
        // @ts-ignore
        new VueLoaderPlugin(),
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
  }

  info('config: %O', config)

  return config
}
