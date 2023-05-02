#!/usr/bin/env node

import glob from 'fast-glob'
import isGlob from 'is-glob'

import imagemin from './index.js'

process.argv
  .slice(2)
  .reduce(
    (files, file) =>
      isGlob(file)
        ? Promise.all([files, glob(file)]).then(([files, matched]) => [
            ...files,
            ...matched,
          ])
        : files.then(files => [...files, file]),
    Promise.resolve<string[]>([]),
  )
  .then(files => Promise.all(files.map(imagemin)))
  .catch((err: Error) => {
    console.error(err)
    process.exitCode = 1
  })
