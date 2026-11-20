import { resolve } from 'node:path'
import { loadConfig } from './config.js'
import { listFiles } from './files.js'
import { defaultCollectors } from './collectors/index.js'
import { score } from './scoring.js'
import type { Collector, Finding, Report } from './types.js'
import type { Reviewer } from './llm/review.js'

export async function analyze(
  path: string,
  opts: { reviewer?: Reviewer; collectors?: Collector[] } = {},
): Promise<{ report: Report; failUnder: number }> {
  const root = resolve(path)
  const cfg = await loadConfig(root)
  const target = { root, files: await listFiles(root, cfg) }
  const collectors = opts.collectors ?? defaultCollectors(cfg)

  const results = await Promise.all(collectors.map((c) => c.run(target)))
  const findings: Finding[] = results.flatMap((r) => r.findings)
  const metrics: Record<string, number> = { files: target.files.length }
  for (const r of results) Object.assign(metrics, r.metrics)

  const { overall, dimensions } = score(findings, target.files.length, cfg)
  const report: Report = {
    target: path,
    generatedAt: new Date().toISOString(),
    overall,
    dimensions,
    metrics,
    findings,
  }

  // The LLM only comments on measured data; if it fails, the report still stands.
  if (opts.reviewer && findings.length) {
    try {
      report.review = await opts.reviewer.review({ target, findings })
    } catch (err) {
      report.reviewError = (err as Error).message
    }
  }
  return { report, failUnder: cfg.failUnder }
}
