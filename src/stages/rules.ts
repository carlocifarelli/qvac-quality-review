import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ESLint } from 'eslint'
import tseslint from 'typescript-eslint'
import { RULES, plugin } from '../rules/index.js'
import { normalizeLine, sha256 } from '../util.js'

export interface RuleHit {
  /** Stable across line shifts: rule + file + message + normalized text of the flagged line. */
  id: string
  rule: string
  file: string
  line: number
  message: string
  code: string
}

/** ESLint config for the qvac-quality rules alone (syntax only, no type information needed). */
export function rulesConfig() {
  return [
    { linterOptions: { reportUnusedDisableDirectives: 'off' as const, noInlineConfig: true } },
    {
      files: ['**/*.{js,mjs,cjs,ts,tsx}'],
      languageOptions: { parser: tseslint.parser, ecmaVersion: 'latest' as const, sourceType: 'module' as const },
      plugins: { 'qvac-quality': plugin },
      rules: RULES,
    },
  ]
}

/** Deterministic pass: the qvac-quality rules over every in-scope file. No network, no LLM. */
export async function runRules(root: string, files: string[]): Promise<RuleHit[]> {
  const eslint = new ESLint({ cwd: root, overrideConfigFile: true, errorOnUnmatchedPattern: false, overrideConfig: rulesConfig() })
  const hits: RuleHit[] = []
  for (let i = 0; i < files.length; i += 200) {
    for (const r of await eslint.lintFiles(files.slice(i, i + 200))) {
      const lines = (await readFile(r.filePath, 'utf8')).split('\n')
      const file = r.filePath.slice(root.length + 1)
      for (const m of r.messages) {
        if (m.fatal || !m.ruleId?.startsWith('qvac-quality/')) continue
        const code = lines[m.line - 1]?.trim() ?? ''
        hits.push({ id: 'qq:' + sha256(`${m.ruleId}\n${file}\n${m.message}\n${normalizeLine(code)}`).slice(0, 16), rule: m.ruleId, file, line: m.line, message: m.message, code })
      }
    }
  }
  return hits.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
}

export interface Baseline {
  /** Triaged hits by id: a tracked finding, an accepted instance not worth fixing, or a false positive. */
  commit?: string
  accepted: Record<string, { rule: string; file: string; code: string; status: 'finding' | 'accepted' | 'false-positive'; reason: string; triagedAt: string }>
}

export async function loadBaseline(path: string): Promise<Baseline> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as Baseline
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return { accepted: {} }
    throw e
  }
}

export const baselinePath = (stateDir: string) => join(stateDir, 'rules-baseline.json')
