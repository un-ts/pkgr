export type ModuleDefinition =
  | string
  | {
      target: string
      exact?: boolean
    }

// eslint-disable-next-line @typescript-eslint/no-type-alias
export type ModuleDefinitions = Record<string, ModuleDefinition>

export const MODULE_DEFINITIONS: ModuleDefinitions = {
  dayjs: {
    target: 'dayjs/esm',
    exact: false,
  },
  lodash: 'lodash-es',
  systemjs: 'systemjs/dist/system',
}

const defEntries = Object.entries(MODULE_DEFINITIONS)

/**
 * `entries` option for `rollup-plugin-alias`
 */
export const entries = defEntries.reduce<
  Array<{
    find: string | RegExp
    replacement: string
  }>
>((acc, [module, definition]) => {
  const { target, exact } =
    typeof definition === 'string'
      ? { target: definition, exact: true }
      : definition

  acc.push({
    find: module,
    replacement: target,
  })

  if (!exact) {
    acc.push({
      find: new RegExp('^' + module + '/(.*)$'),
      replacement: target + '/$1',
    })
  }

  return acc
}, [])

/**
 * `alias` option for `resolve` property of `webpack` configuration
 */
export const alias = defEntries.reduce<Record<string, string>>(
  (acc, [module, definition]) => {
    const { target, exact } =
      typeof definition === 'string'
        ? { target: definition, exact: true }
        : definition
    acc[exact ? module + '$' : module] = target
    return acc
  },
  {},
)
