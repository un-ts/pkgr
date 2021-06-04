import fs from 'fs'

const plugins = (
  [
    [
      'gifsicle',
      {
        interlaced: true,
      },
    ],
    [
      'jpegtran',
      {
        progressive: true,
      },
    ],
    ['mozjpeg'],
    [
      'optipng',
      {
        optimizationLevel: 5,
      },
    ],
    [
      'pngquant',
      {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        quality: [0.6, 0.8],
      },
    ],
    ['upng'],
    [
      'svgo',
      {
        plugins: [
          {
            removeViewBox: false,
          },
        ],
      },
    ],
    [
      'webp',
      {
        plugins: [
          {
            removeViewBox: false,
          },
        ],
      },
    ],
  ] as const
).map(
  ([name, opts]) =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-var-requires
    require(`imagemin-${name}`)(opts) as import('imagemin').Plugin,
)

export default (filename: string) =>
  plugins
    .reduce((acc, it) => acc.then(it), fs.promises.readFile(filename))
    .then(it => fs.promises.writeFile(filename, it))
