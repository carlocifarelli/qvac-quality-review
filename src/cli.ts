#!/usr/bin/env node
import { writeFile, mkdir } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { Command } from 'commander'
import { loadConfig } from './config.js'
import { select } from './stages/select.js'
import { review, verify } from './stages/review.js'
import { dedupe } from './stages/dedupe.js'
import { publish } from './stages/publish.js'
import { Store, refreshPresence, score, type State } from './state.js'
import { toMarkdown } from './report.js'
import { git, writeJson } from './util.js'
import type { Usage } from './types.js'

const program = new Command()
  .name('qr')
  .description('Find, verify and rank defects worth fixing in a JS/TS repository')

async function openState(dir: string): Promise<{ store: Store; state: State }> {
  const store = new Store(resolve(dir))
  const state = await store.load()
  for (const [fp, h] of Object.entries(await store.overrides())) {
    if (state.findings[fp]) state.findings[fp].human = h
  }
  return { store, state }
}

program
  .command('run')
  .description('select -> review -> verify -> report. dedupe and publish are separate because they call GitHub')
  .argument('<repo>', 'path to a git checkout of the target')
  .option('-c, --config <file>', 'config file', 'qr.config.json')
  .option('-s, --state <dir>', 'state directory (commit it)', 'state')
  .option('-o, --out <dir>', 'report directory', 'results')
  .option('--top <n>', 'override reviewTop')
  .option('--select-only', 'deterministic stage only: no LLM calls')
  .option('--typed-lint', 'type-aware lint (needs the target dependencies installed)')
  .action(async (repo: string, o) => {
    const root = resolve(repo)
    const cfg = await loadConfig(o.config)
    if (o.top) cfg.reviewTop = Number(o.top)
    const { store, state } = await openState(o.state)
    const usage: Usage = { calls: 0, cached: 0, costUsd: 0, seconds: 0 }

    const sel = await select(root, cfg, { typedLint: Boolean(o.typedLint) })
    const top = sel.units.slice(0, cfg.reviewTop)
    await mkdir(o.out, { recursive: true })
    await writeJson(join(o.out, 'selection.json'), {
      commit: sel.commit,
      scopeFiles: sel.scopeFiles,
      candidates: sel.units.length,
      top,
      rest: sel.units.slice(cfg.reviewTop).map((u) => ({ file: u.file, priority: u.priority })),
      lint: sel.lint,
    })
    console.error(`scope ${sel.scopeFiles} files, ${sel.units.length} above minLoc, reviewing top ${top.length}`)
    if (o.selectOnly || cfg.backend === 'none') return

    await refreshPresence(root, state, sel.commit)
    const r = await review(root, top, cfg, store, state, sel.commit, usage)
    console.error(`review: ${r.added} new candidates, ${r.failures.length} failures`)
    await store.save(state)
    const v = await verify(root, cfg, store, state, usage)
    console.error(`verify: ${v.verified} verdicts, ${v.failures.length} failures`)
    const churn = new Map(sel.units.map((u) => [u.file, u.churn]))
    for (const f of Object.values(state.findings)) {
      if (churn.has(f.file)) f.churn = churn.get(f.file)
      f.score = score(f)
    }
    state.runs.push({
      commit: sel.commit,
      at: new Date().toISOString(),
      reviewed: top.length,
      newFindings: r.added,
      costUsd: +usage.costUsd.toFixed(2),
    })
    await store.save(state)
    await writeJson(join(o.out, 'run-log.json'), { commit: sel.commit, usage, failures: [...r.failures, ...v.failures] })
    await writeFile(join(o.out, 'FINDINGS.md'), toMarkdown(state, cfg.upstreamRepo, sel.commit))
    console.error(
      `usage: ${usage.calls} agent calls (${usage.cached} cached), $${usage.costUsd.toFixed(2)}, ${Math.round(usage.seconds)}s agent time`,
    )
  })

program
  .command('report')
  .description('re-render FINDINGS.md from state (after editing overrides.json)')
  .argument('<repo>')
  .option('-c, --config <file>', 'config file', 'qr.config.json')
  .option('-s, --state <dir>', 'state directory', 'state')
  .option('-o, --out <dir>', 'report directory', 'results')
  .action(async (repo: string, o) => {
    const cfg = await loadConfig(o.config)
    const { store, state } = await openState(o.state)
    const commit = (await git(resolve(repo), ['rev-parse', 'HEAD'])).trim()
    await refreshPresence(resolve(repo), state, commit)
    for (const f of Object.values(state.findings)) f.score = score(f)
    await store.save(state)
    await mkdir(o.out, { recursive: true })
    await writeFile(join(o.out, 'FINDINGS.md'), toMarkdown(state, cfg.upstreamRepo, commit))
  })

program
  .command('dedupe')
  .description('search upstream issues and PRs (open and closed) for each finding; logs queries with dates')
  .option('-c, --config <file>', 'config file', 'qr.config.json')
  .option('-s, --state <dir>', 'state directory', 'state')
  .option('--force', 're-run searches already recorded')
  .option('--human-confirmed', 'only findings a human marked confirmed (cheaper, avoids the search rate limit)')
  .action(async (o) => {
    const cfg = await loadConfig(o.config)
    const { store, state } = await openState(o.state)
    const only = o.humanConfirmed
      ? Object.values(state.findings).filter((f) => f.human?.status === 'confirmed').map((f) => f.fingerprint)
      : undefined
    console.error(await dedupe(cfg, state, { force: o.force, only }))
    await store.save(state)
  })

program
  .command('publish')
  .description('file confirmed findings as issues in findingsRepo (idempotent)')
  .option('-c, --config <file>', 'config file', 'qr.config.json')
  .option('-s, --state <dir>', 'state directory', 'state')
  .option('--dry-run')
  .action(async (o) => {
    const cfg = await loadConfig(o.config)
    const { store, state } = await openState(o.state)
    console.log((await publish(cfg, state, { dryRun: Boolean(o.dryRun) })).join('\n'))
    await store.save(state)
  })

await program.parseAsync()
