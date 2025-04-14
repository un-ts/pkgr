# @pkgr/es-modules

[![npm](https://img.shields.io/npm/v/@pkgr/es-modules.svg)](https://www.npmjs.com/package/@pkgr/es-modules)
![npm bundle size](https://img.shields.io/bundlephobia/min/@pkgr/es-modules)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/@pkgr/es-modules)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)

> Union collections of es modules mappings for pkgs without or with incorrect `module` field.

## TOC <!-- omit in toc -->

- [Install](#install)
- [Usage](#usage)
- [Sponsors and Backers](#sponsors-and-backers)
  - [Sponsors](#sponsors)
  - [Backers](#backers)
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
// webpack/rspack
import { alias } from '@pkgr/es-modules'

export default {
  resolve: {
    alias,
  },
}
```

## Sponsors and Backers

[![Sponsors and Backers](https://raw.githubusercontent.com/1stG/static/master/sponsors.svg)](https://github.com/sponsors/JounQin)

### Sponsors

| 1stG                                                                                                                   | RxTS                                                                                                                   | UnTS                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [![1stG Open Collective sponsors](https://opencollective.com/1stG/organizations.svg)](https://opencollective.com/1stG) | [![RxTS Open Collective sponsors](https://opencollective.com/rxts/organizations.svg)](https://opencollective.com/rxts) | [![UnTS Open Collective sponsors](https://opencollective.com/unts/organizations.svg)](https://opencollective.com/unts) |

### Backers

| 1stG                                                                                                                | RxTS                                                                                                                | UnTS                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [![1stG Open Collective backers](https://opencollective.com/1stG/individuals.svg)](https://opencollective.com/1stG) | [![RxTS Open Collective backers](https://opencollective.com/rxts/individuals.svg)](https://opencollective.com/rxts) | [![UnTS Open Collective backers](https://opencollective.com/unts/individuals.svg)](https://opencollective.com/unts) |

## Changelog

Detailed changes for each release are documented in [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT][] © [JounQin][]@[1stG.me][]

[1stG.me]: https://www.1stG.me
[JounQin]: https://github.com/JounQin
[MIT]: http://opensource.org/licenses/MIT
