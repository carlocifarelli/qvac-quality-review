import type { Rule, SourceCode } from 'eslint'

// ESTree nodes are walked generically here; the typed ESTree unions add no
// safety for this kind of structural matching, so nodes are `any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type N = any

const FN = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'])
export const isFunction = (n: N) => n && FN.has(n.type)

/** Source text of an expression with `?.` and TS `!` removed, for comparing `a?.b` with `a.b`. */
export function key(source: SourceCode, node: N): string {
  return source.getText(node).replace(/\?\./g, '.').replace(/!(?=[.)\]]|$)/g, '').replace(/\s+/g, '')
}

export function ancestors(node: N): N[] {
  const out: N[] = []
  for (let p = node.parent; p; p = p.parent) out.push(p)
  return out
}

export const nearestFunction = (node: N): N | undefined => ancestors(node).find(isFunction)

/** Nearest enclosing async function, else the nearest function. */
export function nearestAsyncFunction(node: N): N | undefined {
  const fns = ancestors(node).filter(isFunction)
  return fns.find((f) => f.async) ?? fns[0]
}

/**
 * Depth-first walk. `intoFunctions: false` stops at nested function
 * boundaries (the root itself is always entered).
 */
export function walk(source: SourceCode, root: N, visit: (n: N) => void, intoFunctions = true): void {
  const keys = source.visitorKeys
  const go = (n: N) => {
    visit(n)
    for (const k of keys[n.type] ?? []) {
      const v = n[k]
      for (const c of Array.isArray(v) ? v : [v]) {
        if (!c || typeof c.type !== 'string') continue
        if (!intoFunctions && isFunction(c)) continue
        go(c)
      }
    }
  }
  go(root)
}

export function collect(source: SourceCode, root: N, pred: (n: N) => boolean, intoFunctions = true): N[] {
  const out: N[] = []
  walk(source, root, (n) => { if (pred(n)) out.push(n) }, intoFunctions)
  return out
}

export const within = (inner: N, outer: N) => inner.range[0] >= outer.range[0] && inner.range[1] <= outer.range[1]

/** `x.name(...)` → name; `name(...)` → name. */
export function calleeName(call: N): string | undefined {
  const c = call.callee
  if (c?.type === 'Identifier') return c.name
  if (c?.type === 'MemberExpression' && !c.computed && c.property.type === 'Identifier') return c.property.name
  return undefined
}

export const isStringArg = (n: N, ...values: string[]) => n?.type === 'Literal' && values.includes(n.value)

/** The executor of `new Promise((resolve, reject) => ...)`, if `node` is one. */
export function promiseExecutor(node: N): N | undefined {
  if (node.type !== 'NewExpression' || node.callee.type !== 'Identifier' || node.callee.name !== 'Promise') return undefined
  const ex = node.arguments[0]
  return isFunction(ex) ? ex : undefined
}

export function rule(
  description: string,
  messages: Record<string, string>,
  create: Rule.RuleModule['create'],
  schema: Rule.RuleMetaData['schema'] = [],
): Rule.RuleModule {
  return { meta: { type: 'problem', docs: { description }, messages, schema }, create }
}
