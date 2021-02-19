#!/usr/bin/env node
import isGlob from 'is-glob'
import glob from 'tiny-glob'

import imagemin from '.'

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
  .catch((e: Error) => {
    console.error(e)
    process.exitCode = 1
  })
