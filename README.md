# qvac-quality-review

A repeatable pipeline that finds, verifies and ranks **defects worth fixing** in a JS/TS repository, applied to [tetherto/qvac](https://github.com/tetherto/qvac). Full design notes and measurements: [docs/DETAILS.md](docs/DETAILS.md).

- **Analyzed:** `tetherto/qvac@0c8a1510ab4f` (main, 2026-11-18), 1,013 JS/TS files in scope, top 40 by risk reviewed by the agent, all 1,013 by the rules.
- **Findings:** 32 confirmed by me and filed as issues [#1-#32](https://github.com/carlocifarelli/qvac-quality-review/issues) in this repo, ranked in [FINDINGS-SUMMARY.md](FINDINGS-SUMMARY.md) with evidence, impact, uncertainty and next action; 16 investigated and rejected, with reasons; 334 duplicate searches on upstream issues and PRs (open and closed), logged with dates.
- **Time spent:** about 5 hours of the 8-hour budget.

## Run it

```
npm ci
npx tsx src/cli.ts run /path/to/qvac                 # select -> AI review -> adversarial verify -> results/FINDINGS.md
npx tsx src/cli.ts run /path/to/qvac --select-only   # deterministic stage only, ~10 s, $0
npx tsx src/cli.ts rules /path/to/qvac [--changed origin/main]   # 6 qvac-quality rules, ~9 s, $0, exit 1 on untriaged hits
npx tsx src/cli.ts pr /path/to/qvac --base origin/main           # one PR: rules (blocking) + agent on changed files (advisory)
npx tsx src/cli.ts report /path/to/qvac              # re-render after editing state/overrides.json
npx tsx src/cli.ts dedupe --human-confirmed          # search upstream issues + PRs, log queries with dates
npx tsx src/cli.ts publish [--dry-run]               # file human-confirmed findings here (idempotent)
npm test                                             # 56 tests
```

Requires Node 22+, git, the Claude Code CLI logged in (or `ANTHROPIC_API_KEY`), and `gh` for `dedupe`/`publish`. The local alternative needs no account: `qvac serve --openai` with `-c qr.local.config.json` (see below).

**Human workflow:** `run` → read `results/FINDINGS.md` → reproduce or read the top leads → record decisions in `state/overrides.json` → `report` → `dedupe` → `publish`. Commit `state/` so the next run starts from these decisions.

## How it works

QVAC already tracks size, structure and dependencies (`scripts/code-quality`) and a correctness lint pass found almost nothing, so the tool spends its effort on **behavioural defects** linters cannot see.

1. **Select** (deterministic, free): risk signals (child processes, filesystem, network, untrusted parsing, timers, listeners, promises) × size × recent churn → ranked files, auditable in `results/selection.json`.
2. **Review** (AI agent, read-only): Claude Code headless inside the checkout with only Read/Grep/Glob, so it can follow callers and library code; output schema-validated, quoted anchor lines re-checked against the file.
3. **Verify** (AI agent, adversarial): a second pass tries to disprove each candidate.
4. **Human gate:** I read every candidate and ran reproductions for 10 of the 31 confirmed findings (`verification/`). Only human-confirmed findings are filed.
5. **Report, dedupe, publish** into this repo's issues.

**The agent discovers, deterministic rules prevent.** Confirmed findings with a syntactic shape became a local ESLint plugin (`src/rules/`, 6 rules, RuleTester cases built from the findings). On the whole scope they flag all 9 source locations, found 1 new bug (#32), and are 91% precise (20 of 22 hits). A triaged baseline (`state/rules-baseline.json`) makes them a CI gate.

## Subsequent runs (demonstrated)

Findings are fingerprinted by file + anchor line, not line number, and re-located on every run as present, moved or gone. Model answers are cached by file hash.

| Run | Agent calls | Cost | Result |
|---|---|---|---|
| 1, analysed commit | 86 | $27.47 | 47 candidates → 31 confirmed, 16 rejected |
| 2, same commit | 0 | $0 | identical, fully cached |
| 3, next commit fixing one finding | 2 | $0.64 | the fixed finding reported as gone; only the changed file re-reviewed |
| `qr pr` on a simulated PR | 4 | $0.88 | rule blocked the regression, agent flagged it too, fixed finding reported |

**When it runs:** every PR (rules block, agent advises), a weekly scan of `main` that opens a triage PR here (running in Actions), publish when triage is merged, and a new rule whenever a confirmed finding has a shape. Workflows in `.github/workflows/`; the QVAC PR check is in `integrations/github/` and is proposed only.

## Running on QVAC itself (demonstrated)

`backend: "openai-compatible"` runs review and verify on `qvac serve --openai`, so no code leaves the machine. Measured on an M4 Max against the 31 confirmed findings:

| | Claude | QVAC, Qwen3-4B | QVAC, KAT-Coder 35B MoE |
|---|---|---|---|
| Recall of the 31 | 31 (its own findings) | 0 (2 partial) | 1 (3 partial) |
| Cost / time | $27.47 for 40 files | $0, 29.5 min | $0, 27 min |

It works end to end at zero cost, but local models do not yet find these defects and their verifiers reject everything; today it is a privacy option, with the rules carrying the gate. Details in `results/local-qvac*/`.

## Design choices

| Choice | Alternative |
|---|---|
| Model effort on behaviour, not metrics | More metrics, SonarQube: what QVAC already has |
| Agent with read-only tools | One prompt with the file inlined: cheaper, blind to callers |
| Adversarial verify, then a human | Trusting model confidence |
| Anchor fingerprints, state as JSON in git | A database or issues as the only store |
| Rules generated from confirmed findings | Running the model on every commit forever |

- **Ease of use:** one command per stage, one JSON config with defaults, Markdown reports, `--select-only` as a free dry run.
- **Cost:** observed $27.47 for a full first run (~$0.35 per review, ~$0.30 per verification), $0 on an unchanged commit, cents to ~$2 per PR; rules and the local backend are free. **Services:** Anthropic via Claude Code (or a local QVAC server) and the GitHub API. Nothing to host.
- **Security:** the agent cannot write, execute or browse; code goes to Anthropic unless the QVAC backend is used; prompt injection is mitigated (read-only tools, schema, anchors, second pass, human gate), not eliminated; no credentials in the repo; findings go to this private repo only, never upstream.
- **Maintainability:** ~1,500 lines of strict TypeScript, zod at every boundary, one file per stage, versioned prompts, a migration script for state changes, 56 tests.

## Limitations

- **Recall is unknown:** 40 of 681 candidate files were reviewed, and there is no labelled bug set.
- **The agent verifier is lenient:** I rejected 8 of its 39 confirmations, so "agent confirmed" is a lead, not a fact.
- **Rules were written after seeing the findings**, so their recall on unseen bugs is unmeasured. They are intra-file, which caused both false positives.
- **Some findings were verified by reading, not executed** (runtime races in the registry, Hyperdrive collisions).
- **Weekly and PR costs are extrapolated** from a few runs. Dedupe is keyword search and cannot prove absence.

## Next priorities (proposed)

1. Install the PR check in QVAC with the maintainers, and review the callers of changed functions too.
2. An evaluation set from QVAC's closed `fix:` PRs, to measure recall per model and prompt.
3. Group findings by root cause before ranking.
4. Propose the rules upstream as a lint preset next to `lunte`.
5. Local models: disable reasoning in the final call, try dense models, give them rule hits as hints.

## Demonstrated vs proposed

**Demonstrated** (outputs committed): selection, review, verify, presence across commits, caching, dedupe, publish, all reproductions, the rules and their gate, `qr pr`, the weekly scan in Actions, the QVAC local backend.
**Not demonstrated:** the agent stage inside Actions (no API key configured), `publish.yml` in Actions, the QVAC PR check (upstream changes are out of bounds), and a local model that matches Claude.

**AI use:** [AI_USAGE.md](AI_USAGE.md).
