import { type N, calleeName, isStringArg, rule } from './util.js'

/**
 * Class of finding #8 (run-consumer-external.ts:47 and two siblings).
 *
 * A child killed by a signal exits with `code === null`, so
 * `process.exit(code || 0)` in its 'exit'/'close' handler reports success
 * for a crashed or OOM-killed child, unless the handler also reads `signal`.
 */
export default rule(
  "Child 'exit'/'close' handler maps a signal death to exit code 0",
  { exit: "`{{expr}}` exits 0 when the child was killed by a signal (code is null). Read the handler's `signal` argument and exit non-zero." },
  (context) => {
    const source = context.sourceCode
    return {
      CallExpression(node: N) {
        if (source.getText(node.callee) !== 'process.exit') return
        const arg = node.arguments[0]
        if (arg?.type !== 'LogicalExpression' || !['||', '??'].includes(arg.operator)) return
        if (arg.left.type !== 'Identifier' || arg.right.type !== 'Literal' || arg.right.value !== 0) return
        const handler = enclosingExitHandler(node)
        if (!handler || handler.params[0]?.type !== 'Identifier' || handler.params[0].name !== arg.left.name) return
        const sigParam = handler.params[1]
        if (sigParam?.type === 'Identifier') {
          const v = source.getDeclaredVariables(handler).find((x) => x.name === sigParam.name)
          if (v && v.references.length > 0) return
        }
        context.report({ node, messageId: 'exit', data: { expr: source.getText(node) } })
      },
    }
  },
)

function enclosingExitHandler(node: N): N | undefined {
  for (let p = node.parent; p; p = p.parent) {
    if (!['FunctionExpression', 'ArrowFunctionExpression'].includes(p.type)) continue
    const call = p.parent
    if (call?.type === 'CallExpression' && ['on', 'once', 'addListener'].includes(calleeName(call) ?? '') && isStringArg(call.arguments[0], 'exit', 'close') && call.arguments[1] === p) return p
    return undefined
  }
  return undefined
}
