# Design

The ideas behind `qr`, independent of any one target. The QVAC case study's [full notes](../case-studies/qvac/docs/DETAILS.md) show them applied, with measurements.

## Principles

1. **Spend deterministic effort on *where* to look, and model effort on *what is wrong*.** Mature repositories already track size, complexity and dependencies; what they lack is a cheap way to find behavioural defects.
2. **Never trust a single model pass.** Every candidate gets an adversarial second pass, and a person decides before anything is filed.
3. **State, not reports.** Findings have stable identities, so a re-run says what is new, what persists and what was fixed, and never pays again for unchanged code.
4. **The agent discovers, deterministic rules prevent.** A model on every commit is too expensive to be the long-term answer. Each confirmed class with a syntactic shape becomes a rule that runs on every file in seconds, for free, and gates PRs.

## Pipeline

| Stage | Code | Deterministic | Cost |
|---|---|---|---|
| select | `src/stages/select.ts`, `signals.ts`, `lint.ts` | yes | free |
| review | `src/stages/review.ts`, `src/prompts.ts`, `src/backends/` | no, cached | about $0.35 per file (Opus) |
| verify | same | no, cached | about $0.30 per finding |
| rules | `src/stages/rules.ts`, `src/rules/` | yes | free |
| state, ranking | `src/state.ts` | yes | free |
| report | `src/report.ts` | yes | free |
| dedupe, publish | `src/stages/dedupe.ts`, `publish.ts` | yes | GitHub API |
| pr | `src/stages/pr.ts` | rules yes, agent no | rules free, agent per changed file |

### Selection

Each in-scope file gets a priority from risk-surface patterns (`child_process`, filesystem writes, network, untrusted parsing, crypto, timers, listeners, `new Promise`, streams), weighted by density rather than raw count, multiplied by log size and by recent churn, plus correctness-lint and rule hits. Defects that matter cluster where code touches the outside world, and a finding in code that is changing is cheapest to act on. Weights are configurable (`signalWeights`), and `results/selection.json` records every file's signals.

### Review and verification

The `claude-cli` backend runs Claude Code headless (`claude -p`) inside the target checkout with only Read, Grep and Glob allowed. An agent matters here: most real findings depend on a caller, a schema or library internals two files away, and the agent can open them. Output follows a JSON Schema generated from zod and is validated again; a candidate whose quoted anchor line is not in the file is dropped.

The verifier gets the claim, not the reviewer's conversation, and is told to disprove it: is the path reachable, guarded elsewhere, intended (tests, comments), overstated? It re-rates severity and suggests search phrases for duplicate detection.

The `openai-compatible` backend does the same against any OpenAI-style server, in two phases because some servers do not combine tools with a JSON response format: up to `openaiMaxToolCalls` read-only tool calls (`read_file`, `grep`, confined to the checkout), then one schema-constrained answer. The file under review is inlined, so small local models still work when they never call a tool.

The project's name and description from the config are rendered into both prompts. `PROMPT_VERSION` is part of the cache key.

### Identity across runs

`fingerprint = sha256(file, whitespace-normalised anchor line)`. Line numbers are not part of it, so findings survive unrelated edits; the model's category is not either, because re-reviews classify the same defect differently. When a changed file is re-reviewed, the prompt lists the findings already recorded for it. On every run each known finding is re-located: **present**, **moved** or **gone**. Reviews are cached by prompt version, model, path and content hash, so an unchanged commit costs nothing. Human decisions in `state/overrides.json` always win and are re-applied on every run.

Rule hits have their own ids (rule name, file, message, normalised line text), so a triaged hit stays triaged when code moves around it.

### Ranking

`score = severity × confidence × status (confirmed 1, uncertain 0.5, unverified 0.3, rejected 0) × (1 + log2(1 + churn) / 4)`. Simple and explainable on purpose; churn only nudges.

## Rules: from finding to prevention

A rule is worth writing when a confirmed finding has a shape a parser can see. Its RuleTester cases are reduced copies of the finding (invalid) and the correct patterns the same codebase uses elsewhere (valid). The triaged baseline (`state/rules-baseline.json`) records each accepted hit with a status (`finding`, `accepted`, `false-positive`), a reason and a date; `qr rules` exits 1 on any hit not in it.

Rules are tuned on each new target. On Nx, 10 of 18 first-pass hits were noise: `fork()` and `spawn(process.execPath)` start the running Node binary, which cannot be missing; `existsSync` never throws; a `throw` after `const x: never` is a TypeScript exhaustiveness check. Each became a valid test case, and recall on the QVAC findings was re-checked (22 of 22 hits unchanged).

## When it runs

| When | What | Effect |
|---|---|---|
| Every pull request | `qr pr` (or the Action): rules on changed files; agent review of the riskiest changed files, at most `prMaxFiles` | rule hits not in the baseline block; agent leads are advisory, in one sticky comment; fixed findings are reported |
| On a schedule or on demand | rules on the whole scope; `qr run` on the top-risk files | a triage PR with the new state and reports |
| When triage is merged | `dedupe`, `publish` | confirmed findings become issues, with the duplicate searches logged |
| When a confirmed class has a shape | a new rule with the finding as its test | the class is blocked on every future PR, for free |

Deterministic checks block because they are repeatable and every hit can be accepted with a reason. The agent never blocks, because it is non-deterministic. People decide in one place, a pull request on `state/`, so every decision is reviewed, versioned and replayed.

## Workspace layout

```
<workspace>/
  qr.config.json         project, scope globs, models, backend, GitHub repos
  state/
    findings.json        every finding with its verdicts, presence and duplicate searches
    overrides.json       human decisions (always win)
    rules-baseline.json  triaged rule hits
    cache/               model answers, keyed by prompt version, model and content
  results/               FINDINGS.md, RULES.md, PR.md, selection.json, run logs
```

`-w <dir>` points every command at a workspace; `-c`, `-s` and `-o` override single paths.
