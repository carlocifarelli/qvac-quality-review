import type { Config } from '../config.js'
import { ghApi } from '../github.js'
import type { State } from '../state.js'
import { issueBody } from '../report.js'

/**
 * Files human-confirmed findings (status set in overrides.json: an agent
 * verdict alone never creates an issue) in a repository YOU control, never the
 * upstream. Idempotent: the fingerprint is embedded in the body and searched
 * before creating, and the issue URL is stored in state.
 */
export async function publish(cfg: Config, state: State, opts: { dryRun: boolean }) {
  if (!cfg.findingsRepo) throw new Error('set findingsRepo in the config')
  if (cfg.findingsRepo.toLowerCase() === cfg.upstreamRepo.toLowerCase()) throw new Error('refusing to file into the upstream repo')
  const out: string[] = []
  const ranked = Object.values(state.findings)
    .filter((f) => f.human?.status === 'confirmed' && f.presence !== 'gone' && !f.issue)
    .sort((a, b) => b.score - a.score)
  for (const f of ranked) {
    const title = `[${f.verdict?.severity ?? f.severity}] ${f.title}`
    if (opts.dryRun) {
      out.push(`would file: ${title}`)
      continue
    }
    const found = await ghApi<{ items: { html_url: string }[] }>('search/issues', {
      fields: { q: `repo:${cfg.findingsRepo} is:issue "${f.fingerprint}"` },
    })
    if (found.items[0]) {
      f.issue = found.items[0].html_url
      continue
    }
    const created = await ghApi<{ html_url: string }>(`repos/${cfg.findingsRepo}/issues`, {
      method: 'POST',
      fields: { title, body: issueBody(f) },
    })
    f.issue = created.html_url
    out.push(`filed ${f.issue}`)
  }
  return out
}
