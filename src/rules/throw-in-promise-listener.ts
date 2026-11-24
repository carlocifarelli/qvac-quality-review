import { type N, calleeName, collect, isFunction, promiseExecutor, rule, within } from './util.js'

/**
 * Class of finding #6 (archive.ts:170).
 *
 * Inside `new Promise(...)`, an event listener runs later, outside the
 * executor. A synchronous throw there (an fs *Sync call, JSON.parse, a
 * `throw`) does not reject the promise: it is an uncaught exception and the
 * promise stays pending forever.
 *
 * Reports such calls/throws in a listener registered inside a Promise
 * executor when they are not inside a try block in that listener.
 */
const LISTEN = new Set(['on', 'once', 'addListener', 'prependListener', 'addEventListener'])

export default rule(
  'Synchronous throw inside an event listener in a Promise executor escapes the promise',
  { escape: '`{{what}}` can throw inside a listener registered in a Promise executor; the error escapes as an uncaught exception and the promise never settles. Wrap it in try/catch and reject.' },
  (context) => {
    const source = context.sourceCode
    return {
      NewExpression(node: N) {
        const ex = promiseExecutor(node)
        if (!ex) return
        const listeners = collect(source, ex.body, (n) => n.type === 'CallExpression' && LISTEN.has(calleeName(n) ?? '') && isFunction(n.arguments[1])).map((c) => c.arguments[1])
        for (const fn of listeners) {
          const risky = collect(source, fn.body, (n) => (n.type === 'CallExpression' && throwsSync(n)) || n.type === 'ThrowStatement', false)
          for (const r of risky) {
            if (insideTry(r, fn) || exhaustivenessGuard(r)) continue
            const what = r.type === 'ThrowStatement' ? 'throw' : source.getText(r.callee)
            context.report({ node: r, messageId: 'escape', data: { what } })
          }
        }
      },
    }
  },
)

/** Sync fs calls that report through their return value instead of throwing. */
const NEVER_THROWS = new Set(['existsSync'])

function throwsSync(call: N): boolean {
  const name = calleeName(call) ?? ''
  if (NEVER_THROWS.has(name)) return false
  if (/Sync$/.test(name)) return true
  return call.callee.type === 'MemberExpression' && call.callee.object.type === 'Identifier' && call.callee.object.name === 'JSON' && name === 'parse'
}

/**
 * `const x: never = value; throw …` in the same block: a TypeScript
 * exhaustiveness check, unreachable while the types hold (nx case study).
 */
function exhaustivenessGuard(node: N): boolean {
  if (node.type !== 'ThrowStatement') return false
  const body: N[] = node.parent?.body ?? node.parent?.consequent ?? []
  return body.some((s: N) => s.type === 'VariableDeclaration' && s.declarations.some((d: N) => d.id.typeAnnotation?.typeAnnotation?.type === 'TSNeverKeyword'))
}

function insideTry(node: N, fn: N): boolean {
  for (let p = node.parent; p && p !== fn; p = p.parent) {
    if (p.type === 'TryStatement' && within(node, p.block)) return true
  }
  return false
}
