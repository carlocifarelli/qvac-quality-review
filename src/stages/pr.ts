import type { Config } from '../config.js'
import { type State, type Store, effectiveStatus, refreshPresence } from '../state.js'
import type { Finding, Usage } from '../types.js'
import { git, sourceLink } from '../util.js'
import { RULE_PREFIX } from '../rules/index.js'
import { type Baseline, type RuleHit, runRules } from './rules.js'
import { review, verify } from './review.js'
import { changedFiles, select } from './select.js'

export interface PrResult {
  base: string
  head: string
  files: string[]
  /** Rule hits in changed files that nobody has triaged: these block. */
  blocking: RuleHit[]
  /** Agent findings first seen in this change, with the verifier's verdict: advisory. */
  agent: Finding[]
  /** Known findings whose anchor disappeared from a changed file: probably fixed by this change. */
  fixed: Finding[]
  /** Known, still-open findings in the changed files, for the reviewer's context. */
  open: Finding[]
  /** Changed files beyond prMaxFiles: rules ran on them, the agent did not. */
  skipped: string[]
  usage: Usage
  failures: string[]
}

/**
 * PR mode: everything that should happen on every change, scoped to the files
 * the change touches.
 *  1. deterministic rules (seconds, free) -> blocking
 *  2. agent review + adversarial verify of the changed files (minutes, ~$0.5-1 per file) -> advisory
 *  3. presence refresh of known findings -> "fixed by this PR" / "still open here"
 * The agent result never blocks: it is non-deterministic and unconfirmed; a
 * human decides, and confirmed classes with a syntactic shape become rules.
 */
export async function runPr(root: string, cfg: Config, store: Store, state: State, baseline: Baseline, opts: { base: string; agent: boolean }): Promise<PrResult> {
  const usage: Usage = { calls: 0, cached: 0, costUsd: 0, seconds: 0 }
  const head = (await git(root, ['rev-parse', 'HEAD'])).trim()
  const files = await changedFiles(root, cfg, opts.base)
  const touched = new Set(files)

  const hits = files.length ? await runRules(root, files) : []
  const blocking = hits.filter((h) => !baseline.accepted[h.id])

  const before = new Map(Object.values(state.findings).map((f) => [f.fingerprint, f.presence]))
  await refreshPresence(root, state, head)
  const fixed = Object.values(state.findings).filter((f) => touched.has(f.file) && f.presence === 'gone' && before.get(f.fingerprint) !== 'gone' && effectiveStatus(f) !== 'rejected')

  let agent: Finding[] = []
  let skipped: string[] = []
  const failures: string[] = []
  if (opts.agent && files.length) {
    const sel = await select(root, cfg, { typedLint: false, only: files })
    const known = new Set(Object.keys(state.findings))
    // Units come sorted by risk; large PRs get the agent on the riskiest files only.
    skipped = sel.units.slice(cfg.prMaxFiles).map((u) => u.file)
    const r = await review(root, sel.units.slice(0, cfg.prMaxFiles), cfg, store, state, head, usage)
    const v = await verify(root, cfg, store, state, usage)
    failures.push(...r.failures, ...v.failures)
    agent = Object.values(state.findings).filter((f) => !known.has(f.fingerprint) && f.verdict?.verdict !== 'rejected')
  }
  const open = Object.values(state.findings).filter((f) => touched.has(f.file) && f.presence !== 'gone' && f.human?.status === 'confirmed')
  return { base: opts.base, head, files, blocking, agent, fixed, open, skipped, usage, failures }
}

/** The PR comment. Short on purpose: blocking items first, then advice, then context. */
export function prMarkdown(r: PrResult, upstream: string | undefined): string {
  const at = (file: string, line: number) => sourceLink(upstream, r.head, file, line)
  const issue = (f: Finding) => (f.issue ? `[#${f.issue.split('/').pop()}](${f.issue})` : f.fingerprint)
  const out: string[] = [`### Code review: ${r.files.length} changed file(s) checked against \`${r.base}\``, '']
  if (!r.files.length) return [...out, 'No in-scope JS/TS files changed.', ''].join('\n')

  out.push(r.blocking.length ? `**Blocking: ${r.blocking.length} rule hit(s) not in the baseline**` : '**Rules: no new hits** (deterministic, blocking)')
  for (const h of r.blocking) out.push(`- \`${h.rule.replace(`${RULE_PREFIX}/`, '')}\` ${at(h.file, h.line)}: ${h.message}`)
  if (r.blocking.length) out.push('', 'Fix it, or if it is intended, add the id to the rules baseline (`state/rules-baseline.json`) with a reason (reviewed like any code change).')
  out.push('')

  if (r.agent.length) {
    out.push(`**Agent review (advisory, not blocking): ${r.agent.length} lead(s) in the changed files**`)
    for (const f of r.agent) {
      out.push(`- [${f.verdict?.severity ?? f.severity}] ${at(f.file, f.line)}: ${f.title} _(verifier: ${f.verdict?.verdict ?? 'not verified'})_`)
    }
    out.push('', 'A maintainer confirms or rejects each lead; confirmed ones are tracked as issues, and if the defect has a syntactic shape it becomes a rule.', '')
  } else if (r.usage.calls || r.usage.cached) {
    out.push('**Agent review (advisory): no new leads in the changed files**', '')
  }

  if (r.fixed.length) {
    out.push(`**Probably fixed by this change: ${r.fixed.length}**`)
    for (const f of r.fixed) out.push(`- ${issue(f)} ${f.title}`)
    out.push('')
  }
  if (r.open.length) {
    out.push(`<details><summary>Known open findings in these files (${r.open.length})</summary>`, '')
    for (const f of r.open) out.push(`- ${issue(f)} ${at(f.file, f.line)}: ${f.title}`)
    out.push('', '</details>', '')
  }
  if (r.skipped.length) out.push(`Agent review skipped for ${r.skipped.length} lower-risk file(s) (prMaxFiles); the rules covered them.`, '')
  const cost = r.usage.calls || r.usage.cached ? `${r.usage.calls} agent call(s), ${r.usage.cached} cached, $${r.usage.costUsd.toFixed(2)}` : 'rules only, no agent calls'
  out.push(`<sub>${cost}${r.failures.length ? ` · ${r.failures.length} agent failure(s), see the job log` : ''}</sub>`, '')
  return out.join('\n')
}
