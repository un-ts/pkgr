# umd-globals

[![Travis](https://img.shields.io/travis/com/JounQin/umd-globals.svg)](https://travis-ci.com/JounQin/umd-globals)
[![Codacy Grade](https://img.shields.io/codacy/grade/c2b96f1585d940d39d58de8615bc700d)](https://www.codacy.com/app/JounQin/umd-globals)
[![Codecov](https://img.shields.io/codecov/c/gh/JounQin/umd-globals)](https://codecov.io/gh/JounQin/umd-globals)
[![type-coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2FJounQin%2Fumd-globals%2Fmaster%2Fpackage.json)](https://github.com/plantain-00/type-coverage)
[![npm](https://img.shields.io/npm/v/umd-globals.svg)](https://www.npmjs.com/package/umd-globals)
[![GitHub release](https://img.shields.io/github/release/JounQin/umd-globals)](https://github.com/JounQin/umd-globals/releases)

[![David Peer](https://img.shields.io/david/peer/JounQin/umd-globals.svg)](https://david-dm.org/JounQin/umd-globals?type=peer)
[![David](https://img.shields.io/david/JounQin/umd-globals.svg)](https://david-dm.org/JounQin/umd-globals)
[![David Dev](https://img.shields.io/david/dev/JounQin/umd-globals.svg)](https://david-dm.org/JounQin/umd-globals?type=dev)

[![Conventional Commits](https://img.shields.io/badge/conventional%20commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

> Union collections of umd globals mappings.

## TOC <!-- omit in toc -->

- [Install](#install)
- [Usage](#usage)
- [Changelog](#changelog)
- [License](#license)

## Install

```sh
# yarn
yarn add -D umd-globals

# npm
npm i -D umd-globals
```

## Usage

```js
// rollup.config.js
import { globals } from 'umd-globals'

export default {
  output: {
    globals,
  },
}
```

## Changelog

Detailed changes for each release are documented in [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT][] © [JounQin][]@[1stG.me][]

[1stg.me]: https://www.1stg.me
[jounqin]: https://GitHub.com/JounQin
[mit]: http://opensource.org/licenses/MIT
