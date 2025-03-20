import fs from 'node:fs/promises'

import type { Plugin } from 'imagemin'

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
            name: 'preset-default',
            params: {
              overrides: {
                removeViewBox: false,
              },
            },
          },
        ],
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

const imagemin = async (filename: string) =>
  fs.writeFile(
    filename,
    await plugins.reduce<Promise<Uint8Array>>(
      async (acc, it) => (await it)(await acc),
      fs.readFile(filename),
    ),
  )

export default imagemin
