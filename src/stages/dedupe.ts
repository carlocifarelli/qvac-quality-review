import type { Config } from '../config.js'
import { searchIssuesAndPrs } from '../github.js'
import { effectiveStatus, type State } from '../state.js'

/**
 * Searches the upstream tracker (issues AND pull requests, open AND closed) for
 * each non-rejected finding and records every query with its timestamp, so the
 * "not already filed" claim is auditable. Hits are recorded, not auto-judged:
 * a human reads them and marks a duplicate in overrides.json.
 */
export async function dedupe(cfg: Config, state: State, opts: { force?: boolean; only?: string[] } = {}) {
  const upstream = cfg.upstreamRepo
  if (!upstream) throw new Error('set upstreamRepo in the config: dedupe searches its issues and pull requests')
  let queries = 0
  for (const f of Object.values(state.findings)) {
    if (opts.only && !opts.only.includes(f.fingerprint)) continue
    if (effectiveStatus(f) === 'rejected' || f.presence === 'gone') continue
    if (f.duplicates?.length && !opts.force) continue
    const base = f.file.split('/').pop()!.replace(/\.(m|c)?[jt]sx?$/, '')
    const terms = [...new Set([...(f.verdict?.duplicateSearchTerms ?? []), base])]
    f.duplicates = []
    for (const t of terms) {
      for (const r of await searchIssuesAndPrs(upstream, t)) {
        f.duplicates.push({
          query: r.query,
          searchedAt: new Date().toISOString(),
          total: r.total,
          top: r.items.map((i) => ({ title: i.title, url: i.html_url, state: i.state })),
        })
        queries++
      }
    }
  }
  return { queries }
}
