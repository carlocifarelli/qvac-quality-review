import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import picomatch from 'picomatch'
import type { Config } from '../config.js'
import type { ReviewUnit } from '../types.js'
import { git, sha256 } from '../util.js'
import { runLint, type LintHit } from './lint.js'
import { countSignals, priority } from './signals.js'

export interface Selection {
  commit: string
  scopeFiles: number
  units: ReviewUnit[]
  lint: LintHit[]
}

/** Deterministic stage: scope -> per-file signals -> ranked review units. No network, no LLM. */
/** Tracked files matching include and not exclude. */
export async function scopeFiles(root: string, cfg: Config): Promise<string[]> {
  const isIn = picomatch(cfg.include, { dot: false })
  const isOut = picomatch(cfg.exclude, { dot: true })
  return (await git(root, ['ls-files'])).split('\n').filter((f) => f && isIn(f) && !isOut(f))
}

/** Files changed between `base` and HEAD (merge-base diff, as a PR shows it), restricted to the scope. Deleted files are dropped. */
export async function changedFiles(root: string, cfg: Config, base: string): Promise<string[]> {
  const changed = new Set((await git(root, ['diff', '--name-only', '--diff-filter=d', `${base}...HEAD`])).split('\n').filter(Boolean))
  return (await scopeFiles(root, cfg)).filter((f) => changed.has(f))
}

/**
 * `only`: restrict to these files (PR mode). They are all kept, whatever their
 * size, because a small changed file is still part of the change.
 */
export async function select(root: string, cfg: Config, opts: { typedLint: boolean; only?: string[] }): Promise<Selection> {
  const commit = (await git(root, ['rev-parse', 'HEAD'])).trim()
  const files = opts.only ?? (await scopeFiles(root, cfg))

  const churn = new Map<string, number>()
  const log = await git(root, ['log', `--since=${cfg.churnSince}`, '--name-only', '--pretty=format:'])
  for (const f of log.split('\n')) if (f) churn.set(f, (churn.get(f) ?? 0) + 1)

  const lint = await runLint(root, files, opts.typedLint)
  const lintByFile = new Map<string, Record<string, number[]>>()
  for (const h of lint) {
    const m = lintByFile.get(h.file) ?? {}
    ;(m[h.rule] ??= []).push(h.line)
    lintByFile.set(h.file, m)
  }

  const units: ReviewUnit[] = []
  for (const file of files) {
    const src = await readFile(join(root, file), 'utf8')
    const loc = src.split('\n').filter((l) => l.trim() && !/^\s*(\/\/|\*|\/\*)/.test(l)).length
    if (loc < cfg.minLoc && !opts.only) continue
    const signals = countSignals(src)
    const l = lintByFile.get(file) ?? {}
    const lintHits = Object.values(l).reduce((a, b) => a + b.length, 0)
    const c = churn.get(file) ?? 0
    units.push({ file, loc, churn: c, signals, lint: l, priority: priority(loc, c, signals, lintHits, cfg.signalWeights), contentHash: sha256(src) })
  }
  units.sort((a, b) => b.priority - a.priority || a.file.localeCompare(b.file))
  return { commit, scopeFiles: files.length, units, lint }
}
