# QVAC findings: curated summary

**Target:** `tetherto/qvac@0c8a1510ab4f` · **Scope:** JS/TS sources of all packages + registry server (1,013 files, top 40 by risk reviewed) · **Date:** 2026-11-18

This is the human-written summary. The generated report is [`results/FINDINGS.md`](results/FINDINGS.md). Every one of the 47 candidates the pipeline produced has a human decision: **31 confirmed** (each tracked as an issue in this repository, #1 to #31) and **16 rejected** (listed below with reasons). One more finding, **#32**, was found afterwards by the deterministic `qvac-quality` rules written from these findings (see the README, "Deterministic rules"); all 22 rule hits are triaged in `state/rules-baseline.json`. Each issue carries the full evidence, the verifier's reasoning, my verification note and the duplicate searches.

**Evidence levels:** **R** = reproduced by an executed script in [`verification/`](verification/) (outputs in [`verification/outputs.md`](verification/outputs.md)) · **C** = verified by reading the cited code paths and callers, not executed.

## Ranked findings: medium severity

| # | Finding | Where | Evidence | Issue |
|---|---|---|---|---|
| 1 | `deviceDefaults` for audiogen, classification, bci and onnx-tts are silently stripped by the config schema | `inference/src/schemas/config.ts:54` | R | [#1](https://github.com/carlocifarelli/qvac-quality-review/issues/1) |
| 2 | `addModel` hangs forever when two ingests overlap or the reseed tracker is destroyed | `registry-server/lib/registry-service.js:866`, `reseed-tracker.js:135,140` | R | [#2](https://github.com/carlocifarelli/qvac-quality-review/issues/2) |
| 3 | `fillFitBlobs` writes back a stale record, undoing concurrent metadata edits and re-ingests | `registry-server/lib/registry-service.js:1432` | C | [#3](https://github.com/carlocifarelli/qvac-quality-review/issues/3) |
| 4 | Cancel with `clearCache` during a registry transfer leaves the multi-GB partial on disk | `inference/src/handlers/load-model/registry.ts:396,567` | C | [#4](https://github.com/carlocifarelli/qvac-quality-review/issues/4) |
| 5 | An abort during the Hyperdrive file lookup is lost, so the download never settles | `inference/src/handlers/load-model/hyperdrive.ts:481` | R | [#11](https://github.com/carlocifarelli/qvac-quality-review/issues/11) |
| 6 | Failed or cancelled **seed** downloads never close the corestore; a retry cannot reopen it | `inference/src/handlers/load-model/hyperdrive.ts:370,711` | C | [#14](https://github.com/carlocifarelli/qvac-quality-review/issues/14) |
| 7 | Archives that wrap shards in a folder extract fine, then fail to load | `inference/src/utils/archive.ts:292` | R | [#5](https://github.com/carlocifarelli/qvac-quality-review/issues/5) |
| 8 | A `mkdirSync` error during extraction escapes the promise: unhandled rejection and a hung load | `inference/src/utils/archive.ts:170` | R | [#6](https://github.com/carlocifarelli/qvac-quality-review/issues/6) |

### Why this order

Ranking = verified severity × confidence × verification state, nudged by churn (see README). I agree with the order except one judgement call: I would put **#2 first** for a registry operator, because a hung RPC also leaks a model-sized temp download. The formula keeps #1 on top because it affects every SDK user who configures device overrides, and its file changed 14 times in six months.

### Impact, uncertainty and next action

1. **deviceDefaults stripped.** *Impact:* an Android/iOS override written to avoid a GPU crash is ignored without a warning for 4 of 17 model types. *Uncertainty:* low; reproduced, and dispatch resolves config for every type. *Next:* derive the schema keys from `ModelType`/`CANONICAL_TO_ALIAS`, or make the object `.strict()` so unknown keys fail loudly; add a test that iterates all model types.
2. **addModel hang.** *Impact:* with blind peers configured, the second of two concurrent add-model RPCs, or any ingest during `reseed()`/close, never returns; its temp download is never cleaned. *Uncertainty:* low for the mechanism (reproduced on the real `ReseedTracker`); frequency depends on how often ingests overlap. *Next:* share one in-flight promise per tracker and reject waiters in `destroy()`; regression test with two waiters.
3. **fillFitBlobs lost update.** *Impact:* edits made during a long backfill are silently reverted; a re-ingest can be pointed back at old weights. *Uncertainty:* medium; not executed (needs an Autobase/HyperDB fixture), but the code path has no lock or version check. *Next:* re-read the record before appending and skip if its `blobBinding.sha256` changed.
4. **clearCache leaves partials.** *Impact:* "cancel and clear" frees nothing for registry downloads cancelled mid-transfer. *Uncertainty:* medium; not executed against a live registry. The upstream test for this path stubs exactly the plain `Error('Download cancelled')` and never checks the `.part` file. *Next:* treat `ctx.signal.aborted` as a cancel in both catch blocks (as line 468 already does); extend that test to assert deletion.
5. **Hyperdrive abort lost.** *Impact:* a user who cancels while the drive entry is still resolving waits forever (or until the swarm happens to end the stream); the download keeps its lock and corestore. *Uncertainty:* the stub models a suspended swarm; with real peers the symptom may be a slow cancel rather than a hang. *Next:* check `signal.aborted` right after adding the listener, or use `AbortSignal.any` from the start.
6. **Seed corestore never closed.** *Impact:* for users who opt into seeding, a failed or cancelled download keeps Corestore, Hyperdrive and a suspended swarm open; a retry hits the held storage lock and `clearCache` removes a directory still in use. *Uncertainty:* medium; not executed. *Next:* close on error/abort even when `seed` is set; keep it open only on success.
7. **Nested-folder shards.** *Impact:* any archive made with `tar czf x.tar.gz dir/` fails, and on HTTP each retry downloads it again. *Uncertainty:* whether official archives are ever packed this way; third-party ones are. *Next:* flatten entries to their basename on extraction.
8. **mkdirSync escape.** *Impact:* a disk-level error (EACCES, ENOSPC, a file where a folder is expected) becomes an unhandled rejection; the load never settles and later loads of the same archive join the hung promise. *Uncertainty:* low; reproduced, and it crashed the test runner before handlers were added. *Next:* wrap the entry handler body in try/catch and `settle(err)`.

## Ranked findings: low severity

Each row gives the impact and the next action in one line; the issue has the evidence and the uncertainty.

| # | Finding | Where | Ev. | Impact → next action | Issue |
|---|---|---|---|---|---|
| 9 | Docs say "first matching device pattern wins"; the code makes the last one win | `inference/src/schemas/config.ts:226` | R | Users following the docs get the general pattern → fix the JSDoc | [#7](https://github.com/carlocifarelli/qvac-quality-review/issues/7) |
| 10 | `getModelByName('constructor')` returns `Object`, not `undefined` | `inference/src/models/update-models/codegen.ts:233` | R | Confusing downstream error instead of "not found" → `Object.hasOwn` in codegen | [#12](https://github.com/carlocifarelli/qvac-quality-review/issues/12) |
| 11 | `closeOnParentExit` interval survives a failed start and can later `process.exit(0)` the caller | `ai-sdk-provider/src/managed/index.ts:295` | C | A caller that handled the error is killed later → `clearInterval` in the catch | [#15](https://github.com/carlocifarelli/qvac-quality-review/issues/15) |
| 12 | Abort during the state-dir `await` is lost; the fitter still starts | `inference/src/model-fit/run/run.ts:218` | C | Cancel waits up to 30 s → re-check `signal.aborted` after the await | [#16](https://github.com/carlocifarelli/qvac-quality-review/issues/16) |
| 13 | Test-suite commands exit 0 when the runner is killed by a signal (3 commands) | `test-suite/src/cli/commands/run-consumer-{external,desktop,electron}.ts` | R | CI counts a crashed run as passed → copy `external-consumer.ts:105` | [#8](https://github.com/carlocifarelli/qvac-quality-review/issues/8) |
| 14 | `MetricsServer` turns port 0 into 9210 | `registry-server/lib/metrics-server.js:14` | C | Flaky integration tests → `??` instead of `\|\|` | [#9](https://github.com/carlocifarelli/qvac-quality-review/issues/9) |
| 15 | Profiler throughput divides swarm-lifetime bytes by transfer-only time | `registry-server/client/lib/profiler.js:46` | C | Inflated rx/tx rates in the diagnostic tool → subtract a baseline at transfer start | [#17](https://github.com/carlocifarelli/qvac-quality-review/issues/17) |
| 16 | Download stats count bytes already on disk (resumes, cached shards) | `inference/src/handlers/load-model/download-stats.ts:61` | C | Wrong telemetry → count deltas from the first progress event | [#18](https://github.com/carlocifarelli/qvac-quality-review/issues/18) |
| 17 | Inner addon version mismatch is blamed on the platform package | `sdk/src/commands/verify/prebuilds.ts:105` | C | Hint suggests a pin that cannot fix it → separate field for the inner addon | [#19](https://github.com/carlocifarelli/qvac-quality-review/issues/19) |
| 18 | `addModel` reports failure after the model is committed when replication stalls | `registry-server/lib/registry-service.js:861` | C | Client retries a successful ingest → log the replication timeout, don't fail the RPC | [#20](https://github.com/carlocifarelli/qvac-quality-review/issues/20) |
| 19 | `broker.pid` holds the CLI's own PID; Windows shutdown force-kills the CLI | `test-suite/src/cli/utils/local-broker.ts:178` | C | Exit code lost on Windows → don't write the own PID to the tracked dir | [#10](https://github.com/carlocifarelli/qvac-quality-review/issues/10) |
| 20 | `close()` during a background stop lets a pending call start a new worker | `sdk/src/client/rpc/node-rpc-client.ts:482` | C | A worker outlives `close()` → bump `generation` before awaiting | [#21](https://github.com/carlocifarelli/qvac-quality-review/issues/21) |
| 21 | `setupHyperdrive` leaks the corestore when `drive.ready()` throws | `inference/src/handlers/load-model/hyperdrive.ts:85` | C | Open storage after corrupt-drive errors → try/catch closing the corestore | [#22](https://github.com/carlocifarelli/qvac-quality-review/issues/22) |
| 22 | A cached Core ML set missing a bundle is reused forever | `inference/src/handlers/load-model/coreml-sidecars.ts:207` | C | Later-ingested bundles never staged → don't cache partial sets | [#23](https://github.com/carlocifarelli/qvac-quality-review/issues/23) |
| 23 | Deleting a model keeps Core ML sidecar blobs if a staged file is missing | `inference/src/handlers/load-model/coreml-sidecars.ts:216` | C | Disk leak on Apple devices → collect bindings from the catalog, not the staged copy | [#24](https://github.com/carlocifarelli/qvac-quality-review/issues/24) |
| 24 | An IPv6 `serveHost` builds an invalid health URL; every start times out | `ai-sdk-provider/src/managed/serve-process.ts:361` | C | `::1` unusable → bracket IPv6 hosts | [#13](https://github.com/carlocifarelli/qvac-quality-review/issues/13) |
| 25 | Lock steal is check-then-delete; two waiters can both win | `ai-sdk-provider/src/managed/index.ts:100` | C | Duplicate serves → rename-to-tombstone before `rm` | [#25](https://github.com/carlocifarelli/qvac-quality-review/issues/25) |
| 26 | A lock whose dead owner's PID was reused is never stolen | `ai-sdk-provider/src/managed/index.ts:99` | C | Starts time out after a crash + reboot → store and compare process start time | [#26](https://github.com/carlocifarelli/qvac-quality-review/issues/26) |
| 27 | Scratch folder is visible before `owner.pid` exists; a concurrent cleanup deletes it | `sdk/src/commands/bundle/scratch.ts:27` | C | Parallel bundles break each other → write `owner.pid` in a temp dir, then rename | [#27](https://github.com/carlocifarelli/qvac-quality-review/issues/27) |
| 28 | Ctrl+C reaches the runner twice; graceful shutdown is cut off | `test-suite/src/cli/commands/run-consumer-external.ts:43` | R | Interrupted runs skip cleanup and report 0 → don't re-forward SIGINT to the same process group | [#28](https://github.com/carlocifarelli/qvac-quality-review/issues/28) |
| 29 | Metrics server's only `error` listener is a settled promise's `reject` | `registry-server/lib/metrics-server.js:50` | C | Runtime server errors vanish → swap in a logging listener after listen | [#29](https://github.com/carlocifarelli/qvac-quality-review/issues/29) |
| 30 | Stale `.pid` files are never removed; a rerun signals reused PIDs | `test-suite/src/cli/utils/process-manager.ts:106` | C | Can SIGTERM unrelated processes → delete on child exit | [#30](https://github.com/carlocifarelli/qvac-quality-review/issues/30) |
| 31 | `spawnTracked` has no `error` listener; a missing binary crashes the CLI | `test-suite/src/cli/utils/process-manager.ts:67` | R | Cleanup skipped, pid file says "undefined" → add an `error` listener that rejects | [#31](https://github.com/carlocifarelli/qvac-quality-review/issues/31) |
| 32 | Fit-stub fetch ignores a signal that is already aborted (found by rule `abort-signal-race`) | `inference/src/model-fit/description/fetch.ts:181` | C | A cancelled load waits up to 40 s → `if (options.signal?.aborted) onAbort()` after adding the listener | [#32](https://github.com/carlocifarelli/qvac-quality-review/issues/32) |

## Investigated and rejected

| Candidate | Rejected by | Why |
|---|---|---|
| Concurrent downloads from one Hyperdrive share a corestore that the first finisher deletes (`hyperdrive.ts:374`) | me, after dedupe | Real, but **already known**: merged PR [tetherto/qvac#5689](https://github.com/tetherto/qvac/pull/5689) lists it under "Known limits". |
| Blind peering and `reseed()` mirror the legacy `models` core instead of the active generation (`registry-service.js:451`) | me, after dedupe | Code reads as described, but merged PR [tetherto/qvac#4379](https://github.com/tetherto/qvac/pull/4379) and `docs/BLOB_CORE_ROTATION.md:59-67` hand rotated cores to a separate production reseeding workflow. A documented design choice. The verifier had rated it medium. |
| Registry client joins swarm topics and never leaves them (`client.js:361`) | verifier agent | Joins are client-only, and hyperswarm reuses one discovery per topic. I had rated this as likely; the verifier was right. |
| Cancelling during checksum verification resolves as success (`registry-download-utils.ts:165`) | verifier agent | The download manager settles the subscriber with a cancellation as soon as the user cancels. |
| Abort listener in `_streamBlobToFile` is never removed (`client.js:760`) | me | True, but every in-repo caller passes a per-operation signal, so at most 4 listeners holding destroyed streams. One-line hygiene fix, not a finding. |
| `runFfmpeg` cannot be cancelled (`cli/src/serve/lib/ffmpeg.ts:38`) | me | Bounded by the 5-minute kill timeout and the output is only discarded. A feature request. |
| Profiler cleanup skips steps if `swarm.destroy()` rejects (`profiler.js:185`) | me | Needs a teardown rejection I could not show happens; impact is a temp dir in a diagnostic CLI. |
| OpenAI-coverage cache: unwritable dir fails the run; spec/sha/etag not replaced together (`parse-spec.ts:129,169`) | me | Both real, both loud, in a maintainer-only report tool. Below the bar. |
| `adb` command built by string interpolation (`process-manager.ts:231`) | me | No trust boundary: the values come from the operator's own config. |
| `ModelNotFoundError` message missing a quote (`get-model-info.ts:41`) | me | Real but cosmetic. |
| Two more test-suite commands with the same `process.exit(code \|\| 0)` | me | Same root cause as #8; folded into it. |
| Port 0 replaced by 9210, first assessment | me, then reversed | I rejected it as unreachable in production; the verifier showed the integration tests depend on it. Now #9. |
| 3 others (device.log fd, `stopServe` early return, profiler setup leak) | verifier agent | Reasons in `results/FINDINGS.md` ("Rejected"). |

## Duplicate searches (2026-11-18)

334 GitHub searches over `tetherto/qvac` issues and pull requests, open and closed (`is:issue` and `is:pull-request` per phrase), using the verifier's suggested phrases plus the file name. Every query, its timestamp, hit count and top results are stored per finding in `state/findings.json` (for #32, which did not come from the agent, in the issue itself) and printed in each issue. I read the hits that looked related:

- **PR #5689** (merged): download locking. Explains the rejected Hyperdrive item above; its tests cover `clearCache` for HTTP but not mid-transfer registry cancels (relevant to #4, not a duplicate).
- **PR #4379** (merged): blob-core rotation. Explains the rejected blind-peering item above.
- **Issue #3218** (closed): cancelled registry downloads leak hypercore *blocks*. Different resource from #4 (the `.part` file on disk).
- **Issue #5677** (open): a failed download truncates a cached file. Different trigger from #4.
- **PR #5707** (closed): shared registry store; fixes a lock leak in `close()` during a cold open, not the corestore leaks in #14 and #22.
- **PR #5620** (open): drops a rejected `getRPC()` promise from the cache in `rpc-client.ts`. Same area as #21, different defect.
- No related hits for the other findings beyond matches on generic words.

Keyword search cannot prove absence; the log is there so a reader can judge.
