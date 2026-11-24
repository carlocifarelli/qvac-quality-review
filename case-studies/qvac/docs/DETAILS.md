# QVAC case study: full notes

The [case study README](../README.md) is the short version, and the tool's general design is in [docs/design.md](../../../docs/design.md). This file is the lab notebook of the QVAC run: design notes as they were written then, measurements and demos. Paths like `src/` and `.github/` are at the repository root; `results/`, `state/`, `demo/` and `verification/` are in this case study's folder. The rule plugin was called `qvac-quality` at the time; it is now `async-hygiene`.

## The problem as I framed it

QVAC already runs its own quality tooling (`scripts/code-quality`: size/structure/dependency detectors, a 1.1 MB accepted baseline, hotspot triage) and lints with `lunte` + `prettier`. A correctness-focused ESLint pass over the whole scope found almost nothing actionable (68 hits over 1,013 files: 46 empty blocks, 20 promise-executor returns, 2 loop conditions, none of them a defect on inspection; a type-aware pass over four packages added 36 hits, mostly `return-await` style; see [Design choices](#design-choices-and-alternatives)). So more metrics are not what this codebase is missing. What is missing is a cheap way to find **behavioural defects** (wrong results, leaks, races, contract violations, security gaps) that linters cannot see, and to keep the list honest over time.

The design follows from that:

1. **Spend deterministic effort on *where* to look, and model effort on *what is wrong*.**
2. **Never trust a single model pass.** Every candidate gets an adversarial second pass, and the top findings get a human-run reproduction.
3. **State, not reports.** Findings have stable identities, so a re-run tells you what is new, what persists and what was fixed, and never re-pays for unchanged code.
4. **The agent discovers, deterministic rules prevent.** Running a model on every commit is too expensive to be the long-term answer. Each confirmed defect class that has a syntactic shape becomes an ESLint rule; the rules run on every file in seconds for free and gate PRs, and the agent's budget goes to finding the next class.

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
| 1 (first run) | `0c8a151` | 86 (40 reviews + 46 verifications) | $27.47 | ~10 min (5 parallel agents; 49 min of agent time) | 47 candidates. After human review of all 47: **31 confirmed** (issues #1-#31), **16 rejected** |
| 2 (same commit) | `0c8a151` | **0** (40 cache hits) | **$0.00** | 12 s | identical findings; nothing re-reviewed |
| 3 (simulated next commit) | `0c8a151` + a local commit that fixes finding #9 in one file | **2** (39 cache hits) | **$0.64** | 87 s | the fixed finding moved to **"No longer present"**; only the changed file was re-reviewed and re-verified |

Run 3 also exposed a defect in my own design, which I fixed and kept here as evidence: the re-review of the changed file found the *other* known finding in that file again, and classified it `correctness` instead of `concurrency`. Category was part of the v1 fingerprint, so it became a duplicate. The fix (v2): the fingerprint is `file + anchor` only, and the reviewer prompt now lists the findings already recorded for that file so it does not re-report them. A one-off migration script (in the git history) migrated the state and the human overrides.

## Deterministic rules: the agent discovers, the rules prevent (demonstrated)

After every candidate had a human decision, I looked for confirmed findings whose defect has a *shape* a parser can see, and wrote a local ESLint plugin, `qvac-quality` ([`src/rules/`](../../../src/rules/)), with one rule per class. Each rule's header names the findings it generalises; [`test/rules.test.ts`](../../../test/rules.test.ts) runs ESLint's `RuleTester` on reduced copies of those findings (invalid cases) and on the correct patterns QVAC already uses elsewhere (valid cases).

| Rule | Generalises | What it flags |
|---|---|---|
| `abort-signal-race` | #11, #16 | an `'abort'` listener added after an await without re-checking `signal.aborted`; a signal handed to a same-file function that never checks it, when the caller checked only before an await |
| `close-on-error` | #22 | a Corestore/Hyperdrive/Hyperswarm/… created locally, then an await that can throw before the resource is handed off or closed in catch/finally |
| `exit-code-ignores-signal` | #8 | `process.exit(code \|\| 0)` in a child's `exit`/`close` handler that ignores `signal` |
| `spawn-without-error-listener` | #31 | `spawn`/`fork` whose child gets no `'error'` listener (nor is returned or handed off) |
| `stale-error-reject` | #29 | `server.on('error', reject)` in a listen/connect promise, never removed |
| `throw-in-promise-listener` | #6 | `*Sync` calls, `JSON.parse` or `throw` inside an event listener registered in a `new Promise` executor, outside a try |

**Result on the analysed commit** ([`results/RULES.md`](../results/RULES.md), triage in [`state/rules-baseline.json`](../state/rules-baseline.json)): 1,013 files in about 9 s, no model calls, 22 hits.

- **Recall on the source findings:** all 9 code locations of the 7 findings above are flagged.
- **13 hits beyond those 9**, each triaged by me:
  - 1 **new finding** the agent had not reported: [#32](https://github.com/carlocifarelli/agentic-code-review/issues/32). The fit-stub fetch ignores a signal that is already aborted, so a cancelled load waits up to 40 s.
  - 2 are the caller side of #11 and #16.
  - 8 have the pattern but are not worth fixing, each with its reason (bounded at 250 ms, guarded by a `which`, diagnostic CLI, test-only broker).
  - 2 are false positives. Both involve a check that lives in a caller the rule does not follow.
- **Precision:** 20 of 22 hits are true instances of the pattern (91%). 13 of 22 are bugs tracked as issues.

**Gate.** `qr rules` exits 1 when a hit is not in `state/rules-baseline.json`. Each baseline entry records status (`finding`, `accepted`, `false-positive`), reason and date, keyed by rule + file + message + normalised line text, so it survives line shifts. Two runs are recorded in [`demo/rules/`](../demo/rules/):

| Run | Target | Result |
|---|---|---|
| fixed | the simulated next commit that fixes #8 in one file | 21 hits, 0 untriaged, exit 0: the fixed instance simply disappears |
| regression | a local commit adding a helper that repeats the #31 pattern, `--changed HEAD~1` | 1 file, 95 ms, 1 untriaged hit, exit 1, pointing at the new line |

The rules also feed the selection stage: their hits count as lint signals, so files with known bug shapes are reviewed first.

**What rules cannot replace.** 7 of the 32 findings became rules. The rest are semantic: a schema missing keys that another table defines (#1), docs contradicting code (#7), a lost update across an RPC (#3), a wrong field in a message (#19). These are exactly what the agent pass is for. The intended loop is: the agent finds a new class, a human confirms it, and if it has a shape it becomes a rule with the finding as its test case.

## When it runs: the workflow (systematic)

A one-off review finds bugs once. To keep finding and preventing them, each part runs at the point where it is cheapest and still useful, and a person decides at one fixed place.

| When | What runs | Cost | Effect | Where |
|---|---|---|---|---|
| **Every pull request** in the target repo | `qr pr`: rules on the changed files; agent review + verify on the riskiest changed files (at most `prMaxFiles`, default 10) | rules: seconds, $0. Agent: ~1 min and ~$0.5-1 per file | Rule hits not in the baseline **block** the PR. Agent leads are **advisory**, in one sticky comment. Known findings fixed by the PR are reported. | [`qvac-pr-check.yml`](../qvac-pr-check.yml) (proposed for QVAC) |
| **Weekly** (Mon 05:00 UTC) and on demand, on target `main` | rules on the whole scope; full `qr run` on the top-risk files (cache: unchanged files cost $0); report | ~10 s rules; agent ~$3-6 a week in steady state | Opens a **triage PR** in this repo with the new state and reports | [`.github/workflows/scheduled-scan.yml`](../../../.github/workflows/scheduled-scan.yml) |
| **Triage PR merged** (a person edited `state/overrides.json` / `state/rules-baseline.json` in it) | `dedupe --human-confirmed`, `publish` | GitHub API only | Confirmed findings become issues, with the duplicate searches logged | [`.github/workflows/publish.yml`](../../../.github/workflows/publish.yml) |
| **When a confirmed finding has a syntactic shape** | a person (or the agent, reviewed) adds a rule in `src/rules/` with the finding as its RuleTester case | one PR | The class is blocked on every future PR at no cost | `src/rules/`, `test/rules.test.ts` |
| Every change to this tool | typecheck, unit tests, RuleTester | free | | [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml) |

Why this split:
- **Deterministic checks block.** They are repeatable and cheap, and each hit has an id that can be accepted with a reason.
- **The agent never blocks.** It is non-deterministic and its "confirmed" is a lead, not a fact (see Limitations). It informs the reviewer on the PR and feeds the weekly triage.
- **People decide in one place.** That place is a pull request on `state/`, so every decision is reviewed, versioned and replayed on later runs.
- **The cost goes down over time.** Each class that becomes a rule moves from the paid, advisory path to the free, blocking one.

**Demonstrated:** `qr pr` on a simulated PR in [`demo/pr/`](../demo/pr/). The PR has two local commits: one fixes a site of #8, the other adds a helper that repeats #31.
- The rule blocked the helper.
- The agent and the verifier independently flagged the same helper (4 calls, $0.88, 63 s).
- #8 was reported as probably fixed, and the known open findings in the touched files were listed.

The gate on a fix and on a regression is in [`demo/rules/`](../demo/rules/).

**Running in GitHub Actions** (this repo, 2026-11-18): `ci` is green. `scheduled-scan` ran on today's QVAC main, `ad66549a2775`, one commit after the analysed one.
- Rules: 1,013 files in 13 s, 22 hits, 0 untriaged.
- No agent stage, because no API key is configured.
- Presence: all 47 findings are still present.
- Result: "nothing to triage", [run 44277366964](https://github.com/carlocifarelli/agentic-code-review/actions/runs/44277366964).

The first run had shown two problems, both fixed:
- It treated a `lastSeenCommit` bump as something to triage. Now only new leads, disappeared or reappeared findings, or untriaged rule hits open a triage PR (`scripts/triage-needed.mjs`).
- The repository does not allow Actions to create pull requests. The workflow now falls back to an issue.

The QVAC PR workflow is proposed only: installing it upstream is the maintainers' call.

## Running on QVAC itself: a local model, no code leaves the machine (demonstrated, measured with two models)

The review and verify stages can run on any OpenAI-compatible endpoint instead of Claude (`backend: "openai-compatible"`, `src/backends/openai-compatible.ts`). It is built for `qvac serve --openai`, QVAC's own local server, so the model runs on the reviewer's machine and the source code never leaves it.

```bash
# 1. serve a local model with QVAC (config in local/qvac.config.json: Qwen3-4B, preloaded)
cd case-studies/qvac/local && npx @qvac/cli serve --openai --no-default
# 2. review with it (concurrency 1, reviewTop 10; cost $0)
npx tsx src/cli.ts -w case-studies/qvac run ../qvac -c case-studies/qvac/qr.local.config.json -s state-local --only <files>
```

How it works, since QVAC (like OpenAI) does not combine `tools` and `response_format` in one request:
1. **Exploration:** the model may call two read-only tools, `read_file` and `grep` (via `git grep`), up to `openaiMaxToolCalls` (6). Paths are confined to the checkout.
2. **Answer:** one more request with no tools and a JSON-schema `response_format`, validated with the same zod schema as the Claude backend, so selection, fingerprints, verify, report and publish are unchanged.

Local models are small, so the file under review is inlined (line-numbered) in the first message: the review still works when the model never calls a tool. The backend is covered by a test against a stub server (`test/openai-backend.test.ts`).

**Measured** on an M4 Max (64 GB), on the 19 files that hold the 31 human-confirmed findings, at the same commit, with two local models served by `qvac serve`: Qwen3-4B (`results/local-qvac/`) and KAT-Coder-V2.5-Dev, a 35B MoE coding model from QVAC's catalog (`results/local-qvac-kat-coder-35b/`; weights fetched from Hugging Face at the commit QVAC's catalog pins, sha256 checked, because the P2P download ran at 250 KB/s).

| | Claude backend | QVAC, Qwen3-4B | QVAC, KAT-Coder 35B MoE |
|---|---|---|---|
| Confirmed findings recalled | 31/31 (they are its findings) | 0/31 strict, 2 partial | 1/31 strict (signal-killed runner reported as exit 0), 3 partial |
| Candidates | 47 on 40 files | 21 on 7 files: 1 new plausible, 1 duplicate, 19 noise | 15 on 4 files: 1 new plausible (unhandled `swarm.flush()` rejection in `profiler.js`), 10 wrong or noise |
| Verifier | lenient (see Limitations) | rejected all 21, including the real one | rejected all 14 it judged, including the true match |
| Failures | none | none (after the two fixes below) | 1 file (`managed/index.ts`, 3 findings): the final answer spent the whole token budget on reasoning, also at 8k and 16k |
| Time / cost | run 1: 40 files, $27.47 (code sent to Anthropic) | 29.5 min, 96 calls, $0 | 27 min, 96 calls, $0 |

The pipeline runs end to end on QVAC with no code leaving the machine, but neither local model finds the defects this tool is for (the 35B model reads the code much better than the 4B one, but recalls 1 of 31): they need following the code across functions and files, and the model mostly reports generic "possible leak/race" patterns. So today the local backend is a privacy-preserving plumbing option, not a replacement; on private code the deterministic rules carry the gate and the next lever is disabling reasoning in the final JSON call and trying a dense model, not just a bigger one. The runs also found integration bugs, now fixed (`openaiMaxTokens` is configurable): QVAC rejects tool calls unless the model is loaded with `tools: true` (and needs a larger context for inlined files), and without `max_tokens` one runaway generation blocked QVAC's single-slot server until requests timed out.

## Scope and verification

- **Repository:** `tetherto/qvac` at the commit above, cloned fresh; `pnpm install --ignore-scripts` (no native builds needed for anything below).
- **Scope (config `qr.config.json`):** `packages/*/src/**/*.{ts,tsx,js,mjs,cjs}` plus the registry server's `lib/`, `utils/`, `shared/`, `client/lib/`, `client/bin/` and `index.js`. Excluded: tests, examples, e2e, benchmarks, fixtures, generated code, `.d.ts`, files under 40 lines of code. Result: **1,013 files in scope, 681 above the size floor, top 40 reviewed** (list and signals in `results/selection.json`).
- **Not in scope:** C++ addons, the Kotlin SDK, docs site, CI scripts. JS/TS only.
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
| Issues in a repo I control as the destination | Gives IDs, discussion and labels without touching upstream | Markdown only (no IDs/discussion) |
| Correctness lint as a finding source | Kept as a cheap selection signal only: on this codebase it produced noise, not defects | Type-aware ESLint everywhere (needs every package built; 36 hits on four packages, none actionable) |
| Human reproduction for top findings | A running repro is the strongest evidence | Trusting agent confidence |

### Ease of use
One command per stage; config in one JSON file with defaults; `--select-only` for a free dry run; reports are plain Markdown. Another engineer needs Node, git and a Claude Code login.

### Cost
- **Observed:** $27.47 for the first full run (40 files reviewed, 46 candidates verified, Opus), about $0.35 per review and $0.30 per verification on average. Re-run on an unchanged commit: $0. Re-run after a one-file change: $0.64.
- **Estimated for routine use:** a weekly run on `main` touches ~5-10 of the top-40 files, so roughly $3-6 per run. A PR-scoped run (changed files only) would cost cents to ~$2.
- **Levers:** `reviewTop`, Sonnet for review with Opus only for verification (est. ~60% cheaper; not measured), concurrency (wall time only).
- **Services:** Anthropic (via Claude Code) for the agent stages, GitHub API for dedupe/publish. No servers, no database.

### Security
- The agent cannot write, execute or browse: tool allow-list plus deny-list, and it runs in a checkout, not a dev machine's home.
- Source code is sent to the model provider (Anthropic). For a private codebase that is a policy decision; the backend is isolated in `src/backends/`, and the `openai-compatible` backend runs the same pipeline on a local model through `qvac serve` (see above).
- Untrusted repository content reaches the prompt (prompt-injection surface). Mitigations: read-only tools, schema-validated output, anchors re-checked against the file, a second independent pass, and a human gate before anything is filed.
- No credentials in the repo or the state: GitHub access goes through the operator's own `gh` login, and `publish` refuses to file into the upstream repo.
- Sensitive findings: `publish` files into a repo the operator controls; nothing is sent upstream automatically.

### Maintainability
~1,500 lines of TypeScript (about 500 of them the rules), strict mode, zod at every boundary, unit tests for fingerprinting, presence tracking, ranking and signals, and RuleTester cases for every rule (`npm test`, 56 tests at the time). Prompts are versioned (`PROMPT_VERSION`) and part of the cache key. State format changes ship with a migration script (the v2 one is in the git history). Each stage is one file with one exported function, so a stage can be replaced (e.g. another backend in `src/backends/`) without touching the others.

## Limitations (honest)

- **Recall is unknown.** Only 40 of 681 candidate files were reviewed, and there is no labelled set of known QVAC bugs to measure what the reviewer misses. Selection is a heuristic.
- **The agent verifier is lenient.** Of 47 candidates it confirmed 39, rejected 7 and left 1 uncertain. Human review then rejected 8 of its 39 confirmations (two as already known upstream, the rest below the bar) and downgraded several; conversely the verifier rejected candidates I would have filed, and overturned one of my rejections (both times it was right). Agent "confirmed" is a lead, not a fact; that is why filing requires a human decision.
- **Severity is coarse** (four levels) and set by the model, then the verifier; the ranking formula is intentionally simple and has not been calibrated against maintainers' priorities.
- **Single-file units.** Bugs that only appear across several files are found only if the agent follows the references on its own.
- **Non-determinism.** Two reviews of the same file can word or classify a finding differently; fingerprints are anchored to code to absorb this, and the cache makes a given commit reproducible, but a cache-cold re-run can surface a slightly different set.
- **Runtime-only findings** (lost updates in the registry, hyperdrive store collisions) were verified by reading, not executed; they need a HyperDB/Hyperdrive fixture.
- **Prompt injection** from repository content is mitigated (read-only tools, schema, anchors, second pass, human gate), not eliminated.
- **Rules are intra-file.** `abort-signal-race` follows checks into same-file callees only; both false positives are checks that live in a caller. `close-on-error` knows a fixed list of resource classes (configurable). The rules were written after seeing these findings, so their recall on *unseen* bugs is unmeasured: the 1 new finding and 8 same-shape instances are the only evidence so far.
- **Workflow costs are partly estimates.** The PR check cost is measured on one simulated PR ($0.88 for 2 files); the weekly figure is extrapolated from runs 1-4, not measured over weeks. The PR agent sees changed files, not their callers.
- **The local backend is weak today.** Through QVAC, Qwen3-4B recalled 0 and KAT-Coder 35B MoE 1 of the 31 confirmed findings, and both verifiers rejected everything, true matches included. A larger model helps only a little on this set.
- **Dedupe is keyword search.** It cannot prove absence; it records what was searched so a reader can judge.

## Next priorities (proposed, not built)

1. **Install the PR workflow in QVAC** (with the maintainers' agreement) and extend `qr pr` to also review the direct callers of changed functions, which is where several of these bugs lived (the caller side of #11 and #16).
2. **Evaluation set:** seed known bugs (from QVAC's closed `fix:` PRs, reverting the fix) to measure reviewer recall and verifier precision per model and prompt version; this is how prompt changes should be judged.
3. **Group by root cause:** several findings share one fix (e.g. the three `process.exit(code || 0)` sites); cluster them before ranking.
4. **Reproduction scaffolding:** let the agent draft the repro test in the package's own runner (brittle/Bare), with a human reviewing and running it.
5. **Local model tuning:** disable reasoning in the final JSON call (it made KAT-Coder fail one file), try a dense model, and give the local reviewer the rule hits as hints; measure each change on the same 31 findings.
6. **Feed QVAC's own `quality:audit` hotspots** into selection instead of my churn heuristic.
7. **Upstream the rules:** propose the six rules to QVAC as a lint preset next to `lunte` (after the maintainers agree the classes are worth enforcing), and add a rule whenever a newly confirmed finding has a syntactic shape. Candidates already visible: `.part`-file cleanup keyed on `instanceof` instead of `signal.aborted` (#4), pid-file ownership (#10, #30).

## Demonstrated vs proposed

- **Demonstrated** (ran, outputs committed): selection, review, verify, report, presence tracking across commits, cache reuse, dedupe with logged searches, idempotent publish to this repo's issues, the fingerprint migration, all reproductions in `verification/`, the `qvac-quality` rules with their baseline gate on a fix and on a regression, including the PR-scoped `--changed` mode for the rules, and `qr pr` on a simulated pull request (rules + agent + presence, PR comment in `demo/pr/`).
- **Not demonstrated:** `--typed-lint` on the full scope (ran only exploratorily on four packages), the agent stage inside Actions (needs an `ANTHROPIC_API_KEY` secret), `publish.yml` in Actions (no triage PR has been merged yet), the QVAC PR workflow (not installed upstream), and a local model that matches Claude. The QVAC local backend is demonstrated with two models (Qwen3-4B and KAT-Coder 35B MoE, measured in `results/local-qvac*/`). Everything under "Next priorities" is proposed only.

## Time spent

Built in one day: about 5 hours from the task to the first complete version, then the rest of the day for the parts below. Timestamps in `state/findings.json` (`runs`), `results/run-log.json` and the duplicate-search log are in UTC. The agent stages ran in parallel (49 minutes of agent time in about 10 minutes of wall-clock time).

- **Triage completed (same day):** human decision on all remaining 24 agent leads (18 confirmed, 6 rejected; one of the rejections came from the duplicate search, because PR #4379 documents the behaviour), 2 new executed reproductions, 188 more duplicate searches, 18 more issues filed (#14-#31).
- **Deterministic rules (same day):** the `qvac-quality` ESLint plugin (6 rules, 42 RuleTester cases), the `qr rules` command with its triaged baseline and gate, a run over all 1,013 files with every hit triaged, one new finding filed (#32), and the fix and regression demos.
- **Workflow (same day):** `qr pr` (rules blocking, agent advisory on changed files, fixed/open findings, PR comment), `prMaxFiles` cap, the simulated PR demo ($0.88), and four workflow files: tool CI, weekly scan with triage PR, publish on merge, and the proposed PR check for QVAC.
- **QVAC local backend (same day):** the `openai-compatible` backend for `qvac serve`, and two measured runs on a workstation against the 31 confirmed findings (Qwen3-4B and KAT-Coder 35B MoE, about 30 minutes each, mostly unattended).
