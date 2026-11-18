# QVAC findings: curated summary

**Target:** `tetherto/qvac@0c8a1510ab4f` · **Scope:** JS/TS sources of all packages + registry server (1,013 files, top 40 by risk reviewed) · **Date:** 2026-11-18

This is the human-written summary. The complete generated report, including the 27 agent-confirmed leads that I have not verified myself, is [`results/FINDINGS.md`](results/FINDINGS.md). Every finding below is tracked as an issue in this repository; the issue carries the full evidence, the verifier's reasoning, my verification note and the duplicate searches.

**Evidence levels:** **R** = reproduced by an executed script in [`verification/`](verification/) (outputs in [`verification/outputs.md`](verification/outputs.md)) · **C** = verified by reading the cited code paths and callers, not executed.

## Ranked findings

| # | Finding | Where | Sev. | Evidence | Issue |
|---|---|---|---|---|---|
| 1 | `deviceDefaults` for audiogen, classification, bci and onnx-tts are silently stripped by the config schema | `inference/src/schemas/config.ts:54` | medium | R | [#1](https://github.com/carlocifarelli/qvac-quality-review/issues/1) |
| 2 | `addModel` hangs forever when two ingests overlap or the reseed tracker is destroyed | `registry-server/lib/registry-service.js:866`, `reseed-tracker.js:135,140` | medium | R | [#2](https://github.com/carlocifarelli/qvac-quality-review/issues/2) |
| 3 | `fillFitBlobs` writes back a stale record, undoing concurrent metadata edits and re-ingests | `registry-server/lib/registry-service.js:1432` | medium | C | [#3](https://github.com/carlocifarelli/qvac-quality-review/issues/3) |
| 4 | Cancel with `clearCache` during a registry transfer leaves the multi-GB partial on disk | `inference/src/handlers/load-model/registry.ts:396,567` | medium | C | [#4](https://github.com/carlocifarelli/qvac-quality-review/issues/4) |
| 5 | Archives that wrap shards in a folder extract fine, then fail to load | `inference/src/utils/archive.ts:292` | medium | R | [#5](https://github.com/carlocifarelli/qvac-quality-review/issues/5) |
| 6 | A `mkdirSync` error during extraction escapes the promise: unhandled rejection and a hung load | `inference/src/utils/archive.ts:170` | medium | R | [#6](https://github.com/carlocifarelli/qvac-quality-review/issues/6) |
| 7 | Docs say "first matching device pattern wins"; the code makes the last one win | `inference/src/schemas/config.ts:226` | low | R | [#7](https://github.com/carlocifarelli/qvac-quality-review/issues/7) |
| 8 | Test-suite commands exit 0 when the runner is killed by a signal (3 commands) | `test-suite/src/cli/commands/run-consumer-{external,desktop,electron}.ts` | low | R | [#8](https://github.com/carlocifarelli/qvac-quality-review/issues/8) |
| 9 | `MetricsServer` turns port 0 into 9210, so the integration tests collide | `registry-server/lib/metrics-server.js:14` | low | C | [#9](https://github.com/carlocifarelli/qvac-quality-review/issues/9) |

### Why this order

Ranking = verified severity × confidence × verification state, nudged by churn (see README). I agree with the order except one judgement call: I would put **#2 first** for a registry operator, because a hung RPC also leaks a model-sized temp download. The formula keeps #1 on top because it affects every SDK user who configures device overrides, and its file changed 14 times in six months.

### Impact, uncertainty and next action

1. **deviceDefaults stripped.** *Impact:* an Android/iOS override written to avoid a GPU crash is ignored without a warning for 4 of 17 model types. *Uncertainty:* low; reproduced, and dispatch resolves config for every type. *Next:* derive the schema keys from `ModelType`/`CANONICAL_TO_ALIAS`, or make the object `.strict()` so unknown keys fail loudly; add a test that iterates all model types.
2. **addModel hang.** *Impact:* with blind peers configured, the second of two concurrent add-model RPCs, or any ingest during `reseed()`/close, never returns; its temp download is never cleaned. *Uncertainty:* low for the mechanism (reproduced on the real `ReseedTracker`); frequency depends on how often ingests overlap. *Next:* share one in-flight promise per tracker and reject waiters in `destroy()`; regression test with two waiters.
3. **fillFitBlobs lost update.** *Impact:* edits made during a long backfill are silently reverted; a re-ingest can be pointed back at old weights. *Uncertainty:* medium; not executed (needs an Autobase/HyperDB fixture), but the code path has no lock or version check. *Next:* re-read the record before appending and skip if its `blobBinding.sha256` changed.
4. **clearCache leaves partials.** *Impact:* "cancel and clear" frees nothing for registry downloads cancelled mid-transfer. *Uncertainty:* medium; not executed against a live registry. The upstream test for this path stubs exactly the plain `Error('Download cancelled')` and never checks the `.part` file. *Next:* treat `ctx.signal.aborted` as a cancel in both catch blocks (as line 468 already does); extend that test to assert deletion.
5. **Nested-folder shards.** *Impact:* any archive made with `tar czf x.tar.gz dir/` fails, and on HTTP each retry downloads it again. *Uncertainty:* whether official archives are ever packed this way; third-party ones are. *Next:* flatten entries to their basename on extraction.
6. **mkdirSync escape.** *Impact:* a disk-level error (EACCES, ENOSPC, a file where a folder is expected) becomes an unhandled rejection; the load never settles and later loads of the same archive join the hung promise. *Uncertainty:* low; reproduced, and it crashed the test runner before handlers were added. *Next:* wrap the entry handler body in try/catch and `settle(err)`.
7. **Docs vs merge order.** *Impact:* users who follow the docs get the general pattern instead of the specific one. *Uncertainty:* none about the mismatch; which side is "right" is the maintainers' call. *Next:* fix the JSDoc (the in-code comment already says "later overrides earlier").
8. **Signal exit 0.** *Impact:* CI counts an OOM-killed or crashed consumer run as passed. *Uncertainty:* low. *Next:* use the pattern already in `external-consumer.ts:105` in all three commands.
9. **Port 0.** *Impact:* flaky registry integration tests when port 9210 is taken. *Uncertainty:* low; test-only. *Next:* `??` instead of `||`.

## Investigated and rejected

| Candidate | Rejected by | Why |
|---|---|---|
| Concurrent downloads from one Hyperdrive share a corestore that the first finisher deletes (`hyperdrive.ts:374`) | me, after dedupe | Real, but **already known**: merged PR [tetherto/qvac#5689](https://github.com/tetherto/qvac/pull/5689) lists it under "Known limits". Not a new finding. |
| Registry client joins swarm topics and never leaves them, piling up DHT lookups (`client.js:361`) | verifier agent | Joins are client-only (no announce), and hyperswarm reuses one discovery per topic and de-duplicates refreshes, so lookups do not accumulate per download. I had rated this as likely; the verifier was right. |
| Cancelling during checksum verification publishes the file and resolves as success (`registry-download-utils.ts:165`) | verifier agent | The caller never sees that result: the download manager settles the subscriber with a cancellation and aborts the transfer as soon as the user cancels. |
| `adb` command built by string interpolation in the test-suite (`process-manager.ts:231`) | me | No trust boundary: the values come from the operator's own config on their own machine. |
| Port 0 replaced by 9210 (`metrics-server.js:14`), first assessment | me, then reversed | I rejected it as unreachable in production; the verifier showed the integration tests depend on it. Now finding #9. |
| `ModelNotFoundError` message missing a quote (`get-model-info.ts:41`) | me | Real but cosmetic. |
| Two more test-suite commands with the same `process.exit(code || 0)` | me | Same root cause as #8; folded into it. |
| 3 others | verifier agent | Listed with reasons in `results/FINDINGS.md` ("Rejected"). |

## Duplicate searches (2026-11-18)

98 GitHub searches over `tetherto/qvac` issues and pull requests, open and closed (`is:issue` and `is:pull-request` per phrase), using the verifier's suggested phrases plus the file name. Every query, its timestamp, hit count and top results are stored per finding in `state/findings.json` and printed in each issue. I read the hits that looked related:

- **PR #5689** (merged): download locking. Explains the rejected Hyperdrive item above; its tests cover `clearCache` for HTTP but not mid-transfer registry cancels (relevant to #4, not a duplicate).
- **Issue #3218** (closed): cancelled registry downloads leak hypercore *blocks*. Different resource from #4 (the `.part` file on disk).
- **Issue #5677** (open): a failed download truncates a cached file. Different trigger (timeout, pre-#5689 behaviour) from #4.
- No hits for #1, #2, #3, #5, #6, #7, #8, #9 beyond unrelated matches on generic words.

Keyword search cannot prove absence; the log is there so a reader can judge.
