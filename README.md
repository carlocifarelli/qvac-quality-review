# qc-starter

Starter for a code-quality assessment CLI, prepared **before** the assessment as a personal setup:
CLI, config, scoring, one LLM reviewer with schema-validated output, Markdown/JSON report, tests and a CI example.
The actual analyses for the assignment get written on the day.

```
npm install
npm test
npx tsx src/cli.ts analyze <path>            # Markdown report, with LLM review
npx tsx src/cli.ts analyze <path> --no-llm   # deterministic only
npx tsx src/cli.ts analyze <path> --format json --out qc-report.json --fail-under 80
```

LLM review needs `ANTHROPIC_API_KEY`; the model defaults to `claude-opus-5-5` (override with `QC_MODEL`).
If the review fails or is declined, the report is still produced with the measured data.

## How it works

1. **Collectors** (`src/collectors/`) turn code into `Finding`s: rule, dimension, severity, file, line.
   Included as examples: cyclomatic complexity and function length (TypeScript AST), git hotspots.
2. **Scoring** (`src/scoring.ts`): each dimension starts at 100 and loses points per finding by
   severity, normalised by codebase size; overall is a weighted mean. Weights and penalties live in
   `qc.config.json`.
3. **Reviewer** (`src/llm/review.ts`): gets the findings plus excerpts of the worst files and returns
   a zod-validated JSON: summary, top 5 actions, design notes. It comments on measured data; it does
   not produce the score.
4. **Report** (`src/report/`): Markdown for people, JSON for machines; exit code 1 under the threshold.

## Notes

- TypeScript 7 (native) has no JS compiler API, so `typescript` is pinned to 5.9 for the AST work.
- Holepunch projects (the P2P stack Tether builds on) use `prettier` + `lunte` for lint and `brittle`
  as test runner, also on the Bare runtime: worth supporting as collectors if the target is one of those.
