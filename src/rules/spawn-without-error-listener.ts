import { type N, calleeName, isStringArg, rule } from './util.js'

/**
 * Class of finding #31 (process-manager.ts:67).
 *
 * spawn()/fork() report a failure to start (ENOENT, EACCES, EAGAIN) as an
 * asynchronous 'error' event, not a throw. Without a listener it becomes an
 * uncaught exception after the caller's try/catch has already returned.
 *
 * Accepted as handled: an 'error' listener on the child in the same function,
 * passing the child to `once(child, …)` / another function, or returning the
 * child itself.
 */
const CP_OBJECT = /^(child_?process|cp|childProcess)$/i

export default rule(
  "spawn()/fork() result has no 'error' listener",
  { spawn: "The child from `{{call}}` has no 'error' listener: a failed start (ENOENT, EACCES) becomes an uncaught exception." },
  (context) => {
    const source = context.sourceCode
    return {
      CallExpression(node: N) {
        if (!isSpawn(node)) return
        if (chainHasError(node)) return
        // Look through `cond ? spawn(a) : spawn(b)`, `x as ChildProcess`, `(spawn(...))`.
        let expr = node
        while (['ConditionalExpression', 'LogicalExpression', 'TSAsExpression', 'TSNonNullExpression', 'TSSatisfiesExpression'].includes(expr.parent.type) && expr.parent.test !== expr) expr = expr.parent
        const p = expr.parent
        if (p.type === 'ReturnStatement' || p.type === 'ArrowFunctionExpression') return
        if (p.type === 'CallExpression' && p.arguments.includes(expr)) return
        let target: N | undefined
        if (p.type === 'VariableDeclarator' && p.id.type === 'Identifier') target = p.id
        else if (p.type === 'AssignmentExpression' && p.right === expr && p.left.type === 'Identifier') target = p.left
        else if (p.type === 'AssignmentExpression' && p.left.type === 'MemberExpression') return // stored on an object: the owner may listen elsewhere
        if (target) {
          const v = findVariable(source.getScope(node), target.name)
          if (v?.references.some((r: N) => r.identifier !== target && handles(r.identifier))) return
        }
        context.report({ node, messageId: 'spawn', data: { call: source.getText(node.callee) + '(…)' } })
      },
    }
  },
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findVariable(scope: any, name: string): any {
  for (let s = scope; s; s = s.upper) {
    const v = s.set.get(name)
    if (v) return v
  }
  return undefined
}

function isSpawn(node: N): boolean {
  const c = node.callee
  if (c.type === 'Identifier') return c.name === 'spawn' || c.name === 'fork'
  if (c.type === 'MemberExpression' && !c.computed && ['spawn', 'fork'].includes(c.property.name)) return c.object.type === 'Identifier' && CP_OBJECT.test(c.object.name)
  return false
}

function isErrorListen(call: N): boolean {
  return call?.type === 'CallExpression' && ['on', 'once', 'addListener', 'prependListener'].includes(calleeName(call) ?? '') && isStringArg(call.arguments[0], 'error')
}

// spawn(...).on('exit', …).on('error', …)
function chainHasError(node: N): boolean {
  let cur = node
  while (cur.parent?.type === 'MemberExpression' && cur.parent.object === cur && cur.parent.parent?.type === 'CallExpression') {
    cur = cur.parent.parent
    if (isErrorListen(cur)) return true
  }
  return false
}

function handles(id: N): boolean {
  const p = id.parent
  if (p.type === 'MemberExpression' && p.object === id && isErrorListen(p.parent)) return true
  if (p.type === 'MemberExpression' && p.object === id && p.parent?.type === 'MemberExpression') return false
  if (p.type === 'ReturnStatement') return true
  if (p.type === 'CallExpression' && p.arguments.includes(id)) return true // once(child, 'exit'), helpers
  return false
}
