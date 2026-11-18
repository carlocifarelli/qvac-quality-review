import { readFile } from 'node:fs/promises'
import type { z } from 'zod'
import { join } from 'node:path'
import type { Config } from '../config.js'
import { type AgentCall, runAgent } from '../backends/claude-cli.js'
import { runOpenAi } from '../backends/openai-compatible.js'

/** One agent call through the configured backend. `file` is inlined for backends without strong tool use. */
function ask<T>(cfg: Config, call: AgentCall<T>, usage: Usage, file?: string): Promise<T> {
  if (cfg.backend === 'openai-compatible') {
    return runOpenAi(call, { baseUrl: cfg.openaiBaseUrl, apiKey: process.env.QR_OPENAI_API_KEY, maxToolCalls: cfg.openaiMaxToolCalls, inlineFile: file }, usage)
  }
  return runAgent(call, usage)
}
import { PROMPT_VERSION, reviewPrompt, verifyPrompt } from '../prompts.js'
import { fingerprint, type State, type Store } from '../state.js'
import { ReviewOut, VerdictOut, type Finding, type ReviewUnit, type Usage } from '../types.js'
import { normalizeLine, pool, sha256 } from '../util.js'

/**
 * AI review of the top units. Cached by (prompt version, model, file content):
 * an unchanged file is never re-reviewed, so repeated runs only pay for files
 * that changed or entered the top-N.
 */
export async function review(root: string, units: ReviewUnit[], cfg: Config, store: Store, state: State, commit: string, usage: Usage) {
  let added = 0
  const failures: string[] = []
  await pool(units, cfg.concurrency, async (u) => {
    const key = 'review-' + sha256(`${PROMPT_VERSION}\n${cfg.reviewModel}\n${u.file}\n${u.contentHash}`).slice(0, 24)
    let out = await store.cacheGet<z.infer<typeof ReviewOut>>(key)
    if (out) usage.cached++
    else {
      try {
        out = await ask(cfg, { cwd: root, model: cfg.reviewModel, prompt: reviewPrompt(u, u.loc > cfg.maxLoc, Object.values(state.findings).filter((f) => f.file === u.file && f.presence !== 'gone')), schema: ReviewOut }, usage, u.file)
        await store.cachePut(key, out)
      } catch (err) {
        failures.push(`${u.file}: ${(err as Error).message.slice(0, 200)}`)
        return
      }
    }
    const lines = (await readFile(join(root, u.file), 'utf8')).split('\n')
    for (const c of out.findings) {
      // Trust but check: the anchor must exist in the file, else the agent misquoted.
      const want = normalizeLine(c.anchor)
      let line = c.line
      if (normalizeLine(lines[line - 1] ?? '') !== want) {
        const idx = lines.findIndex((l) => normalizeLine(l) === want)
        if (idx < 0) { failures.push(`${u.file}: anchor not found for "${c.title}"`); continue }
        line = idx + 1
      }
      const fp = fingerprint(u.file, c.anchor)
      if (state.findings[fp]) continue
      state.findings[fp] = { ...c, line, file: u.file, fingerprint: fp, status: 'candidate', firstSeenCommit: commit, lastSeenCommit: commit, presence: 'present', churn: u.churn, score: 0 }
      added++
    }
  })
  return { added, failures }
}

/** Adversarial second pass on every unverified candidate. */
export async function verify(root: string, cfg: Config, store: Store, state: State, usage: Usage) {
  const todo = Object.values(state.findings).filter((f) => !f.verdict && f.presence !== 'gone')
  const failures: string[] = []
  await pool(todo, cfg.concurrency, async (f: Finding) => {
    const key = 'verify-' + sha256(`${PROMPT_VERSION}\n${cfg.verifyModel}\n${f.fingerprint}`).slice(0, 24)
    let v = await store.cacheGet<VerdictOut>(key)
    if (v) usage.cached++
    else {
      try {
        v = await ask(cfg, { cwd: root, model: cfg.verifyModel, prompt: verifyPrompt(f), schema: VerdictOut }, usage, f.file)
        await store.cachePut(key, v)
      } catch (err) {
        failures.push(`${f.fingerprint}: ${(err as Error).message.slice(0, 200)}`)
        return
      }
    }
    f.verdict = v
  })
  return { verified: todo.length - failures.length, failures }
}
