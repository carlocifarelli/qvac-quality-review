# Local QVAC backend vs Claude backend — 31 human-confirmed findings

Target: `tetherto/qvac@0c8a1510ab4fe89893de174b07eb4901a2f3e9fd`, the 19 files that hold the 31 findings
marked `confirmed` in `state/overrides.json` (found by the Claude backend).

## Setup

| | |
|---|---|
| Machine | Apple M4 Max, 64 GB RAM, macOS 26 (Darwin 25.5) |
| Server | `npx @qvac/cli@0.19.0 serve --openai --no-default` (config `local/qvac.config.json`) |
| Model | `QWEN3_4B_INST_Q4_K_M` as `reviewer`, `tools: true`, `ctx_size: 32768` |
| Command | `qr run <qvac> -c qr.local.config.json -s state-local -o results/local-qvac --top 19 --only <19 files>` |
| Wall time | **29 min 33 s** (review + verify, model already loaded) |
| Model calls | **96** (95 answered, median 14 s, max 99 s, 1760 s total in the model) |
| Cost | $0, no code left the machine |

## Result

| Metric | Value |
|---|---|
| Candidates found | 21 (all `medium`), in 7 of the 19 files; 12 files returned nothing |
| **Recall vs the 31 confirmed** | **0/31** strict; 2 partial hits (C16, C25): right place, wrong or vague mechanism |
| New findings, plausible | 1 (local-broker.ts:172 `error` listeners left on a settled promise; 173 is the same issue twice) |
| New findings, wrong or noise | 18 (generic "potential leak / race / unhandled rejection", wrong readings of code that already has try/catch, style remarks about error messages) |
| Agent-verified (same model as verifier) | 0 confirmed, 20 rejected, 1 verify failure (truncated JSON) |
| Failures | 1 review anchor not found (local-broker.ts), 1 verify answer cut off mid-JSON (scratch.ts:95) |

The verifier rejected everything, including the one real issue and the C16 partial hit, often
with reasoning that misreads the code (e.g. it says `settle(error)` handles the `mkdirSync`
throw at archive.ts:170, which it does not). So with this model the verify pass is not a
useful filter: it agrees with nothing.

Bottom line: a 4B local model runs the pipeline end to end at zero cost, but it does not find
the defects the Claude backend found. Its findings are surface-level pattern matches on
"error handling" and "resource leak", not traced behaviour.

## Per confirmed finding

| id | fingerprint | file:line | matched | note |
|---|---|---|---|---|
| C01 | qr2:7ddcab | ai-sdk-provider/src/managed/index.ts:99 | no | file returned no findings |
| C02 | qr2:5aacd1 | ai-sdk-provider/src/managed/index.ts:100 | no | file returned no findings |
| C03 | qr2:d391ad | ai-sdk-provider/src/managed/index.ts:295 | no | file returned no findings |
| C04 | qr2:0c0f18 | ai-sdk-provider/src/managed/serve-process.ts:361 | no | local findings at 266/397 are unrelated |
| C05 | qr2:536196 | inference/.../coreml-sidecars.ts:207 | no | file returned no findings |
| C06 | qr2:94de8f | inference/.../coreml-sidecars.ts:216 | no | file returned no findings |
| C07 | qr2:98c9a5 | inference/.../download-stats.ts:61 | no | file returned no findings |
| C08 | qr2:aace28 | inference/.../hyperdrive.ts:85 | no | file returned no findings |
| C09 | qr2:4facb8 | inference/.../hyperdrive.ts:370 | no | file returned no findings |
| C10 | qr2:d856f8 | inference/.../hyperdrive.ts:481 | no | file returned no findings |
| C11 | qr2:621134 | inference/.../registry.ts:567 | no | nearest local one (398, cleanup on cancel "may fail") is another place and is noise |
| C12 | qr2:3fb004 | inference/src/model-fit/run/run.ts:218 | no | file returned no findings |
| C13 | qr2:b9cb8c | inference/.../codegen.ts:233 | no | file returned no findings |
| C14 | qr2:bfcce1 | inference/src/schemas/config.ts:54 | no | file returned no findings |
| C15 | qr2:ccf5e9 | inference/src/schemas/config.ts:226 | no | file returned no findings |
| C16 | qr2:02c133 | inference/src/utils/archive.ts:170 | partial | same anchor (same fingerprint): says the `mkdirSync` error is not handled, but the impact it gives is orphaned dirs, not the uncaught exception that escapes the promise. Verifier rejected it |
| C17 | qr2:7733cb | inference/src/utils/archive.ts:292 | no | local 289/296 complain about generic error messages, not the missed shard lookup |
| C18 | qr2:6abb1d | registry-server/client/lib/profiler.js:46 | no | file returned no findings |
| C19 | qr2:fbef8f | registry-server/lib/metrics-server.js:14 | no | file returned no findings |
| C20 | qr2:d48fcd | registry-server/lib/metrics-server.js:50 | no | file returned no findings (the same pattern was found in local-broker.ts instead) |
| C21 | qr2:85ed26 | registry-server/lib/registry-service.js:861 | no | only local finding is at 1310 and wrong |
| C22 | qr2:80af97 | registry-server/lib/registry-service.js:866 | no | as above |
| C23 | qr2:fee72a | registry-server/lib/registry-service.js:1432 | no | as above |
| C24 | qr2:39ee0d | sdk/src/client/rpc/node-rpc-client.ts:482 | no | file returned no findings |
| C25 | qr2:d190bf | sdk/src/commands/bundle/scratch.ts:27 | partial | local scratch.ts:58 says `removeStaleScratch` races with concurrent changes, without naming the missing owner.pid window; too vague to count |
| C26 | qr2:24eae5 | sdk/src/commands/verify/prebuilds.ts:105 | no | file returned no findings |
| C27 | qr2:59e0a7 | test-suite/.../run-consumer-external.ts:43 | no | file returned no findings |
| C28 | qr2:6b77a3 | test-suite/.../run-consumer-external.ts:47 | no | file returned no findings |
| C29 | qr2:ee5e04 | test-suite/src/cli/utils/local-broker.ts:178 | no | local 172/173/182 are about the listeners and close(), not the PID written to broker.pid |
| C30 | qr2:621f2d | test-suite/src/cli/utils/process-manager.ts:67 | no | local 113/176 are unrelated |
| C31 | qr2:0d264c | test-suite/src/cli/utils/process-manager.ts:106 | no | local 113 says read errors are ignored, not that stale .pid files are kept and reused PIDs get killed |

