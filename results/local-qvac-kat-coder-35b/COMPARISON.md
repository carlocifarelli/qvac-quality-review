# Local QVAC backend, KAT-Coder 35B MoE vs Claude: 31 human-confirmed findings

Same measurement as `results/local-qvac/COMPARISON.md` (Qwen3-4B), with a larger model.
Target: `tetherto/qvac@0c8a1510ab4fe89893de174b07eb4901a2f3e9fd`, the same 19 files that hold the 31 findings
marked `confirmed` in `state/overrides.json`.

## Setup

| | |
|---|---|
| Machine | Apple M4 Max, 64 GB RAM, macOS 26 (Darwin 25.5) |
| Runtime | `npx @qvac/cli@0.19.0 serve --openai --no-default -c local/qvac.kat.config.json` |
| Model | Kwaipilot KAT-Coder-V2.5-Dev, Q4_K_M GGUF (21.4 GB), QVAC catalog constant `MOE_35B_INST_Q4_K_M`; `tools: true`, `ctx_size: 32768`, `max_tokens: 4096` |
| Weights | Downloaded from Hugging Face `bartowski/Kwaipilot_KAT-Coder-V2.5-Dev-GGUF` at commit `d8f684f08d2950ea9d2db6a35ef7dada0707858b`, the same commit the QVAC catalog pins. sha256 `4221c26e5663502d1c96fc901c9967d0e70ce2dcfaa5a9fb9280a46bd19e3c07` matches the LFS oid, and the size (21,391,448,480 bytes) matches the catalog's `expectedSize`. Loaded by path (`src`). The QVAC P2P registry download ran at ~250 KB/s (about a day for 21 GB; see `p2p-download-attempt.log`). QVAC is still the runtime |
| Command | `qr run <qvac> -c qr.local.config.json -s results/local-qvac-kat-coder-35b/state-local -o results/local-qvac-kat-coder-35b --top 19 --only <19 files>` |
| Wall time | **26 min 58 s** (review + verify, model already loaded) |
| Model calls | **96**, 1610 s total in the model |
| Cost | $0, no code left the machine |

Why this model: it is the strongest code model in QVAC's catalog that fits in 64 GB with a 32k
context. It is a coding-agent fine-tune, and as a MoE it activates only a few billion parameters per
token, so it runs at about the speed of the 4B model. The other options were gpt-oss-20b (11.6 GB),
Qwen3.5-9B and Qwen3-8B.

## Result

| Metric | KAT-Coder 35B MoE | Qwen3-4B (earlier run) |
|---|---|---|
| Candidates | 15, in 4 of 19 files | 21, in 7 of 19 files |
| **Recall vs 31 confirmed** | **1/31** strict (C28); 3 partial (C27, C29, C31) | 0/31 strict; 2 partial (C16, C25) |
| New findings, plausible | 1 (profiler.js `swarm.flush().then()` with no rejection handler) | 1 (local-broker.ts listeners left on a settled promise) |
| Wrong or noise | 10 | 18 |
| Verifier (same model) | 0 confirmed, 14 rejected, 1 failed; it rejected the C28 match | 0 confirmed, 20 rejected, 1 failed |
| Review failures | 1: `managed/index.ts` (holds C01-C03) | 1 anchor not found |
| Wall time / calls | 27 min / 96 | 29.5 min / 96 |

The larger model reads the code better: its evidence quotes the right lines and follows control flow.
The C28 match is a precise description: `child.on('exit', (code) => process.exit(code || 0))` turns
a signal kill (`code === null`) into exit 0. It still misses 30 of 31 findings. Its tendency is to
list "cleanup/leak" suspicions in files with a lot of resource handling (profiler.js, local-broker.ts)
rather than to find the specific defect. One finding (profiler.js:172) ends mid-thought with
"Wait, let me re-read...", which is the reasoning leaking into the answer.

The verifier is again not a useful filter: it rejected everything, including the real C28 match.
Its reasoning is longer and more code-aware than the 4B's, but it defaults to "overstated / not
actionable".

**`managed/index.ts` never got an answer.** In the final JSON call the model spent its whole budget
on reasoning and returned empty content (`finish_reason: length`). Raising `max_tokens` to 8192 and
then 16384 for that file alone did not help: 8193 and then 16385 tokens of reasoning, still no
answer. This is a reasoning runaway, not a too-small budget, so the run keeps the default 4096 and
counts the file as failed. A fix would be to turn thinking off for the answer call. That is out of
scope for this measurement.

## Per confirmed finding

