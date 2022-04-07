export type ModuleDefinition =
  | string
  | {
      target: string
      exact?: boolean
    }

export type ModuleDefinitions = Record<string, ModuleDefinition>

export const MODULE_DEFINITIONS: ModuleDefinitions = {
  dayjs: {
    target: 'dayjs/esm',
    exact: false,
  },
  lodash: {
    target: 'lodash-es',
    exact: false,
  },
}

const defEntries = Object.entries(MODULE_DEFINITIONS)

/**
 * `entries` option for `rollup-plugin-alias`
 */
export const entries = defEntries.reduce<
  Array<{
    find: RegExp | string
    replacement: string
  }>
>((acc, [module, definition]) => {
  /* istanbul ignore next */
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
    /* istanbul ignore next */
    const { target, exact } =
      typeof definition === 'string'
        ? { target: definition, exact: true }
        : definition
    acc[/* istanbul ignore next */ exact ? module + '$' : module] = target
    return acc
  },
  {},
)
