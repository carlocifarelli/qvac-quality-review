import type { ReviewUnit, Finding } from './types.js'

/** Bump when a prompt changes: it is part of the cache key, so old answers are not reused. */
export const PROMPT_VERSION = 'v1'

export function reviewPrompt(u: ReviewUnit, partial: boolean): string {
  const lint = Object.entries(u.lint).map(([r, ls]) => `${r} at lines ${ls.join(', ')}`).join('; ') || 'none'
  return `You are reviewing one file of the QVAC monorepo (Tether's local-AI SDK, JS/TS, runs on Node and Bare) for defects worth a maintainer's time.

File: ${u.file} (${u.loc} lines of code${partial ? '; large file: focus on the riskiest functions' : ''})
Deterministic signals: ${JSON.stringify(u.signals)}; correctness lint: ${lint}

Read the file. Open callers, types, tests and sibling files when a finding depends on them; do not guess what other code does.

Report at most 5 findings, only ones where you can name a concrete trigger and a concrete consequence:
- wrong results, crashes, hangs, unhandled rejections, leaked resources (handles, listeners, timers, temp files)
- races, lost updates, cancellation/abort not propagated, cleanup not run on error paths
- security: injection, path traversal, SSRF, auth/authorization gaps, secrets in logs, unsafe deserialization
- error handling that hides failures from callers, or API behaviour contradicting its docs/types
Do NOT report style, naming, formatting, file/function length, complexity, missing comments, "consider adding tests", or hypothetical misuse by the caller that the types already forbid. Those are tracked elsewhere.
If an existing test or comment shows the behaviour is intentional, it is not a finding.
Prefer an empty list to a weak finding. "anchor" must be the exact text of the primary line.`
}

export function verifyPrompt(f: Finding): string {
  return `A reviewer claims a defect in the QVAC repository. Your job is to try to DISPROVE it. Read the code yourself; do not trust the claim.

File: ${f.file}:${f.line}
Claim: ${f.title}
Category/severity: ${f.category}/${f.severity}
Evidence given: ${f.evidence}
Claimed impact: ${f.impact}

Check: is the triggering path reachable from a public entry point or realistic input? Is it already guarded elsewhere (caller, schema validation, wrapper, finally block)? Do tests or comments show it is intentional? Is the impact overstated?
Verdict "confirmed" only if the defect survives these checks; "rejected" if any check defeats it; "uncertain" if it depends on runtime behaviour you cannot see. Re-rate severity. Give 2-4 short search phrases a maintainer would use in an issue title for this problem.`
}