## The 21 local findings, judged against the code

| fingerprint | file:line | judgement | note |
|---|---|---|---|
| qr2:a8a691 | serve-process.ts:266 | wrong | readline events are sequential, no race |
| qr2:67d548 | serve-process.ts:397 | wrong | `child.kill` is already inside try/catch |
| qr2:f2c525 | registry.ts:258 | noise | "error may propagate" is the intended behaviour |
| qr2:d6ac6d | registry.ts:300 | noise | `hasFileOfSize` returning false is its contract |
| qr2:2ac135 | registry.ts:398 | noise | cleanup is already best effort in try/catch |
| qr2:4dc097 | archive.ts:85 | wrong | `settle` destroys streams on abort |
| qr2:02c133 | archive.ts:170 | partial (C16) | see above |
| qr2:929239 | archive.ts:289 | wrong | the cause is passed to `ArchiveExtractionFailedError` |
| qr2:33515a | archive.ts:296 | wrong | the message already names the expected pattern |
| qr2:e581ec | archive.ts:316 | wrong | the error names the missing shard |
| qr2:6de5e3 | registry-service.js:1310 | wrong | the core is closed in `finally` |
| qr2:c2e0d3 | scratch.ts:33 | wrong | `rm -rf` with force removes non-empty dirs |
| qr2:70fdcf | scratch.ts:58 | vague (near C25) | see above |
| qr2:78679d | scratch.ts:76 | wrong | EPERM is handled explicitly |
| qr2:2d399d | scratch.ts:86 | noise | normal exists() helper |
| qr2:6708f6 | scratch.ts:95 | wrong | `replaceAll` collects and rethrows put-back failures |
| qr2:ea95a6 | local-broker.ts:172 | **plausible, new** | `tcpServer.on('error', reject)` / `httpServer.on('error', reject)` stay attached after `resolve()`, so later server errors go to a settled promise and are swallowed. Same pattern as C20 in metrics-server.js; low severity. The model's stated impact ("unhandled rejections") is off |
| qr2:0c3669 | local-broker.ts:173 | duplicate of ea95a6 | |
| qr2:68a0e6 | local-broker.ts:182 | wrong | `server.close()` on a stopped server does not throw, and the calls are wrapped |
| qr2:330af0 | process-manager.ts:113 | noise | ignoring a failed read of a pid file is fine |
| qr2:595c42 | process-manager.ts:176 | wrong | the handler ends the client and resolves |

## Backend changes needed to get here

1. `local/qvac.config.json`: the model must be loaded with `config.tools: true`. Without it every
   request with `tools` returns `400 tools_not_enabled` (first attempt: 19/19 files failed in 6 s).
   Added `ctx_size: 32768` too, since the file under review is inlined (up to 1500 lines).
2. `src/backends/openai-compatible.ts`: send `max_tokens: 4096`. Without a cap, the second attempt
   hung at 12/19 files: one request kept generating, the single-slot server queued the rest, and
   each queued request died at Node fetch's 5-minute header timeout
   (`attempt2-stuck-qvac-serve.log`).

## Files

- `results/local-qvac/state-local/`: findings and the per-call cache of this run
- `results/local-qvac/FINDINGS.md`, `run-log.json`, `selection.json`: the run's report output
- `results/local-qvac/run.log`, `qvac-serve.log`: the CLI and server logs of the final run
