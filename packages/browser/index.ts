// based on https://github.com/facebook/create-react-app/blob/master/packages/react-dev-utils/openBrowser.js

import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import spawn from 'cross-spawn'
import picocolors from 'picocolors'

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
  const child = spawn(process.execPath, [scriptPath, ...extraArgs, url], {
    stdio: 'inherit',
  })
  child.on('close', code => {
    if (code !== 0) {
      console.log()
      console.log(
        picocolors.red(
          'The script specified as BROWSER environment variable failed.',
        ),
      )
      console.log(`${picocolors.cyan(scriptPath)} exited with code ${code!}`)
      console.log()
    }
  })
  return true
}

async function startBrowserProcess(
  browser: string[] | string | undefined,
  url: string,
  args: string[],
) {
  // If we're on OS X, the user hasn't specifically
  // requested a different browser, we can try opening
  // Chrome with AppleScript. This lets us reuse an
  // existing tab when possible instead of creating a new one.
  const shouldTryOpenChromiumWithAppleScript =
    process.platform === 'darwin' &&
    (typeof browser !== 'string' || browser === OSX_CHROME)

  if (shouldTryOpenChromiumWithAppleScript) {
    // Will use the first open browser found from list
    const supportedChromiumBrowsers = [
      'Google Chrome Canary',
      'Google Chrome',
      'Microsoft Edge',
      'Brave Browser',
      'Vivaldi',
      'Chromium',
    ]

    const _dirname =
      typeof __dirname === 'undefined'
        ? path.dirname(fileURLToPath(import.meta.url))
        : __dirname

    for (const chromiumBrowser of supportedChromiumBrowsers) {
      try {
        // Try our best to reuse existing tab
        // on OSX Chromium-based browser with AppleScript
        // eslint-disable-next-line sonarjs/os-command
        execSync('ps cax | grep "' + chromiumBrowser + '"')
        // eslint-disable-next-line sonarjs/os-command
        execSync(
          'osascript ../openChrome.applescript "' +
            encodeURI(url) +
            '" "' +
            chromiumBrowser +
            '"',
          {
            cwd: _dirname,
            stdio: 'ignore',
          },
        )
        return true
      } catch {
        // Ignore errors.
      }
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
  try {
    // eslint-disable-next-line unicorn/no-await-expression-member
    const open = (await import('open')).default
    open(url, {
      app: browser ? { name: browser, arguments: args } : undefined,
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
export async function openBrowser(url: string) {
  const { action, value, args } = getBrowserEnv()
  switch (action) {
    case Action.NONE: {
      // Special case: BROWSER="none" will prevent opening completely.
      return false
    }
    case Action.SCRIPT: {
      return executeNodeScript(value!, url)
    }
    case Action.BROWSER: {
      return startBrowserProcess(value, url, args)
    }
    default: {
      throw new Error('Not implemented.')
    }
  }
}
