# Human verification

The agent pipeline produces claims. Before a finding is marked confirmed in
`state/overrides.json` (and filed), a person runs a reproduction from this
folder against the analyzed checkout. Each script prints what it observed and
exits non-zero if the claimed behaviour does **not** occur, so a fix upstream
makes the script fail: that is the signal to move the finding to "fixed".

| Script | Finding | Runtime | How to run |
|---|---|---|---|
| `F-device-defaults.ts` | deviceDefaults keys stripped; merge order vs docs | Node + tsx | `QVAC=<qvac> npx tsx --tsconfig <qvac>/packages/inference/tsconfig.json verification/F-device-defaults.ts` |
| `inference-archive.repro.test.ts` | nested-folder shards fail; mkdirSync throw escapes the promise | Bare + brittle (the package's own runner) | `verification/run-inference-repros.sh <qvac>` |
| `registry-reseed-hang.repro.cjs` | waitForComplete never settles for concurrent callers or after destroy() | Node | `QVAC=<qvac> node verification/registry-reseed-hang.repro.cjs` |
| `test-suite-signal-exit.repro.mjs` | signal-killed runner reported as exit 0 | Node | `node verification/test-suite-signal-exit.repro.mjs; echo $?` |
| `inference-hyperdrive-abort.repro.test.ts` | abort during the drive lookup is lost (plus a control) | Bare + brittle | `verification/run-inference-repros.sh <qvac>` |
| `get-model-by-name-prototype.repro.ts` | getModelByName returns Object.prototype members | Node + tsx | `QVAC=<qvac> npx tsx --tsconfig <qvac>/packages/inference/tsconfig.json verification/get-model-by-name-prototype.repro.ts` |
| `test-suite-double-sigint.repro.mjs` | Ctrl+C reaches the runner twice and cuts off graceful shutdown | Node (POSIX) | `node verification/test-suite-double-sigint.repro.mjs` |
| `test-suite-spawn-error.repro.mjs` | spawnTracked: failed spawn is an uncaught exception, pid file says "undefined" | Node | `node verification/test-suite-spawn-error.repro.mjs` |

Prerequisite for the TypeScript/Bare ones: `pnpm install --ignore-scripts` in the QVAC checkout (no native builds needed).

`run-inference-repros.sh` copies the test into `packages/inference/test/`, builds it with the package's
own test tsconfig, runs only that file, and removes it again. Nothing is committed upstream.

Recorded outputs from the submission run are in [`outputs.md`](outputs.md).
