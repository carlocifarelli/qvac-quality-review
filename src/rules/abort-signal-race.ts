import { type N, ancestors, calleeName, collect, isFunction, isStringArg, key, rule, walk } from './util.js'

/**
 * Class of findings #11 (hyperdrive.ts:481) and #16 (run.ts:218).
 *
 * An AbortSignal fires 'abort' once. Code that awaits and then starts
 * listening, or that checked `signal.aborted` only before an await, misses an
 * abort that happened in between: the operation then hangs or runs to the end.
 *
 * Reports:
 *  - `signal.addEventListener('abort', …)` with no `signal.aborted` /
 *    `signal.throwIfAborted()` check after the last await that precedes it
 *    (or anywhere in the function when nothing is awaited before it);
 *  - a signal handed to a function of the same file that never checks
 *    `.aborted` itself, after an await, when the caller checked
 *    `signal.aborted` before that await but not again after it. Calls to
 *    functions defined elsewhere (fetch, library APIs) are assumed to check.
 */
export default rule(
  'AbortSignal used after an await without re-checking signal.aborted',
  {
    listener: "'abort' listener on `{{signal}}` is added after an await with no `{{signal}}.aborted` check after it: an abort in between is never seen.",
    listenerNoCheck: "'abort' listener on `{{signal}}` with no `{{signal}}.aborted` check: a signal that is already aborted never fires it.",
    staleCheck: '`{{signal}}.aborted` is checked only before an await; an abort during that await is lost when `{{signal}}` is used here.',
  },
  (context) => {
    const source = context.sourceCode

    // Functions declared in this file, by name: `function f() {}` and `const f = () => {}`.
    const local = new Map<string, N>()
    walk(source, source.ast, (n) => {
      if (n.type === 'FunctionDeclaration' && n.id) local.set(n.id.name, n)
      if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && isFunction(n.init)) local.set(n.id.name, n.init)
    })

    // Does the local callee check the signal it receives at `index` (or anywhere, for an options object)?
    function calleeChecks(call: N, index: number): boolean {
      const fn = call.callee.type === 'Identifier' ? local.get(call.callee.name) : undefined
      if (!fn) return true
      const param = fn.params[index]
      const name = param?.type === 'Identifier' ? param.name : param?.type === 'AssignmentPattern' && param.left.type === 'Identifier' ? param.left.name : undefined
      return collect(source, fn.body, (n) => {
        if (n.type === 'MemberExpression' && !n.computed && n.property.name === 'aborted') return !name || key(source, n.object) === name || key(source, n.object).endsWith('.signal')
        return n.type === 'CallExpression' && calleeName(n) === 'throwIfAborted'
      }).length > 0
    }

    function analyse(use: N, signal: N, kind: 'listener' | 'pass', index = -1) {
      const sig = key(source, signal)
      if (!/signal/i.test(sig)) return
      const fn = scopeOf(use)
      if (!fn) return
      if (createdLocally(fn, sig)) return
      const start = use.range[0]
      const awaits = collect(source, fn.body, (n) => n.type === 'AwaitExpression' && n.range[1] <= start, false)
      const lastAwait = awaits.reduce<N | undefined>((a, b) => (!a || b.range[1] > a.range[1] ? b : a), undefined)
      const checks = collect(source, fn.body, (n) => isCheck(n, sig))
      if (kind === 'listener') {
        if (!lastAwait) {
          if (checks.length === 0) context.report({ node: use, messageId: 'listenerNoCheck', data: { signal: sig } })
          return
        }
        if (!checks.some((c) => c.range[0] >= lastAwait.range[1])) context.report({ node: use, messageId: 'listener', data: { signal: sig } })
        return
      }
      if (!lastAwait || calleeChecks(use, index)) return
      const before = checks.some((c) => c.range[1] <= lastAwait.range[0])
      const after = checks.some((c) => c.range[0] >= lastAwait.range[1] && c.range[0] <= start)
      if (before && !after) context.report({ node: use, messageId: 'staleCheck', data: { signal: sig } })
    }

    // The nearest async function; without one, the outermost enclosing function,
    // so a check in a sync wrapper around `new Promise(...)` counts.
    function scopeOf(use: N): N | undefined {
      const fns = ancestors(use).filter(isFunction)
      return fns.find((f) => f.async) ?? fns[fns.length - 1]
    }

    function isCheck(n: N, sig: string): boolean {
      if (n.type === 'MemberExpression' && !n.computed && n.property.name === 'aborted') return key(source, n.object) === sig
      if (n.type === 'CallExpression' && calleeName(n) === 'throwIfAborted') {
        // signal.throwIfAborted() or a helper: throwIfAborted(signal)
        if (n.callee.type === 'MemberExpression') return key(source, n.callee.object) === sig
        return n.arguments.some((a: N) => key(source, a) === sig)
      }
      return false
    }

    // `const c = new AbortController()` in this function: `c.signal` cannot be aborted before it is wired.
    function createdLocally(fn: N, sig: string): boolean {
      const m = /^(\w+)\.signal$/.exec(sig)
      if (!m) return false
      let found = false
      walk(source, fn.body, (n) => {
        if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.id.name === m[1] && n.init?.type === 'NewExpression' && n.init.callee.name === 'AbortController') found = true
      })
      return found
    }

    return {
      CallExpression(node: N) {
        const name = calleeName(node)
        if (name === 'addEventListener' && node.callee.type === 'MemberExpression' && isStringArg(node.arguments[0], 'abort')) {
          analyse(node, node.callee.object, 'listener')
          return
        }
        if (name === 'removeEventListener' || name === 'addEventListener' || name === 'throwIfAborted' || name === 'any') return
        for (const [i, arg] of node.arguments.entries()) {
          if (isFunction(arg)) continue
          if (arg.type === 'Identifier' || arg.type === 'MemberExpression') analyse(node, arg, 'pass', i)
          if (arg.type === 'ObjectExpression') {
            for (const p of arg.properties) {
              if (p.type === 'Property' && !p.computed && p.key.name === 'signal' && (p.value.type === 'Identifier' || p.value.type === 'MemberExpression')) analyse(node, p.value, 'pass', i)
            }
          }
        }
      },
    }
  },
)
