import fs from 'fs'
import { promisify } from 'util'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const plugins: Array<import('imagemin').Plugin> = [
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
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
].map(([name, opts]) => require(`imagemin-${name}`)(opts))

export default (filename: string): (() => Promise<void>) =>
  // @ts-ignore
  [...plugins, (it: Buffer) => writeFile(filename, it)].reduce(
    // @ts-ignore
    (acc: Promise<void>, it: () => Promise<void>) => acc.then(it),
    readFile(filename),
  )
