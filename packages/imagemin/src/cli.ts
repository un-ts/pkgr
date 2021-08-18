#!/usr/bin/env node
import isGlob from 'is-glob'
import glob from 'tiny-glob'

import imagemin from './index.js'

process.argv
  .slice(2)
  .reduce(
    (files, file) =>
      isGlob(file)
        ? Promise.all([
            files,
            glob(file, {
              filesOnly: true,
            }),
          ]).then(([files, matched]) => [...files, ...matched])
        : files.then(files => [...files, file]),
    Promise.resolve<string[]>([]),
  )
  .then(files => Promise.all(files.map(imagemin)))
  .catch((err: Error) => {
    console.error(err)
    process.exitCode = 1
  })
