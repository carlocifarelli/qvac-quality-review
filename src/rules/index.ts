import type { ESLint, Linter } from 'eslint'
import abortSignalRace from './abort-signal-race.js'
import closeOnError from './close-on-error.js'
import exitCodeIgnoresSignal from './exit-code-ignores-signal.js'
import spawnWithoutErrorListener from './spawn-without-error-listener.js'
import staleErrorReject from './stale-error-reject.js'
import throwInPromiseListener from './throw-in-promise-listener.js'

/** ESLint plugin name; rule ids are `async-hygiene/<rule>`. */
export const RULE_PREFIX = 'async-hygiene'

/**
 * `async-hygiene`: deterministic rules for defect classes in Node code that
 * starts processes, listens to events and propagates cancellation. Each rule
 * began as a class of findings the agent review found and a human confirmed
 * (first in the QVAC case study); the agent discovers new classes, the rules
 * keep known ones from coming back.
 */
export const plugin: ESLint.Plugin = {
  meta: { name: RULE_PREFIX, version: '0.2.0' },
  rules: {
    'abort-signal-race': abortSignalRace,
    'close-on-error': closeOnError,
    'exit-code-ignores-signal': exitCodeIgnoresSignal,
    'spawn-without-error-listener': spawnWithoutErrorListener,
    'stale-error-reject': staleErrorReject,
    'throw-in-promise-listener': throwInPromiseListener,
  },
}

export const RULES = Object.fromEntries(Object.keys(plugin.rules!).map((r) => [`${RULE_PREFIX}/${r}`, 'warn'])) as Linter.RulesRecord

/**
 * Flat-config preset, for using the rules in your own ESLint setup without the rest of the tool:
 *   import hygiene from 'agentic-code-review/eslint-plugin'
 *   export default [hygiene.configs.recommended]
 */
plugin.configs = { recommended: { plugins: { [RULE_PREFIX]: plugin }, rules: RULES } }

export default plugin
