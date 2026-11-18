import { type N, calleeName, collect, isStringArg, key, promiseExecutor, rule } from './util.js'

/**
 * Class of finding #29 (metrics-server.js:50).
 *
 * `server.on('error', reject)` inside the promise that waits for listen():
 * once the promise has resolved, the listener stays and every later 'error'
 * goes to a settled promise and is silently dropped. Because a listener
 * exists, Node does not crash or log either.
 *
 * Only long-lived emitters are checked: the executor must also call
 * `X.listen()`, `X.connect()` or `X.bind()`, or wait for 'listening'/'connect'.
 * Not reported when the listener is `once` or is removed again.
 */
export default rule(
  "'error' listener that only rejects a startup promise is never removed",
  { stale: "`{{target}}.on('error', {{reject}})` outlives the startup promise: later errors from `{{target}}` are swallowed. Remove it after startup or replace it with a logging handler." },
  (context) => {
    const source = context.sourceCode
    return {
      NewExpression(node: N) {
        const ex = promiseExecutor(node)
        const reject = ex?.params[1]
        if (!ex || reject?.type !== 'Identifier') return
        const calls = collect(source, ex.body, (n) => n.type === 'CallExpression' && n.callee.type === 'MemberExpression')
        for (const call of calls) {
          if (!['on', 'addListener'].includes(calleeName(call) ?? '') || !isStringArg(call.arguments[0], 'error')) continue
          const arg = call.arguments[1]
          if (arg?.type !== 'Identifier' || arg.name !== reject.name) continue
          const target = key(source, call.callee.object)
          const sameTarget = (c: N) => key(source, c.callee.object) === target
          const longLived = calls.some((c) => sameTarget(c) && (['listen', 'connect', 'bind'].includes(calleeName(c) ?? '') || (['on', 'once'].includes(calleeName(c) ?? '') && isStringArg(c.arguments[0], 'listening', 'connect'))))
          if (!longLived) continue
          const scope = node.parent ? enclosingBody(node) : ex.body
          const removed = collect(source, scope, (n) => n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && ['off', 'removeListener', 'removeAllListeners'].includes(calleeName(n) ?? '') && key(source, n.callee.object) === target).length > 0
          if (removed) continue
          context.report({ node: call, messageId: 'stale', data: { target, reject: reject.name } })
        }
      },
    }
  },
)

function enclosingBody(node: N): N {
  for (let p = node.parent; p; p = p.parent) {
    if (['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(p.type)) return p.body
    if (p.type === 'Program') return p
  }
  return node
}
