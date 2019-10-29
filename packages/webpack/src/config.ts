import { AngularCompilerPlugin } from '@ngtools/webpack'
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
  isReactAvailable,
  isTsAvailable,
  isVueAvailable,
  tryExtensions,
  tryFile,
  tryPkg,
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
import { resolve, sep } from 'path'
import { sync } from 'postcss-load-config'
import TsconfigPathsWebpackPlugin from 'tsconfig-paths-webpack-plugin'
import { VueLoaderPlugin } from 'vue-loader'
import webpack, { Configuration } from 'webpack'
import { GenerateSW } from 'workbox-webpack-plugin'

const info = debug('w:info')

export interface ConfigOptions {
  entry?: string
  type?: 'angular' | 'react' | 'vue'
  outputDir?: string
  copies?: Array<
    | string
    | {
        from: string
        to?: string
      }
  >
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

export default ({
  entry = 'src',
  outputDir = 'dist',
  type,
  copies = [],
  prod = __PROD__,
}: ConfigOptions = {}) => {
  entry = tryFile(
    ['index', 'main', 'app'].map(_ =>
      tryExtensions(resolve([entry, _].join('/'))),
    ),
  )

  const angular = type === 'angular' || (!type && isAngularAvailable)
  const react = type === 'react' || (!type && isReactAvailable)
  const vue = type === 'vue' || (!type && isVueAvailable)

  const hashType = prod ? 'contenthash' : 'hash'
  const filenamePrefix = `[name].[${hashType}].`

  const sourceMap = !prod

  const tsconfigFile = tryFile('tsconfig.prod.json') || baseTsconfigFile

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
          },
        ],
      ],
    },
  }

  const babelLoader = ['cache-loader', 'thread-loader', baseBabelLoader]

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
      'cache-loader',
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
      test: /\b(globals?|node_modules)\b/,
      use: baseCssLoaders(false, extraLoader),
    },
    {
      test: /\.(m|modules?)\.[a-z]+$/,
      use: baseCssLoaders(true, extraLoader),
    },
    {
      use: baseCssLoaders(!angular, extraLoader),
    },
  ]

  const svgLoader = react ? '@svgr/webpack' : vue && 'vue-svg-loader'

  const template =
    tryExtensions(resolve(entry, '../index'), ['.pug', '.html', '.ejs']) ||
    resolve(__dirname, '../index.pug')

  const pkgFile = findUp(entry)

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pkg: Record<string, string> = pkgFile ? require(pkgFile) : {}

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
      extensions: ['.ts', '.tsx', vue && '.vue', '.mdx']
        .concat(EXTENSIONS)
        .filter(identify),
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
          test: /\.m?[jt]sx?$/,
          oneOf: [
            angular && {
              test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
              use: ['cache-loader', baseBabelLoader, '@ngtools/webpack'],
            },
            {
              use: babelLoader,
            },
          ].filter(identify),
          exclude: (file: string) =>
            NODE_MODULES_REG.test(file) &&
            !/\.(mjs|jsx|tsx?|vue\.js)$/.test(file),
        },
        {
          test: /\.mdx$/,
          use: babelLoader.concat('@mdx-js/loader'),
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
            minimize: prod,
            caseSensitive: true,
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
      angular &&
        new AngularCompilerPlugin({
          compilerOptions: {
            emitDecoratorMetadata: true,
            target: 8, // represents esnext
          },
          mainPath: entry,
          tsConfigPath: tsconfigFile,
          sourceMap: !prod,
        }),
      new CaseSensitivePathsWebpackPlugin(),
      new CopyWebpackPlugin(
        copies
          .concat(tryFile(resolve(entry, '../public'), true))
          .filter(identify),
      ),
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
        template,
        alwaysWriteToDisk: true,
        inlineSource: /(^|[\\/])manifest\.\w+\.js$/,
        minify: prod as false,
      }),
      new HtmlWebpackHarddiskPlugin(),
      prod && new HtmlWebpackInlineSourcePlugin(),
      __DEV__ && !prod && new LazyCompileWebpackPlugin(),
      new MiniCssExtractPlugin({
        filename: filenamePrefix + 'css',
      }),
      vue && new VueLoaderPlugin(),
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
