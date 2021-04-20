// based on https://github.com/facebook/create-react-app/blob/master/packages/react-dev-utils/openBrowser.js

import { execSync } from 'child_process'

import chalk from 'chalk'
import spawn from 'cross-spawn'
import open from 'open'

// https://github.com/sindresorhus/open#app
const OSX_CHROME = 'google chrome'

enum Action {
  NONE,
  BROWSER,
  SCRIPT,
}

function getBrowserEnv() {
  // Attempt to honor this environment variable.
  // It is specific to the operating system.
  // See https://github.com/sindresorhus/open#app for documentation.
  const value = process.env.BROWSER
  const args = process.env.BROWSER_ARGS
    ? process.env.BROWSER_ARGS.split(' ')
    : []
  let action: Action
  if (!value) {
    // Default.
    action = Action.BROWSER
  } else if (value.toLowerCase().endsWith('.js')) {
    action = Action.SCRIPT
  } else if (value.toLowerCase() === 'none') {
    action = Action.NONE
  } else {
    action = Action.BROWSER
  }
  return { action, value, args }
}

function executeNodeScript(scriptPath: string, url: string) {
  const extraArgs = process.argv.slice(2)
  const child = spawn('node', [scriptPath, ...extraArgs, url], {
    stdio: 'inherit',
  })
  child.on('close', (code: number) => {
    if (code !== 0) {
      console.log()
      console.log(
        chalk.red(
          'The script specified as BROWSER environment variable failed.',
        ),
      )
      console.log(`${chalk.cyan(scriptPath)} exited with code ${code}.\n`)
    }
  })
  return true
}

function startBrowserProcess(
  browser: string | string[] | undefined,
  url: string,
  args: string[],
) {
  // If we're on OS X, the user hasn't specifically
  // requested a different browser, we can try opening
  // Chrome with AppleScript. This lets us reuse an
  // existing tab when possible instead of creating a new one.
  const shouldTryOpenChromeWithAppleScript =
    process.platform === 'darwin' &&
    (typeof browser !== 'string' || browser === OSX_CHROME)

  if (shouldTryOpenChromeWithAppleScript) {
    try {
      // Try our best to reuse existing tab
      // on OS X Google Chrome with AppleScript
      execSync('ps cax | grep "Google Chrome"')
      execSync('osascript ../openChrome.applescript "' + encodeURI(url) + '"', {
        cwd: __dirname,
        stdio: 'ignore',
      })
      return true
    } catch {
      // Ignore errors.
    }
  }

  // Another special case: on OS X, check if BROWSER has been set to "open".
  // In this case, instead of passing `open` to `opn` (which won't work),
  // just ignore it (thus ensuring the intended behavior, i.e. opening the system browser):
  // https://github.com/facebook/create-react-app/pull/1690#issuecomment-283518768
  if (process.platform === 'darwin' && browser === 'open') {
    browser = undefined
  }

  // Fallback to open
  // (It will always open new tab)
  // eslint-disable-next-line sonar/no-try-promise
  try {
    open(url, {
      app: browser
        ? {
            name: browser,
            arguments: args,
          }
        : undefined,
      wait: false,
    }).catch(() => {}) // eslint-disable-line @typescript-eslint/no-empty-function -- Prevent `unhandledRejection` error.
    return true
  } catch {
    return false
  }
}

/**
 * Reads the BROWSER environment variable and decides what to do with it. Returns
 * true if it opened a browser or ran a node.js script, otherwise false.
 */
export function openBrowser(url: string) {
  const { action, value, args } = getBrowserEnv()
  switch (action) {
    case Action.NONE:
      // Special case: BROWSER="none" will prevent opening completely.
      return false
    case Action.SCRIPT:
      return executeNodeScript(value!, url)
    case Action.BROWSER:
      return startBrowserProcess(value, url, args)
    default:
      throw new Error('Not implemented.')
  }
}