| id | fingerprint | file:line | matched | note |
|---|---|---|---|---|
| C01 | qr2:7ddcab | ai-sdk-provider/src/managed/index.ts:99 | no | review failed for this file (reasoning runaway) |
| C02 | qr2:5aacd1 | ai-sdk-provider/src/managed/index.ts:100 | no | as above |
| C03 | qr2:d391ad | ai-sdk-provider/src/managed/index.ts:295 | no | as above |
| C04 | qr2:0c0f18 | ai-sdk-provider/src/managed/serve-process.ts:361 | no | file returned no findings |
| C05 | qr2:536196 | inference/.../coreml-sidecars.ts:207 | no | file returned no findings |
| C06 | qr2:94de8f | inference/.../coreml-sidecars.ts:216 | no | file returned no findings |
| C07 | qr2:98c9a5 | inference/.../download-stats.ts:61 | no | file returned no findings |
| C08 | qr2:aace28 | inference/.../hyperdrive.ts:85 | no | file returned no findings |
| C09 | qr2:4facb8 | inference/.../hyperdrive.ts:370 | no | file returned no findings |
| C10 | qr2:d856f8 | inference/.../hyperdrive.ts:481 | no | file returned no findings |
| C11 | qr2:621134 | inference/.../registry.ts:567 | no | file returned no findings |
| C12 | qr2:3fb004 | inference/src/model-fit/run/run.ts:218 | no | file returned no findings |
| C13 | qr2:b9cb8c | inference/.../codegen.ts:233 | no | file returned no findings |
| C14 | qr2:bfcce1 | inference/src/schemas/config.ts:54 | no | file returned no findings |
| C15 | qr2:ccf5e9 | inference/src/schemas/config.ts:226 | no | file returned no findings |
| C16 | qr2:02c133 | inference/src/utils/archive.ts:170 | no | file returned no findings |
| C17 | qr2:7733cb | inference/src/utils/archive.ts:292 | no | file returned no findings |
| C18 | qr2:6abb1d | registry-server/client/lib/profiler.js:46 | no | the 5 local findings are all in the download/cleanup code (172-266), none on the rate computation |
| C19 | qr2:fbef8f | registry-server/lib/metrics-server.js:14 | no | file returned no findings |
| C20 | qr2:d48fcd | registry-server/lib/metrics-server.js:50 | no | file returned no findings |
| C21 | qr2:85ed26 | registry-server/lib/registry-service.js:861 | no | file returned no findings |
| C22 | qr2:80af97 | registry-server/lib/registry-service.js:866 | no | file returned no findings |
| C23 | qr2:fee72a | registry-server/lib/registry-service.js:1432 | no | file returned no findings |
| C24 | qr2:39ee0d | sdk/src/client/rpc/node-rpc-client.ts:482 | no | file returned no findings |
| C25 | qr2:d190bf | sdk/src/commands/bundle/scratch.ts:27 | no | local scratch.ts findings (33, 80, 111) are other, wrong claims |
| C26 | qr2:24eae5 | sdk/src/commands/verify/prebuilds.ts:105 | no | file returned no findings |
| C27 | qr2:59e0a7 | test-suite/.../run-consumer-external.ts:43 | partial | same anchor (same fingerprint), but says handlers "accumulate across calls", not that Ctrl+C reaches the runner twice (terminal group signal + forwarded one) |
| C28 | qr2:6b77a3 | test-suite/.../run-consumer-external.ts:47 | **yes** | local qr2:152683 (line 38, 9 lines away): child killed by a signal has `code === null`, `process.exit(code \|\| 0)` exits 0 and masks the failure. Verifier rejected it |
| C29 | qr2:ee5e04 | test-suite/src/cli/utils/local-broker.ts:178 | partial | same anchor (same fingerprint), but the mechanism is "broker.pid never deleted", not "records the CLI's own PID" |
| C30 | qr2:621f2d | test-suite/src/cli/utils/process-manager.ts:67 | no | file returned no findings |
| C31 | qr2:0d264c | test-suite/src/cli/utils/process-manager.ts:106 | partial | the C31 mechanism (stale .pid files, killTracked may kill an unrelated process) appears in local qr2:ee5e04, but anchored in local-broker.ts rather than process-manager.ts |

## The 15 local findings, judged against the code

| fingerprint | file:line | judgement | note |
|---|---|---|---|
| qr2:f5e2a5 | profiler.js:172 | wrong | self-contradicting ("This seems correct. Let me look for actual bugs."); verify answer was not JSON |
| qr2:745bb2 | profiler.js:189 | noise | empty catch around `rmSync(..., { force: true })` in best-effort cleanup |
| qr2:01fa29 | profiler.js:199/234 | **plausible, new** | `swarm.flush().then(() => foundPeers())` has no rejection handler: if flush rejects (e.g. the swarm is destroyed during setup) Node reports an unhandled rejection. Low |
| qr2:dba4fc | profiler.js:255 | wrong | nothing between `setInterval` and the try at 265 throws in practice, and the interval is cleared in that finally |
| qr2:25fc29 | profiler.js:266 | wrong | the error does propagate; `store.close()` in `cleanupResources` closes the cores opened from it |
| qr2:c2e0d3 | scratch.ts:33 | noise | every caller passes a path from `scratchFolderFor` |
| qr2:c5ef15 | scratch.ts:80 | wrong | `kill(pid, 0)` returns ESRCH, not EPERM, for a missing process |
| qr2:1a88ce | scratch.ts:111 | wrong | putBack failures are collected and rethrown |
| qr2:152683 | run-consumer-external.ts:38 | **match C28** | see above |
| qr2:59e0a7 | run-consumer-external.ts:43 | partial C27 | see above |
| qr2:852e92 | local-broker.ts:180-190 (anchor resolved to 37) | noise | swallowing errors in best-effort shutdown is intended |
| qr2:ed344a | local-broker.ts:125 | noise | hardcoded command; flagged as a hypothetical injection |
| qr2:0c3669 | local-broker.ts:173 | wrong | confused description (it concedes "this is actually correct behavior") |
| qr2:ee5e04 | local-broker.ts:178 | partial C29/C31 | see above |
| qr2:7b76b9 | local-broker.ts:188 | noise | `close()` callbacks not awaited, with no consequence shown |

## Files

- `state-local/`: findings and the per-call cache of this run
- `FINDINGS.md`, `run-log.json`, `selection.json`, `run.log`: the run's report output and CLI log
  (Carlo started the qvac server himself for this run, so its log is in his terminal, not here)
- `p2p-download-attempt.log`: the aborted download from the QVAC P2P registry
- `local/qvac.kat.config.json`: the serve config (loads the GGUF by path)
