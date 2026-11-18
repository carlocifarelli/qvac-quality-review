import { exec } from './util.js'

/**
 * GitHub access goes through the `gh` CLI: it reuses whatever login the
 * operator already has (gh auth login, GH_TOKEN, or a CI token), so the tool
 * never stores or asks for credentials.
 */
export async function ghApi<T>(path: string, opts: { method?: string; fields?: Record<string, string> } = {}): Promise<T> {
  const args = ['api', '-X', opts.method ?? 'GET', path]
  for (const [k, v] of Object.entries(opts.fields ?? {})) args.push('-f', `${k}=${v}`)
  const { stdout } = await exec('gh', args, { maxBuffer: 16 * 1024 * 1024 })
  return JSON.parse(stdout) as T
}

export interface SearchHit { title: string; html_url: string; state: string; pull_request?: unknown }

/** Searches issues AND pull requests, open AND closed (the API needs one type per query). */
export async function searchIssuesAndPrs(repo: string, terms: string): Promise<{ query: string; total: number; items: SearchHit[] }[]> {
  const out = []
  for (const kind of ['is:issue', 'is:pull-request']) {
    const query = `repo:${repo} ${kind} ${terms}`
    const res = await ghApi<{ total_count: number; items: SearchHit[] }>('search/issues', { fields: { q: query, per_page: '5' } })
    out.push({ query, total: res.total_count, items: res.items })
    await new Promise((r) => setTimeout(r, 2500)) // search API: 30 req/min authenticated
  }
  return out
}
