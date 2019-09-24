import fs from 'fs'
import path from 'path'

// eslint-disable-next-line node/no-extraneous-import
import prettier from 'prettier'

const PKGS = ['prettier', 'react', 'react-dom']

const namedExports = PKGS.reduce(
  (acc, pkg) =>
    Object.assign(acc, {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      [pkg]: Object.keys(require(pkg)).filter(key => !/^[_$]/.test(key)),
    }),
  {},
)

fs.writeFileSync(
  path.resolve(__dirname, 'index.ts'),
  prettier.format(`
export const namedExports = ${JSON.stringify(namedExports)}

export { namedExports as default }
`),
)
