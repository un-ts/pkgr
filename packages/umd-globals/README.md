# umd-globals

[![npm](https://img.shields.io/npm/v/pkgr/umd-globals.svg)](https://www.npmjs.com/package/@pkgr/umd-globals)
![npm bundle size](https://img.shields.io/bundlephobia/min/prettier-plugin-pkg)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/prettier-plugin-pkg)

[![David Peer](https://img.shields.io/david/peer/rx-ts/pkgr.svg)](https://david-dm.org/rx-ts/pkgr?type=peer)
[![David](https://img.shields.io/david/rx-ts/pkgr.svg)](https://david-dm.org/rx-ts/pkgr)
[![David Dev](https://img.shields.io/david/dev/rx-ts/pkgr.svg)](https://david-dm.org/rx-ts/pkgr?type=dev)

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
