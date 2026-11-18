import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Finding, Status } from './types.js'
import { normalizeLine, readJson, sha256, writeJson } from './util.js'

/**
 * Durable state lives in the tool repo (state/), not in the target, so it can
 * be committed and reviewed: findings keyed by fingerprint, the review cache,
 * and human overrides. Fingerprint = file + category + normalized anchor line,
 * so a finding keeps its identity when code above it moves.
 */
export const fingerprint = (file: string, category: string, anchor: string) =>
  'qr1:' + sha256(`${file}\n${category}\n${normalizeLine(anchor)}`).slice(0, 16)

export interface State {
  schemaVersion: 1
  findings: Record<string, Finding>
  runs: { commit: string; at: string; reviewed: number; newFindings: number; costUsd: number }[]
}

export class Store {
  constructor(readonly dir: string) {}
  path = (name: string) => join(this.dir, name)
  load = () => readJson<State>(this.path('findings.json'), { schemaVersion: 1, findings: {}, runs: [] })
  save = (s: State) => writeJson(this.path('findings.json'), s)
  cacheGet = <T>(key: string) => readJson<T | null>(this.path(`cache/${key}.json`), null)
  cachePut = (key: string, v: unknown) => writeJson(this.path(`cache/${key}.json`), v)
  /** Human decisions: { "<fingerprint>": { "status": "rejected", "note": "...", "verifiedBy": "..." } } */
  overrides = () => readJson<Record<string, { status: Status; note: string; verifiedBy?: string }>>(this.path('overrides.json'), {})
}

/** Re-locates each known finding in the current checkout. */
export async function refreshPresence(root: string, state: State, commit: string): Promise<void> {
  const cache = new Map<string, string[] | null>()
  for (const f of Object.values(state.findings)) {
    if (!cache.has(f.file)) {
      try {
        cache.set(f.file, (await readFile(join(root, f.file), 'utf8')).split('\n'))
      } catch {
        cache.set(f.file, null)
      }
    }
    const lines = cache.get(f.file)
    const want = normalizeLine(f.anchor)
    if (!lines) { f.presence = 'gone'; continue }
    if (normalizeLine(lines[f.line - 1] ?? '') === want) { f.presence = 'present'; f.lastSeenCommit = commit; continue }
    const idx = lines.findIndex((l) => normalizeLine(l) === want)
    if (idx >= 0) { f.line = idx + 1; f.presence = 'moved'; f.lastSeenCommit = commit } else f.presence = 'gone'
  }
}

const SEV = { low: 1, medium: 3, high: 6, critical: 10 } as const
const CONF = { low: 0.4, medium: 0.7, high: 1 } as const
const STAT: Record<Status, number> = { confirmed: 1, uncertain: 0.5, candidate: 0.3, rejected: 0 }

export function effectiveStatus(f: Finding): Status {
  return f.human?.status ?? f.verdict?.verdict ?? f.status
}

/** Ranking score: verified severity x confidence x verification state, nudged by churn. */
export function score(f: Finding, churn: number): number {
  const sev = SEV[f.verdict?.severity ?? f.severity]
  return +(sev * CONF[f.confidence] * STAT[effectiveStatus(f)] * (1 + Math.log2(1 + churn) / 4)).toFixed(2)
}
