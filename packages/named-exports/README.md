# @pkgr/named-exports

[![npm](https://img.shields.io/npm/v/@pkgr/named-exports.svg)](https://www.npmjs.com/package/@pkgr/named-exports)
![npm bundle size](https://img.shields.io/bundlephobia/min/@pkgr/named-exports)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/@pkgr/named-exports)

[![David Peer](https://img.shields.io/david/peer/rx-ts/pkgr.svg?path=packages/named-exports)](https://david-dm.org/rx-ts/pkgr?path=packages/named-exports&type=peer)
[![David](https://img.shields.io/david/rx-ts/pkgr.svg?path=packages/named-exports)](https://david-dm.org/rx-ts/pkgr?path=packages/named-exports)
[![David Dev](https://img.shields.io/david/dev/rx-ts/pkgr.svg?path=packages/named-exports)](https://david-dm.org/rx-ts/pkgr?path=packages/named-exports&type=dev)

> Union `namedExports` definitions for [rollup-plugin-commonjs][].

## TOC <!-- omit in toc -->

- [Install](#install)
- [Usage](#usage)
- [Changelog](#changelog)
- [License](#license)

## Install

```sh
# yarn
yarn add -D @pkgr/named-exports

# npm
npm i -D @pkgr/named-exports
```

## Usage

```js
// rollup.config.js
import commonjs from 'rollup-plugin-commonjs'
import { namedExports } from '@pkgr/named-exports'

export default {
  plugins: [
    commonjs({
      namedExports,
    }),
  ],
}
```

## Changelog

Detailed changes for each release are documented in [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT][] © [JounQin][]@[1stG.me][]

[1stg.me]: https://www.1stg.me
[jounqin]: https://GitHub.com/JounQin
[mit]: http://opensource.org/licenses/MIT
[rollup-plugin-commonjs]: https://github.com/rollup/rollup-plugin-commonjs#custom-named-exports
