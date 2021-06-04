/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @link https://github.com/facebook/create-react-app/blob/master/packages/react-dev-utils/InlineChunkHtmlPlugin.js
 */

import { HtmlTagObject } from 'html-webpack-plugin'
import type { Compilation, Compiler } from 'webpack'

export class InlineChunkHtmlPlugin {
  constructor(
    public htmlWebpackPlugin: typeof import('html-webpack-plugin'),
    public tests: RegExp[],
  ) {}

  getInlinedTag(
    publicPath: string,
    assets: Compilation['assets'],
    tag: HtmlTagObject,
  ) {
    if (tag.tagName !== 'script' || !tag.attributes.src) {
      return tag
    }

    const src = tag.attributes.src as string

    const scriptName = publicPath ? src.replace(publicPath, '') : src
    if (!this.tests.some(test => test.test(scriptName))) {
      return tag
    }
    const asset = assets[scriptName]
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (asset == null) {
      return tag
    }
    return {
      tagName: 'script',
      innerHTML: asset.source() as string,
      closeTag: true,
      attributes: {},
      meta: {},
      voidTag: false,
    } as HtmlTagObject
  }

  apply(compiler: Compiler) {
    let publicPath = (compiler.options.output.publicPath as string) || ''
    if (publicPath && !publicPath.endsWith('/')) {
      publicPath += '/'
    }

    compiler.hooks.compilation.tap('InlineChunkHtmlPlugin', compilation => {
      const tagFunction = (tag: HtmlTagObject) =>
        this.getInlinedTag(publicPath, compilation.assets, tag)

      const hooks = this.htmlWebpackPlugin.getHooks(compilation)
      hooks.alterAssetTagGroups.tap('InlineChunkHtmlPlugin', assets => {
        assets.headTags = assets.headTags.map(tagFunction)
        assets.bodyTags = assets.bodyTags.map(tagFunction)
        return assets
      })

      // Still emit the runtime chunk for users who do not use our generated
      // index.html file.
      // hooks.afterEmit.tap('InlineChunkHtmlPlugin', () => {
      //   Object.keys(compilation.assets).forEach(assetName => {
      //     if (this.tests.some(test => assetName.match(test))) {
      //       delete compilation.assets[assetName];
      //     }
      //   });
      // });
    })
  }
}
