import fs from 'fs'

import { Plugin } from 'imagemin'
import { extendDefaultPlugins } from 'svgo'

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
        plugins: extendDefaultPlugins([
          {
            name: 'removeViewBox',
            active: false,
          },
        ]),
      },
    ],
    ['webp'],
  ] as const
).map(async ([name, opts]) =>
  (
    (await import(`imagemin-${name}`)) as {
      default: (opts: unknown) => Plugin
    }
  ).default(opts),
)

export default async (filename: string) =>
  fs.promises.writeFile(
    filename,
    await plugins.reduce(
      async (acc, it) => (await it)(await acc),
      fs.promises.readFile(filename),
    ),
  )
