# Case study: QVAC

[tetherto/qvac](https://github.com/tetherto/qvac) is Tether's SDK for local AI (JS/TS on Node and Bare: model registry, P2P downloads, inference addons, CLI). This was the first target, reviewed at `0c8a1510ab4f` (main, 2026-11-18).

- **Scope:** 1,013 JS/TS files; the top 40 by risk reviewed by the agent, all 1,013 by the rules.
- **Findings:** 47 candidates, each with a human decision. **32 confirmed** and filed as issues [#1-#32](https://github.com/carlocifarelli/agentic-code-review/issues) in this repository, ranked in [FINDINGS-SUMMARY.md](FINDINGS-SUMMARY.md) with evidence, impact and next action; 10 of them reproduced by a script in [`verification/`](verification/). **16 rejected**, with reasons. 334 duplicate searches on upstream issues and PRs, open and closed, logged with dates.
- **Rules:** 6 written from the confirmed findings. On the whole scope they flag all 9 source locations, found 1 new bug (#32) and are 91% precise (20 of 22 hits); every hit is triaged in [`state/rules-baseline.json`](state/rules-baseline.json).

QVAC already tracks size, structure and dependencies with its own tooling, and a correctness lint pass found almost nothing, so the effort went into behavioural defects.

## Runs

| Run | Agent calls | Cost | Result |
|---|---|---|---|
| 1, analysed commit | 86 | $27.47 | 47 candidates → 31 confirmed, 16 rejected |
| 2, same commit | 0 | $0 | identical, fully cached |
| 3, next commit fixing one finding | 2 | $0.64 | the fixed finding reported as gone; only the changed file re-reviewed |
| `qr pr` on a simulated PR | 4 | $0.88 | the rule blocked the regression, the agent flagged it too, the fixed finding was reported |
| rules, whole scope | 0 | $0 | 22 hits in about 9 s, 0 untriaged |

Recorded in [`demo/`](demo/) and [`results/`](results/).

## Local models

The same pipeline ran on `qvac serve --openai`, so no code left the machine. On an M4 Max, against the 31 confirmed findings:

| | Claude | QVAC, Qwen3-4B | QVAC, KAT-Coder 35B MoE |
|---|---|---|---|
| Recall of the 31 | 31 (its own findings) | 0 (2 partial) | 1 (3 partial) |
| Cost / time | $27.47 for 40 files | $0, 29.5 min | $0, 27 min |

It works end to end at no cost, but local models do not yet find these defects, and their verifiers reject everything. Details in `results/local-qvac*/`.

## Reproduce

```bash
git clone https://github.com/tetherto/qvac ../qvac && git -C ../qvac checkout 0c8a1510ab4f
npx tsx src/cli.ts -w case-studies/qvac rules ../qvac     # 22 hits, all triaged, exit 0, $0
npx tsx src/cli.ts -w case-studies/qvac run ../qvac       # served from state/cache: 0 agent calls, $0
```

[`qvac-pr-check.yml`](qvac-pr-check.yml) is the PR workflow proposed for QVAC; it is not installed there. Full notes, design choices at the time, limitations and the time log: [docs/DETAILS.md](docs/DETAILS.md).
