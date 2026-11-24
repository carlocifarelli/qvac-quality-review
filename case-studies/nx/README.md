# Case study: Nx (rules only)

[nrwl/nx](https://github.com/nrwl/nx) at `741bf7670c40` (main, 2026-11-24): the first run of the rules on code they were not written from. No agent stage, so $0.

- **Scope:** `packages/*/src` and `lib` (from `qr init`, docs sites removed by hand): 2,391 files after excluding tests, fixtures and testing utilities.
- **Result:** 7 hits in 11 s, triaged in [`state/rules-baseline.json`](state/rules-baseline.json) and listed in [`results/RULES.md`](results/RULES.md).

| Status | Hits | What |
|---|---|---|
| Lead | 5 | `launch-editor.ts` crashes on an `EDITOR` that is not on PATH instead of rejecting; `cache.ts` spawns `node` from PATH with no `error` listener; `update-manager.ts` has the same `mkdirSync`-in-tar-listener shape as QVAC #6; two abort listeners with no check for an already-aborted signal (`exec-gradle.ts`, `probes.ts`, whose sibling probe does check) |
| Accepted | 2 | `spawn(…, { shell: true })` in a fixed cwd: a start failure is not realistic |

The leads come from reading the code, not from running it. They have not been reproduced or reported to Nx.

## What it changed in the rules

The first pass gave 18 hits. 10 were noise, and each became a valid RuleTester case:

| Noise | Hits | Fix |
|---|---|---|
| `fork()` and `spawn(process.execPath)` start the running Node binary, which cannot be missing | 7 | `spawn-without-error-listener` skips them |
| `existsSync` never throws | 1 | `throw-in-promise-listener` skips it |
| `throw` after `const x: never = …` is a TypeScript exhaustiveness check | 1 | `throw-in-promise-listener` skips it |
| A test helper's `server.on('error', reject)` | 1 | `*testing-utils/`, `__fixtures__/` and `__mocks__/` excluded by default |

After the fixes the rules still give the same 22 hits on QVAC, all triaged. On Vite (`e16ca5a13d74`, 143 files in `packages/*/src`) they give 0 hits.

```bash
git clone https://github.com/nrwl/nx ../nx && git -C ../nx checkout 741bf7670c40
npx tsx src/cli.ts -w case-studies/nx rules ../nx               # 7 hits, all triaged, exit 0
npx tsx src/cli.ts -w case-studies/nx run ../nx --select-only   # the 25 files the agent would review first
```
