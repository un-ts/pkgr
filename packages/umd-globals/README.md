# @pkgr/umd-globals

[![npm](https://img.shields.io/npm/v/@pkgr/umd-globals.svg)](https://www.npmjs.com/package/@pkgr/umd-globals)
![npm bundle size](https://img.shields.io/bundlephobia/min/@pkgr/umd-globals)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/@pkgr/umd-globals)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)

> Union collections of umd globals mappings.

## TOC <!-- omit in toc -->

- [Install](#install)
- [Usage](#usage)
- [Changelog](#changelog)
- [License](#license)

## Install

```sh
# yarn
yarn add -D @pkgr/umd-globals

# npm
npm i -D @pkgr/umd-globals
```

## Usage

```js
// rollup.config.js
import { globals } from '@pkgr/umd-globals'

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
