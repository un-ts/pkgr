# @pkgr/es-modules

[![npm](https://img.shields.io/npm/v/@pkgr/es-modules.svg)](https://www.npmjs.com/package/@pkgr/es-modules)
![npm bundle size](https://img.shields.io/bundlephobia/min/@pkgr/es-modules)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/@pkgr/es-modules)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)

> Union collections of es modules mappings for pkgs without or with incorrect `module` field.

## TOC <!-- omit in toc -->

- [Install](#install)
- [Usage](#usage)
- [Changelog](#changelog)
- [License](#license)

## Install

```sh
# yarn
yarn add -D @pkgr/es-modules

# npm
npm i -D @pkgr/es-modules
```

## Usage

```js
// rollup
import { entries } from '@pkgr/es-modules'
import alias from 'rollup-plugin-alias'

export default {
  plugins: [
    alias({
      entries,
    }),
  ],
}
```

```js
// webpack
import { alias } from '@pkgr/es-modules'

export default {
  resolve: {
    alias,
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
