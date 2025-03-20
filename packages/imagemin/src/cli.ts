#!/usr/bin/env node

import { isDynamicPattern, glob } from 'tinyglobby'

import imagemin from './index.js'

const files = await process.argv
  .slice(2)
  .reduce(
    (files, file) =>
      isDynamicPattern(file)
        ? Promise.all([
            files,
            glob(file, { ignore: '**/node_modules/**' }),
          ]).then(([files, matched]) => [...files, ...matched])
        : files.then(files => [...files, file]),
    Promise.resolve<string[]>([]),
  )

await Promise.all(files.map(imagemin))
