# qvac-quality-review

A repeatable pipeline that finds, verifies and ranks **defects worth fixing** in a JS/TS repository, applied to [tetherto/qvac](https://github.com/tetherto/qvac).

- **Results:** [`results/FINDINGS.md`](results/FINDINGS.md) (generated) and the curated summary in [`FINDINGS-SUMMARY.md`](FINDINGS-SUMMARY.md)
- **Tracked findings:** issues in this repository, labelled `qvac-finding` (IDs listed in the summary)
- **Analyzed:** `tetherto/qvac@0c8a1510ab4fe89893de174b07eb4901a2f3e9fd` (main, 2026-11-18 12:13 +05:30, "infra[notask]: build consumer releases against the released @qvac/fabric (#5805)")`, scope below
- **Time spent:** see [Time spent](#time-spent) (budget 8 h, started 09:07 CET)

## TL;DR

```
npm ci
npx tsx src/cli.ts run /path/to/qvac            # select -> AI review -> adversarial verify -> results/FINDINGS.md
npx tsx src/cli.ts run /path/to/qvac --select-only   # deterministic stage only, no LLM, ~10 s
npx tsx src/cli.ts dedupe --human-confirmed     # search upstream issues + PRs (open/closed), log queries with dates
npx tsx src/cli.ts publish --dry-run             # then without --dry-run: file human-confirmed findings here (idempotent)
npx tsx src/cli.ts report /path/to/qvac         # re-render after editing state/overrides.json
npm test
```

Requirements: Node 22+, git, the [Claude Code CLI](https://docs.claude.com/en/docs/claude-code) logged in (or `ANTHROPIC_API_KEY` set for it), and the GitHub CLI `gh` logged in for `dedupe` and `publish` only. The target needs no build; the Bare reproductions need `pnpm install --ignore-scripts` in it.

Workflow for a person: `run` → read `results/FINDINGS.md` → reproduce or read the top leads → record decisions in `state/overrides.json` → `report` → `dedupe --human-confirmed` → `publish`. Commit `state/` so the next run starts from these decisions.

## The problem as I framed it

QVAC already runs its own quality tooling (`scripts/code-quality`: size/structure/dependency detectors, a 1.1 MB accepted baseline, hotspot triage) and lints with `lunte` + `prettier`. A correctness-focused ESLint pass over the whole scope found almost nothing actionable (68 hits over 1,013 files: 46 empty blocks, 20 promise-executor returns, 2 loop conditions, none of them a defect on inspection; a type-aware pass over four packages added 36 hits, mostly `return-await` style; see [Design choices](#design-choices-and-alternatives)). So more metrics are not what this codebase is missing. What is missing is a cheap way to find **behavioural defects** (wrong results, leaks, races, contract violations, security gaps) that linters cannot see, and to keep the list honest over time.

The design follows from that:

1. **Spend deterministic effort on *where* to look, and model effort on *what is wrong*.**
2. **Never trust a single model pass.** Every candidate gets an adversarial second pass, and the top findings get a human-run reproduction.
3. **State, not reports.** Findings have stable identities, so a re-run tells you what is new, what persists and what was fixed, and never re-pays for unchanged code.

## Pipeline

```
 git checkout ──► select (deterministic, ~10 s, free)
                   scope globs → per-file risk signals + churn + correctness lint
                   → ranked review units (results/selection.json)
                          │ top N
                          ▼
                  review (AI agent, read-only, cached by file hash)
                   reads the file + callers/types/tests it needs
                   → ≤5 candidates per file, schema-validated, anchors checked
                          │
                          ▼
                  verify (AI agent, adversarial, cached by fingerprint)
                   tries to disprove each candidate → confirmed / rejected / uncertain
                          │
                          ▼
                  human gate: reproduction scripts (verification/), overrides.json
                          │
                          ▼
         report (results/FINDINGS.md) ─► dedupe (GitHub search, logged) ─► publish (issues here)
```

| Stage | Code | Deterministic? | Cost |
|---|---|---|---|
| select | `src/stages/select.ts`, `signals.ts`, `lint.ts` | yes | free |
| review | `src/stages/review.ts`, `src/prompts.ts`, `src/backends/claude-cli.ts` | no (cached) | see Costs |
| verify | same | no (cached) | see Costs |
| state / ranking | `src/state.ts` | yes | free |
| report | `src/report.ts` | yes | free |
| dedupe / publish | `src/stages/dedupe.ts`, `publish.ts` | yes | GitHub API |

### Selection (why these files)

Each in-scope file gets a priority from risk-surface patterns (`child_process`, filesystem writes, network, parsing untrusted input, crypto/checksums, timers, listeners, `new Promise`, streams), weighted by density rather than raw count, multiplied by log size and by recent churn, plus correctness-lint hits. Rationale: defects that matter cluster where code touches the outside world, and a finding in code that is changing is cheapest to act on. Weights are config (`signalWeights`), and `results/selection.json` records every unit's signals so the choice is auditable.

### Review and verification

The reviewer is Claude Code in headless mode (`claude -p`) running **inside the target checkout with only Read/Grep/Glob allowed** (Bash, Edit, Write, Web are denied). Using an agent rather than a single prompt matters: most real findings here depend on a caller, a schema or a library internals two files away, and the agent can open them. Output is constrained by a JSON Schema generated from zod and validated again on our side; a candidate whose quoted anchor line is not in the file is dropped as a misquote.

The verifier gets the claim, not the reviewer's conversation, and is told to disprove it: is the path reachable, is it guarded elsewhere, is it intended (tests/comments), is the impact overstated. It re-rates severity and proposes search phrases for duplicate detection.

### Identity across runs

`fingerprint = sha256(file, whitespace-normalized anchor line)` (scheme `qr2`). Line numbers are not part of it, so findings survive unrelated edits; the model's category is not part of it either, because re-reviews classify the same defect differently (see run 3 below). When a changed file is re-reviewed, the prompt lists the findings already recorded for it, so the reviewer does not re-report them. On every run `refreshPresence` re-locates each known finding: **present**, **moved** (line updated) or **gone** (anchor no longer in the file: fixed or rewritten). Review results are cached by `(prompt version, model, file path, content hash)`, so a second run on an unchanged commit makes zero model calls, and on a new commit only changed files in the top N are reviewed. Human decisions in `state/overrides.json` always win over agent verdicts and are re-applied on every run. **Only human-confirmed findings are filed as issues**; agent-confirmed ones are reported as leads.

### Ranking

`score = severity (verified) × confidence × status (confirmed 1, uncertain .5, unverified .3, rejected 0) × (1 + log2(1 + churn)/4)`. Deliberately simple and explainable; churn only nudges.

## What happens on subsequent runs (demonstrated)

Both runs below are recorded in `demo/` (state and reports), so they can be inspected without re-running.

| Run | Target | Agent calls | Cost | Wall time | Result |
|---|---|---|---|---|---|
| 1 (submission) | `0c8a151` | 86 (40 reviews + 46 verifications) | $27.47 | ~10 min (5 parallel agents; 49 min of agent time) | 47 candidates. After human review of all 47: **31 confirmed** (issues #1-#31), **16 rejected** |
| 2 (same commit) | `0c8a151` | **0** (40 cache hits) | **$0.00** | 12 s | identical findings; nothing re-reviewed |
| 3 (simulated next commit) | `0c8a151` + a local commit that fixes finding #9 in one file | **2** (39 cache hits) | **$0.64** | 87 s | the fixed finding moved to **"No longer present"**; only the changed file was re-reviewed and re-verified |

Run 3 also exposed a defect in my own design, which I fixed and kept here as evidence: the re-review of the changed file found the *other* known finding in that file again, and classified it `correctness` instead of `concurrency`. Category was part of the v1 fingerprint, so it became a duplicate. The fix (v2): the fingerprint is `file + anchor` only, and the reviewer prompt now lists the findings already recorded for that file so it does not re-report them. `scripts/migrate-fingerprints-v2.ts` migrated the state and the human overrides.

## Scope and verification for this submission

- **Repository:** `tetherto/qvac` at the commit above, cloned fresh; `pnpm install --ignore-scripts` (no native builds needed for anything below).
- **Scope (config `qr.config.json`):** `packages/*/src/**/*.{ts,tsx,js,mjs,cjs}` plus the registry server's `lib/`, `utils/`, `shared/`, `client/lib/`, `client/bin/` and `index.js`. Excluded: tests, examples, e2e, benchmarks, fixtures, generated code, `.d.ts`, files under 40 lines of code. Result: **1,013 files in scope, 681 above the size floor, top 40 reviewed** (list and signals in `results/selection.json`).
- **Not in scope:** C++ addons, the Kotlin SDK, docs site, CI scripts. JS/TS only, as the brief allows.
- **How results were verified, in three tiers:**
  1. *Agent verification* for all 47 candidates (adversarial second pass; reasoning stored per finding).
  2. *Human code reading* for every one of the 47 candidates: I read the cited paths and the callers named in the evidence, and wrote the decision and what I checked in `state/overrides.json` (31 confirmed, 16 rejected).
  3. *Executed reproductions* for 10 of the 31 confirmed findings (`verification/`, outputs in `verification/outputs.md`): three on Bare with the package's own test runner, four on Node against the real modules, three with the exact handler code copied.
- **Duplicate search:** every human-confirmed finding was searched in upstream issues and pull requests, open and closed, with the verifier's suggested phrases plus the file name. Every query and its timestamp is stored in `state/findings.json` (`duplicates`) and listed per finding in the report and the issues. Searches ran on 2026-11-18.

## Design choices and alternatives

| Choice | Why | Alternative considered |
|---|---|---|
| Model effort on behaviour, not metrics | QVAC already tracks size/structure/dependencies with an accepted baseline; correctness lint was nearly silent | Extending their detectors (more of what they have), SonarQube (heavy service, mostly style/complexity on this code) |
| Agentic reviewer (`claude -p`, read-only tools) | Findings depend on cross-file context; the agent fetches what it needs | Single-prompt API call with the file inlined: cheaper, but blind to callers and library internals; would be the backend for a local model |
| Adversarial verify pass | Cuts false positives before a human looks; cheaper than human time | Self-consistency voting (more calls, same blind spots) |
| Anchor-based fingerprints | Stable across edits, cheap, human-readable | AST-path fingerprints (more robust to edits inside the line, more code), QVAC's own `quality-v1` fingerprints (structure-only) |
| State in JSON files committed to git | Diffable, reviewable in PRs, no service | SQLite/DB (overkill), GitHub issues as the only store (rate limits, not offline) |
| Issues in a repo we control as the destination | Required by the brief, gives IDs, discussion and labels | Markdown only (no IDs/discussion) |
| Correctness lint as a finding source | Kept as a cheap selection signal only: on this codebase it produced noise, not defects | Type-aware ESLint everywhere (needs every package built; 36 hits on four packages, none actionable) |
| Human reproduction for top findings | The brief asks for evidence; a running repro is the strongest | Trusting agent confidence |

### Ease of use
One command per stage; config in one JSON file with defaults; `--select-only` for a free dry run; reports are plain Markdown. Another engineer needs Node, git and a Claude Code login.

### Cost
- **Observed:** $27.47 for the first full run (40 files reviewed, 46 candidates verified, Opus), about $0.35 per review and $0.30 per verification on average. Re-run on an unchanged commit: $0. Re-run after a one-file change: $0.64.
- **Estimated for routine use:** a weekly run on `main` touches ~5-10 of the top-40 files, so roughly $3-6 per run. A PR-scoped run (changed files only) would cost cents to ~$2.
- **Levers:** `reviewTop`, Sonnet for review with Opus only for verification (est. ~60% cheaper; not measured), concurrency (wall time only).
- **Services:** Anthropic (via Claude Code) for the agent stages, GitHub API for dedupe/publish. No servers, no database.

### Security
- The agent cannot write, execute or browse: tool allow-list plus deny-list, and it runs in a checkout, not a dev machine's home.
- Source code is sent to the model provider (Anthropic). For a private codebase that is a policy decision; the backend is isolated in `src/backends/` so a local model can replace it.
- Untrusted repository content reaches the prompt (prompt-injection surface). Mitigations: read-only tools, schema-validated output, anchors re-checked against the file, a second independent pass, and a human gate before anything is filed.
- No credentials in the repo or the state: GitHub access goes through the operator's own `gh` login, and `publish` refuses to file into the upstream repo.
- Sensitive findings: `publish` files into a private repo only; nothing is sent upstream.

### Maintainability
~900 lines of TypeScript, strict mode, zod at every boundary, unit tests for fingerprinting, presence tracking, ranking and signals (`npm test`). Prompts are versioned (`PROMPT_VERSION`) and part of the cache key. State format changes ship with a migration script (`scripts/migrate-fingerprints-v2.ts`). Each stage is one file with one exported function, so a stage can be replaced (e.g. another backend in `src/backends/`) without touching the others.

## Limitations (honest)

- **Recall is unknown.** Only 40 of 681 candidate files were reviewed, and there is no labelled set of known QVAC bugs to measure what the reviewer misses. Selection is a heuristic.
- **The agent verifier is lenient.** Of 47 candidates it confirmed 39, rejected 7 and left 1 uncertain. Human review then rejected 8 of its 39 confirmations (two as already known upstream, the rest below the bar) and downgraded several; conversely the verifier rejected candidates I would have filed, and overturned one of my rejections (both times it was right). Agent "confirmed" is a lead, not a fact; that is why filing requires a human decision.
- **Severity is coarse** (four levels) and set by the model, then the verifier; the ranking formula is intentionally simple and has not been calibrated against maintainers' priorities.
- **Single-file units.** Bugs that only appear across several files are found only if the agent follows the references on its own.
- **Non-determinism.** Two reviews of the same file can word or classify a finding differently; fingerprints are anchored to code to absorb this, and the cache makes a given commit reproducible, but a cache-cold re-run can surface a slightly different set.
- **Runtime-only findings** (lost updates in the registry, hyperdrive store collisions) were verified by reading, not executed; they need a HyperDB/Hyperdrive fixture.
- **Prompt injection** from repository content is mitigated (read-only tools, schema, anchors, second pass, human gate), not eliminated.
- **Dedupe is keyword search.** It cannot prove absence; it records what was searched so a reader can judge.

## Next priorities (proposed, not built)

1. **PR mode:** review only files changed in a PR plus their direct callers, post the human-confirmed delta as a comment. Cheapest high-value use; the cache and fingerprints already support it.
2. **Evaluation set:** seed known bugs (from QVAC's closed `fix:` PRs, reverting the fix) to measure reviewer recall and verifier precision per model and prompt version; this is how prompt changes should be judged.
3. **Group by root cause:** several findings share one fix (e.g. the three `process.exit(code || 0)` sites); cluster them before ranking.
4. **Reproduction scaffolding:** let the agent draft the repro test in the package's own runner (brittle/Bare), with a human reviewing and running it.
5. **Local model backend** (e.g. through QVAC itself) for code that must not leave the machine.
6. **Feed QVAC's own `quality:audit` hotspots** into selection instead of my churn heuristic.

## Demonstrated vs proposed

- **Demonstrated** (ran, outputs committed): selection, review, verify, report, presence tracking across commits, cache reuse, dedupe with logged searches, idempotent publish to this repo's issues, the fingerprint migration, all reproductions in `verification/`.
- **Not demonstrated:** `--typed-lint` on the full scope (ran only exploratorily on four packages), a PR-scoped mode, any CI integration, a non-Claude backend. Everything under "Next priorities" is proposed only.

## AI use

See [AI_USAGE.md](AI_USAGE.md).

## Time spent

Assessment received 09:07 CET on 2026-11-18; first complete version pushed at about 09:45 CET. Timestamps in `state/findings.json` (`runs`), `results/run-log.json` and the duplicate-search log are in UTC and back this up. The agent stages ran in parallel (49 minutes of agent time in about 10 minutes of wall-clock time), which is why the elapsed time is short. Further work, if any, is logged below.

- **Assessment completed (same day):** human decision on all remaining 24 agent leads (18 confirmed, 6 rejected; one of the rejections came from the duplicate search, because PR #4379 documents the behaviour), 2 new executed reproductions, 188 more duplicate searches, 18 more issues filed (#14-#31).
