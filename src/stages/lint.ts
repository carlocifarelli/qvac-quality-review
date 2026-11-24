import { ESLint, type Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import { RULES as HYGIENE_RULES, RULE_PREFIX, plugin as hygiene } from '../rules/index.js'

/**
 * Correctness-only ESLint pass. Style is out of scope: projects
 * have their own linters and formatters for that. Type-aware rules run when the target has its
 * dependencies installed; otherwise the parser falls back to syntax-only rules.
 */
const CORE_RULES = {
  'no-async-promise-executor': 'warn',
  'no-unsafe-finally': 'warn',
  'no-unsafe-optional-chaining': 'warn',
  'no-promise-executor-return': 'warn',
  'no-self-compare': 'warn',
  'no-unmodified-loop-condition': 'warn',
  'no-unreachable-loop': 'warn',
  'no-constant-binary-expression': 'warn',
  'no-empty': ['warn', { allowEmptyCatch: false }],
  'no-dupe-else-if': 'warn',
  'no-fallthrough': 'warn',
  'array-callback-return': 'warn',
  'use-isnan': 'warn',
  'no-cond-assign': 'warn',
  'no-unused-private-class-members': 'warn',
} satisfies Linter.RulesRecord

const TYPED_RULES = {
  '@typescript-eslint/no-floating-promises': 'warn',
  '@typescript-eslint/no-misused-promises': 'warn',
  '@typescript-eslint/await-thenable': 'warn',
  '@typescript-eslint/only-throw-error': 'warn',
  '@typescript-eslint/switch-exhaustiveness-check': 'warn',
} satisfies Linter.RulesRecord

export interface LintHit { file: string; line: number; rule: string; message: string }

export async function runLint(root: string, files: string[], typed: boolean): Promise<LintHit[]> {
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    errorOnUnmatchedPattern: false,
    overrideConfig: [
      { linterOptions: { reportUnusedDisableDirectives: 'off', noInlineConfig: true } },
      // The async-hygiene rules also feed the risk signals, so files with known bug patterns are reviewed first.
      { files: ['**/*.{js,mjs,cjs,ts,tsx}'], languageOptions: { ecmaVersion: 'latest', sourceType: 'module' }, plugins: { [RULE_PREFIX]: hygiene }, rules: { ...CORE_RULES, ...HYGIENE_RULES } },
      {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
          parser: tseslint.parser,
          parserOptions: typed ? { projectService: true, tsconfigRootDir: root } : {},
        },
        plugins: { '@typescript-eslint': tseslint.plugin as never },
        rules: typed ? TYPED_RULES : {},
      },
    ],
  })
  const hits: LintHit[] = []
  for (const chunk of chunks(files, 200)) {
    for (const r of await eslint.lintFiles(chunk)) {
      for (const m of r.messages) {
        if (m.fatal || !m.ruleId) continue
        hits.push({ file: r.filePath.slice(root.length + 1), line: m.line, rule: m.ruleId, message: m.message })
      }
    }
  }
  return hits
}

function chunks<T>(a: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n))
  return out
}
