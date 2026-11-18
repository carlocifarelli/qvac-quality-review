import type { ESLint, Linter } from 'eslint'
import abortSignalRace from './abort-signal-race.js'
import closeOnError from './close-on-error.js'
import exitCodeIgnoresSignal from './exit-code-ignores-signal.js'
import spawnWithoutErrorListener from './spawn-without-error-listener.js'
import staleErrorReject from './stale-error-reject.js'
import throwInPromiseListener from './throw-in-promise-listener.js'

/**
 * `qvac-quality`: deterministic rules for the defect classes the agent review
 * found and a human confirmed. Each rule names the findings it generalises.
 * The agent discovers new classes; these rules keep known ones from coming back.
 */
export const plugin: ESLint.Plugin = {
  meta: { name: 'qvac-quality', version: '0.1.0' },
  rules: {
    'abort-signal-race': abortSignalRace,
    'close-on-error': closeOnError,
    'exit-code-ignores-signal': exitCodeIgnoresSignal,
    'spawn-without-error-listener': spawnWithoutErrorListener,
    'stale-error-reject': staleErrorReject,
    'throw-in-promise-listener': throwInPromiseListener,
  },
}

export const RULES = Object.fromEntries(Object.keys(plugin.rules!).map((r) => [`qvac-quality/${r}`, 'warn'])) as Linter.RulesRecord
