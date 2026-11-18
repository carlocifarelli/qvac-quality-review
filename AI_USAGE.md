# AI use

AI was used in two distinct roles. They are kept apart because they need different kinds of trust.

## 1. AI as a component of the solution (runtime)

- **Reviewer** and **verifier** stages run Claude Code headless (`claude -p`, model `claude-opus-5-5`) as a read-only agent inside the QVAC checkout. Prompts are in `src/prompts.ts`; tool restrictions in `src/backends/claude-cli.ts`.
- Every model output is schema-validated (zod → JSON Schema), anchors are re-checked against the file, and each candidate is challenged by a second, adversarial pass.
- No finding was filed on model output alone: the ones marked confirmed were reproduced by a script in `verification/` that I ran and read, or verified by reading the cited code paths myself (stated per finding in `state/overrides.json`).
- The same stages can run on a local model through `qvac serve` (`src/backends/openai-compatible.ts`); measured with Qwen3-4B and KAT-Coder 35B MoE in `results/local-qvac*/`. Their findings were not used for the submission.
- Model answers are cached (`state/cache/`), so the exact outputs behind this submission are inspectable and a re-run is reproducible.

## 2. AI as a development assistant (build time)

I worked with Claude (Claude Code in a cloud session) as a pair programmer:

- It drafted most of the TypeScript in `src/`, the reproduction scripts and the first draft of the README; I set the architecture, the scope, the ranking formula, the prompts' exclusion rules and the acceptance criteria for findings.
- I reviewed every file, ran the type check, the unit tests, the pipeline and every reproduction script, and edited where the output was wrong or vague.
- Corrections made during the session, for the record:
  - Claude Code's `--json-schema` rejects schemas carrying a `$schema` draft-2020-12 key; the generated schema is stripped of it.
  - GitHub's search API now requires `is:issue` or `is:pull-request` in each query; dedupe runs both.
  - A first reproduction for the deviceDefaults finding called a resolver whose schema needs required fields; it was rewritten to test the pattern lookup directly.
  - The mkdirSync reproduction first crashed the test runner itself ("Uncaught (in promise)"); handlers for both `uncaughtException` and `unhandledRejection` were added so it reports instead of crashing, which also confirmed the impact.

## What I would not delegate

Deciding that a finding is real and worth a maintainer's time. That decision is recorded per finding, with the evidence, in `state/overrides.json`.
