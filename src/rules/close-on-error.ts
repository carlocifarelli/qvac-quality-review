import type { Rule } from 'eslint'
import { type N, calleeName, collect, nearestFunction, rule, within } from './util.js'

/**
 * Class of findings #22 (hyperdrive.ts:85) and #14 (hyperdrive.ts:370).
 *
 * A storage or network resource (Corestore, Hyperdrive, Hyperswarm, …) is
 * created in a function, then something is awaited before the resource is
 * handed off (returned, stored on an object, registered). If that await
 * throws, nobody holds a reference that could close it: storage locks and
 * sockets stay open until the process exits.
 *
 * Reports the first such await, unless it sits in a try whose catch/finally
 * mentions the resource. Awaiting the resource's own ready()/open() is allowed.
 */
const DEFAULT_CLASSES = ['Corestore', 'Hypercore', 'Hyperdrive', 'Hyperbee', 'Hyperswarm', 'Autobase', 'HyperDB', 'RocksDB', 'HyperDHT', 'DHT']

export default rule(
  'Resource created before an await is not closed if the await throws',
  { leak: '`{{name}}` (new {{cls}}) is still local when this await runs; if it throws, `{{name}}` is never closed. Close it in a catch/finally, or hand it off first.' },
  (context) => {
    const source = context.sourceCode
    const classes = new Set<string>(context.options[0]?.classes ?? DEFAULT_CLASSES)

    return {
      VariableDeclarator(decl: N) {
        const init = decl.init
        if (decl.id.type !== 'Identifier' || init?.type !== 'NewExpression' || init.callee.type !== 'Identifier' || !classes.has(init.callee.name)) return
        const fn = nearestFunction(decl)
        if (!fn) return
        const name = decl.id.name
        const variable = source.getDeclaredVariables(decl)[0]
        const refs = (variable?.references ?? []).map((r: Rule.Node | N) => r.identifier).filter((id: N) => id !== decl.id)
        const escapes = refs.filter((id: N) => isHandOff(id)).map((id: N) => id.range[0])
        const escapeAt = escapes.length ? Math.min(...escapes) : Infinity
        const awaits = collect(source, fn.body, (n) => n.type === 'AwaitExpression' && n.range[0] > decl.range[1] && n.range[0] < escapeAt, false)
        for (const aw of awaits) {
          if (isOwnLifecycle(aw.argument, name)) continue
          if (guarded(aw, fn, name)) continue
          context.report({ node: aw, messageId: 'leak', data: { name, cls: init.callee.name } })
          return
        }
      },
    }

    function isOwnLifecycle(arg: N, name: string): boolean {
      return arg?.type === 'CallExpression' && arg.callee.type === 'MemberExpression' && arg.callee.object.type === 'Identifier' && arg.callee.object.name === name && ['ready', 'open'].includes(calleeName(arg) ?? '')
    }

    function guarded(aw: N, fn: N, name: string): boolean {
      for (let p = aw.parent; p && p !== fn; p = p.parent) {
        if (p.type !== 'TryStatement' || !within(aw, p.block)) continue
        const cleanup = [p.handler?.body, p.finalizer].filter(Boolean)
        if (cleanup.some((b: N) => collect(source, b, (n) => n.type === 'Identifier' && n.name === name).length > 0)) return true
      }
      return false
    }

    // A reference that gives the resource to someone who can close it later.
    function isHandOff(id: N): boolean {
      const p = id.parent
      if (p.type === 'ReturnStatement') return true
      if (p.type === 'AssignmentExpression' && p.right === id) return true
      if (p.type === 'Property' && p.value === id) return true
      if (p.type === 'ArrayExpression') return true
      if (p.type === 'CallExpression' && p.arguments.includes(id)) return /register|track|add|push|set|resolve|own|adopt/i.test(calleeName(p) ?? '')
      return false
    }
  },
  [{ type: 'object', properties: { classes: { type: 'array', items: { type: 'string' } } }, additionalProperties: false }],
)
