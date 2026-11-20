import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import ts from 'typescript'
import type { Collector, Finding } from '../types.js'
import type { Config } from '../config.js'

/**
 * Example collector: cyclomatic complexity and length per function, via the TypeScript AST.
 * Note: TypeScript 7 (native) has no JS compiler API, so this project pins typescript 5.9.
 */
export function complexityCollector(cfg: Config): Collector {
  return {
    name: 'complexity',
    async run(target) {
      const findings: Finding[] = []
      let functions = 0
      let totalComplexity = 0
      for (const file of target.files) {
        const text = await readFile(join(target.root, file), 'utf8')
        const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
        visitFunctions(sf, (node, name) => {
          functions++
          const complexity = cyclomatic(node)
          totalComplexity += complexity
          const { line: start } = sf.getLineAndCharacterOfPosition(node.getStart())
          const { line: end } = sf.getLineAndCharacterOfPosition(node.getEnd())
          const length = end - start + 1
          if (complexity > cfg.thresholds.functionComplexity) {
            findings.push({
              collector: 'complexity',
              rule: 'cyclomatic-complexity',
              dimension: 'maintainability',
              severity: complexity > cfg.thresholds.functionComplexity * 2 ? 'major' : 'minor',
              file,
              line: start + 1,
              message: `${name} has cyclomatic complexity ${complexity} (limit ${cfg.thresholds.functionComplexity})`,
            })
          }
          if (length > cfg.thresholds.functionLength) {
            findings.push({
              collector: 'complexity',
              rule: 'function-length',
              dimension: 'maintainability',
              severity: 'minor',
              file,
              line: start + 1,
              message: `${name} is ${length} lines long (limit ${cfg.thresholds.functionLength})`,
            })
          }
        })
      }
      return {
        findings,
        metrics: {
          functions,
          avgComplexity: functions ? Math.round((totalComplexity / functions) * 10) / 10 : 0,
        },
      }
    },
  }
}

type FnNode = ts.FunctionLikeDeclaration

function visitFunctions(root: ts.Node, cb: (node: FnNode, name: string) => void) {
  const visit = (node: ts.Node) => {
    if (ts.isFunctionLike(node) && 'body' in node && node.body) {
      cb(node as FnNode, functionName(node as FnNode))
    }
    ts.forEachChild(node, visit)
  }
  visit(root)
}

function functionName(node: FnNode): string {
  if (node.name && ts.isIdentifier(node.name)) return node.name.text
  if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name))
    return node.parent.name.text
  return '<anonymous>'
}

/** 1 + one point per branch. Nested functions are counted separately, not here. */
export function cyclomatic(fn: FnNode): number {
  let score = 1
  const visit = (node: ts.Node) => {
    if (node !== fn && ts.isFunctionLike(node)) return
    switch (node.kind) {
      case ts.SyntaxKind.IfStatement:
      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.ForOfStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.DoStatement:
      case ts.SyntaxKind.CaseClause:
      case ts.SyntaxKind.CatchClause:
      case ts.SyntaxKind.ConditionalExpression:
        score++
        break
      case ts.SyntaxKind.BinaryExpression: {
        const op = (node as ts.BinaryExpression).operatorToken.kind
        if (
          op === ts.SyntaxKind.AmpersandAmpersandToken ||
          op === ts.SyntaxKind.BarBarToken ||
          op === ts.SyntaxKind.QuestionQuestionToken
        )
          score++
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(fn)
  return score
}
