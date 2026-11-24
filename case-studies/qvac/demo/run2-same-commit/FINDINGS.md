# Findings for tetherto/qvac@0c8a1510ab4f

Generated 2026-11-18T08:34:33.755Z. 10 confirmed by a human, 27 confirmed by the verifier agent only, 1 uncertain, 0 unverified, 9 rejected, 0 no longer present. 47 first seen at this commit.

## Confirmed: human-verified (ranked)
| # | Score | Severity | Category | Location | Finding | Tracked |
|---|---|---|---|---|---|---|
| 1 | 5.93 | medium | correctness | [packages/inference/src/schemas/config.ts:54](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/inference/src/schemas/config.ts#L54) | deviceDefaults entries for onnx-tts, bci, audiogen and classification models are silently dropped during config parsing | - |
| 2 | 5.49 | medium | concurrency | [packages/registry-server/lib/registry-service.js:866](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/registry-server/lib/registry-service.js#L866) | addModel can hang forever in reseedTracker.waitForComplete when two ingests overlap, or when the tracker is destroyed | - |
| 3 | 5.49 | medium | concurrency | [packages/registry-server/lib/registry-service.js:1432](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/registry-server/lib/registry-service.js#L1432) | fillFitBlobs writes back a stale model snapshot, overwriting concurrent metadata updates and re-ingests | - |
| 4 | 5.25 | medium | error-handling | [packages/inference/src/handlers/load-model/registry.ts:567](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/inference/src/handlers/load-model/registry.ts#L567) | Cancelling with clearCache during a registry transfer leaves the partial file or shard directory on disk | - |
| 5 | 3.46 | medium | concurrency | [packages/inference/src/handlers/load-model/hyperdrive.ts:374](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/inference/src/handlers/load-model/hyperdrive.ts#L374) | Corestore dir is keyed per drive but the lock is per file, so concurrent downloads from one drive collide and one deletes the other's store | - |
| 6 | 3.15 | medium | correctness | [packages/inference/src/utils/archive.ts:292](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/inference/src/utils/archive.ts#L292) | Shards inside a top-level folder are extracted but never found, so the load fails | - |
| 7 | 3.15 | medium | error-handling | [packages/inference/src/utils/archive.ts:170](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/inference/src/utils/archive.ts#L170) | Synchronous mkdirSync throw inside tar-stream 'entry' listener escapes the promise as an uncaught exception | - |
| 8 | 1.98 | low | api-contract | [packages/inference/src/schemas/config.ts:226](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/inference/src/schemas/config.ts#L226) | Documented 'first matching pattern wins' contradicts the implementation, where every match is merged and the last one wins | - |
| 9 | 1.4 | low | error-handling | [packages/test-suite/src/cli/commands/run-consumer-external.ts:47](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/test-suite/src/cli/commands/run-consumer-external.ts#L47) | Runner killed by a signal (OOM, SIGKILL, crash) is reported as exit code 0 | - |
| 10 | 1.4 | low | correctness | [packages/registry-server/lib/metrics-server.js:14](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/registry-server/lib/metrics-server.js#L14) | port 0 (ephemeral) is silently replaced by fixed port 9210 | - |

## Confirmed by the verifier agent, not yet human-verified (ranked)
Treat as leads: the adversarial pass could not disprove them, but nobody has reproduced them yet.

| # | Score | Severity | Category | Location | Finding | Tracked |
|---|---|---|---|---|---|---|
| 1 | 3.84 | medium | correctness | [packages/registry-server/lib/registry-service.js:451](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/registry-server/lib/registry-service.js#L451) | Blind-peering setup and reseed mirror the legacy 'models' core instead of the active generation's core | - |
| 2 | 3.75 | medium | correctness | [packages/test-suite/src/cli/utils/local-broker.ts:178](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/test-suite/src/cli/utils/local-broker.ts#L178) | broker.pid records the CLI's own PID, so shutdown on Windows force-kills the CLI before its own cleanup runs | - |
| 3 | 3.46 | medium | concurrency | [packages/inference/src/handlers/load-model/hyperdrive.ts:481](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/inference/src/handlers/load-model/hyperdrive.ts#L481) | Abort during file lookup or metadata fetch is missed, so the hyperdrive transfer hangs and keeps the lock and corestore | - |
| 4 | 3.46 | medium | resource-leak | [packages/inference/src/handlers/load-model/hyperdrive.ts:370](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/inference/src/handlers/load-model/hyperdrive.ts#L370) | Failed or cancelled seed downloads never close the corestore; a retry cannot reopen it and clearCache deletes the dir while it is still open | - |
| 5 | 3.46 | medium | correctness | [packages/ai-sdk-provider/src/managed/index.ts:99](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/ai-sdk-provider/src/managed/index.ts#L99) | A lock whose dead owner's pid gets reused is never stolen, so starts on that fleet key time out until that unrelated process exits | - |
| 6 | 1.83 | low | resource-leak | [packages/registry-server/client/lib/client.js:760](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/registry-server/client/lib/client.js#L760) | The abort listener added in _streamBlobToFile is never removed, so listeners and stream references build up on the caller's signal | - |
| 7 | 1.75 | low | correctness | [packages/inference/src/models/update-models/codegen.ts:233](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/inference/src/models/update-models/codegen.ts#L233) | getModelByName returns Object.prototype members for names like "constructor", "toString" or "__proto__" instead of undefined | - |
| 8 | 1.65 | low | resource-leak | [packages/ai-sdk-provider/src/managed/index.ts:295](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/ai-sdk-provider/src/managed/index.ts#L295) | The closeOnParentExit interval is never cleared when startup fails and can later process.exit() the caller | - |
| 9 | 1.5 | low | correctness | [packages/inference/src/model-fit/run/run.ts:218](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/inference/src/model-fit/run/run.ts#L218) | An abort that fires during the state-dir await is lost: the fitter still starts and the caller waits up to 30 s instead of getting 'cancelled' | - |
| 10 | 1.4 | low | correctness | [packages/registry-server/client/lib/profiler.js:46](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/registry-server/client/lib/profiler.js#L46) | Throughput rates divide swarm-lifetime byte counters by download-only elapsed time, inflating rx/tx per second | - |
| 11 | 1.4 | low | correctness | [packages/inference/src/handlers/load-model/download-stats.ts:61](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/inference/src/handlers/load-model/download-stats.ts#L61) | totalBytesDownloaded/downloadSpeedBps count bytes that were already on disk (resumed partials, cached shards) | - |
| 12 | 1.31 | low | correctness | [packages/sdk/src/commands/verify/prebuilds.ts:105](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/sdk/src/commands/verify/prebuilds.ts#L105) | A mismatch in the inner addon is blamed on the platform package, which leads to a wrong message and a pin that cannot fix it | - |
| 13 | 1.28 | low | error-handling | [packages/registry-server/lib/registry-service.js:861](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/registry-server/lib/registry-service.js#L861) | addModel reports failure after the model is already committed when blind-peer replication stalls | - |
| 14 | 1.25 | low | concurrency | [packages/sdk/src/client/rpc/node-rpc-client.ts:482](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/sdk/src/client/rpc/node-rpc-client.ts#L482) | close() returns early on a background-stop promise without bumping generation, so a pending getRPC starts a new worker after close() resolved | - |
| 15 | 1.15 | low | resource-leak | [packages/inference/src/handlers/load-model/hyperdrive.ts:85](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/inference/src/handlers/load-model/hyperdrive.ts#L85) | setupHyperdrive leaks an opened Corestore when Hyperdrive.ready() throws | - |
| 16 | 1.15 | low | correctness | [packages/inference/src/handlers/load-model/coreml-sidecars.ts:207](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/inference/src/handlers/load-model/coreml-sidecars.ts#L207) | A cached Core ML set that is missing a bundle is reused forever, so bundles ingested later are never staged | - |
| 17 | 1.15 | low | resource-leak | [packages/inference/src/handlers/load-model/coreml-sidecars.ts:216](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/inference/src/handlers/load-model/coreml-sidecars.ts#L216) | Deleting a model leaves its Core ML sidecar blobs in storage when any staged sidecar file is missing or partial | - |
| 18 | 1.15 | low | correctness | [packages/ai-sdk-provider/src/managed/serve-process.ts:361](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/ai-sdk-provider/src/managed/serve-process.ts#L361) | An IPv6 serveHost builds an invalid health URL, so every start times out | - |
| 19 | 1.15 | low | concurrency | [packages/ai-sdk-provider/src/managed/index.ts:100](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/ai-sdk-provider/src/managed/index.ts#L100) | Stealing a dead owner's lock is check-then-delete, so two waiters can both 'win' and spawn duplicate serves | - |
| 20 | 1.11 | low | error-handling | [packages/cli/src/openai/coverage/parse-spec.ts:129](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/cli/src/openai/coverage/parse-spec.ts#L129) | Live spec fetch fails outright when the cache directory isn't writable, even though the download succeeded | - |
| 21 | 1.11 | low | concurrency | [packages/cli/src/openai/coverage/parse-spec.ts:169](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/cli/src/openai/coverage/parse-spec.ts#L169) | Spec, SHA and ETag cache files are updated separately, so an interrupted or concurrent run leaves a hash-mismatched cache | - |
| 22 | 0.98 | low | concurrency | [packages/sdk/src/commands/bundle/scratch.ts:27](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/sdk/src/commands/bundle/scratch.ts#L27) | Scratch folder is visible before its owner.pid is written, so a concurrent removeStaleScratch can delete a live bundle's scratch | - |
| 23 | 0.98 | low | concurrency | [packages/test-suite/src/cli/commands/run-consumer-external.ts:43](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/test-suite/src/cli/commands/run-consumer-external.ts#L43) | Ctrl+C sends SIGINT to the runner twice, and the second one kills it during graceful shutdown | - |
| 24 | 0.98 | low | error-handling | [packages/registry-server/lib/metrics-server.js:50](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/registry-server/lib/metrics-server.js#L50) | Server 'error' listener left as a stale promise reject, so runtime server errors are swallowed | - |
| 25 | 0.98 | low | resource-leak | [packages/cli/src/serve/lib/ffmpeg.ts:38](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/cli/src/serve/lib/ffmpeg.ts#L38) | runFfmpeg has no cancellation path: aborted requests/jobs leave ffmpeg running until exit or the 5-minute timeout | - |
| 26 | 0.88 | low | correctness | [packages/test-suite/src/cli/utils/process-manager.ts:106](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/test-suite/src/cli/utils/process-manager.ts#L106) | Stale .pid files are never removed, so killTracked can SIGTERM unrelated processes that reused those PIDs | - |
| 27 | 0.88 | low | error-handling | [packages/test-suite/src/cli/utils/process-manager.ts:67](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/test-suite/src/cli/utils/process-manager.ts#L67) | spawnTracked has no 'error' listener, so a failed spawn crashes the CLI and skips cleanup | - |

## Uncertain (needs a human or a runtime test)
| # | Score | Severity | Category | Location | Finding | Tracked |
|---|---|---|---|---|---|---|
| 1 | 0.49 | low | error-handling | [packages/registry-server/client/lib/profiler.js:185](https://github.com/tetherto/qvac/blob/0c8a1510ab4fe89893de174b07eb4901a2f3e9fd/packages/registry-server/client/lib/profiler.js#L185) | cleanupResources skips store close and temp-dir removal if swarm.destroy() rejects, and masks the original error | - |

## Rejected
| Location | Claim | Why rejected |
|---|---|---|
| packages/inference/src/handlers/load-model/registry-download-utils.ts:165 | Cancelling during post-download size/checksum verification is ignored: the file is published and the call resolves as success | The headline claim, that the call resolves as success and the load continues, is false. It is true that downloadSingleFileFromRegistry (registry-download-utils.ts:105-176) checks the signal only at entry and in the registry client. measureChecksum (utils/checksum.ts:91) takes no signal. But callers never see the inner task's return value directly. downloadModelFromRegistry wraps the work in startO |
| packages/registry-server/client/lib/client.js:361 | Blob-core swarm topics are joined on every download and retry but never left, so DHT discovery sessions pile up | The literal fact holds: client.js:310, 361 and 465 call hyperswarm.join(core.discoveryKey, {client:true, server:false}) and nothing in client.js calls leave(). _doReleaseDownload (578-612) only closes blobs and core, and the swarm is torn down only in _close (837). But the claimed impact does not survive a read of hyperswarm 4.17.2:  1) Nothing is announced. Every join is client:true, server:false |
| packages/test-suite/src/cli/utils/process-manager.ts:231 | Shell command built by interpolating the device serial and package name into execSync | No trust boundary. The serial and package name come from the operator's own test-suite config/CLI on a developer or CI machine; whoever controls them can already run arbitrary commands. Using execFile would be tidier, but this is not a security finding worth a maintainer's time. |
| packages/test-suite/src/cli/utils/process-manager.ts:212 | Parent never closes the device.log fd after handing it to the spawned logger | The code is as described. process-manager.ts:212 opens logFd, and the two success returns (:222, :240) never close the parent's copy. Only the fall-through path closes it (:244). But the claimed impact does not hold up.  1. It is called once per process. startDeviceLogCapture has exactly two callers, run-local.ts:583 (Android) and run-local.ts:745 (iOS). Each runs once per CLI invocation, so at mo |
| packages/test-suite/src/cli/commands/run-consumer-desktop.ts:51 | A consumer killed by a signal makes the CLI exit with code 0 | Duplicate root cause of qr1:9e04b8fa3979e17e (same `process.exit(code \|\| 0)` handler); filed together as one finding with all three locations. |
| packages/inference/src/handlers/get-model-info.ts:41 | ModelNotFoundError message is missing its opening quote around the model name | Real but cosmetic: the error message at get-model-info.ts:41 lacks an opening quote. No behavioural impact; below the bar for this report (would be a one-character drive-by fix). |
| packages/ai-sdk-provider/src/managed/serve-process.ts:417 | stopServe returns early when the serve already exited, leaving the worker in its process group running | The control flow the reviewer describes is accurate. stopServe (serve-process.ts:417) returns as soon as exitCode or signalCode is set. On spawnServe's error path (catch at :371, after a ServeExitedError from waitForHealth at :196 or from waitForReady at :254), nothing sends process.kill(-pid). The runner's post-start 'exit' handler (runner.ts:148) also never signals the group.  The impact claim f |
| packages/test-suite/src/cli/commands/run-consumer-electron.ts:205 | Electron consumer killed by a signal (crash/OOM/timeout kill) exits the runner with code 0 | Duplicate root cause of qr1:9e04b8fa3979e17e (same `process.exit(code \|\| 0)` handler); filed together as one finding with all three locations. |
| packages/registry-server/client/lib/profiler.js:173 | Swarm, store and temp dir leak if setup fails before the try/finally | The ordering the claim describes is real: tmpdir (profiler.js:167), the Corestore (169-170) and the Hyperswarm (172) are all created before the try at 192. But the failure paths it relies on are not realistic.  1. The swarm only leaks if something between line 172 and line 192 throws. That code is all synchronous and practically cannot throw:    - `HypercoreStats.fromCorestore` (hypercore-stats@2. |

## Details

### deviceDefaults entries for onnx-tts, bci, audiogen and classification models are silently dropped during config parsing

**File:** `packages/inference/src/schemas/config.ts:54`  
**Category:** correctness · **Severity:** medium · **Confidence:** high · **Status:** confirmed

### Evidence
deviceConfigDefaultsSchema (config.ts:54-81) is a plain z.object, so Zod strips unknown keys. It lists canonical keys for only 13 of the 17 ModelType values and only 9 aliases. ModelType (model-types.ts:10-42) also defines 'onnx-tts', 'bci-whispercpp-transcription', 'audiogen-ggml' and 'ggml-classification', plus the aliases 'bci', 'audiogen' and 'classification'. CANONICAL_TO_ALIAS (runtime/model-config-utils.ts:25-43) and MODEL_CONFIG_SCHEMAS (lines 45-60) resolve defaults for these types: audioGenConfigSchema has `device`/`backend` and bciConfigSchema has `gpu_device`/`backendsDir`. But both config loaders (inference/src/config/config-utils.ts:8 and sdk/src/client/config-loader/config-utils.ts:8) run qvacConfigSchema.safeParse, which removes these keys before they reach configRegistry.deviceDefaults (state.ts:145). getDefaultsFromPattern (model-config-utils.ts:120-135) then finds nothing for them.

### Impact
A user who writes `"defaults": { "audiogen": { "device": "cpu" } }` (or "classification", "bci", "audiogen-ggml", "ggml-classification", "bci-whispercpp-transcription") gets no error and no warning. The pattern is never applied, so on the target device the model loads with its normal backend/device, which is the problem the override was written to avoid (e.g. GPU crashes on specific Android devices).

### Reproduction
`qvacConfigSchema.parse({ deviceDefaults: [{ name: 'x', match: { platform: 'android' }, defaults: { audiogen: { device: 'cpu' }, 'ggml-classification': { backend: 'cpu' } } }] }).deviceDefaults[0].defaults` returns `{}`. resolveModelConfigWithContext('audiogen-ggml', {}, { platform: 'android' }, thatPatterns) reports appliedPatterns = [].

### Suggested fix
Add schema entries for ModelType.onnxTts, bciWhispercppTranscription, audiogenGgml and ggmlClassification, and for the 'bci', 'audiogen' and 'classification' aliases, using their partial config schemas. Alternatively, call .strict() on the object so an unsupported key fails validation instead of disappearing. Better still, derive the key list from ModelType/CANONICAL_TO_ALIAS so new model types cannot be missed again.

### Adversarial verification (agent)
I read the code to try to disprove the claim. It holds for audiogen, classification and bci. It is overstated for onnx-tts.

How the keys get dropped:
- `deviceConfigDefaultsSchema` (`packages/inference/src/schemas/config.ts:54-81`) is a plain `z.object(...).partial()`. It has no `.passthrough()` or `.catchall()`, so Zod drops any key it does not list. It lists 13 canonical keys and 9 aliases.
- Missing canonical keys: `onnx-tts`, `bci-whispercpp-transcription`, `audiogen-ggml`, `ggml-classification`.
- Missing aliases: `bci`, `audiogen`, `classification`. All three exist in `ModelTypeAliases` (`model-types.ts:50-63`).

The path is reachable from a public entry point:
- The SDK config loaders read the user's `qvac.config.*` file in `resolve-config.node.ts:63/76/105` and `resolve-config.expo.ts:28`. Both call `validateConfig`, which runs `qvacConfigSchema.safeParse` and returns `result.data` (`sdk/src/client/config-loader/config-utils.ts:8-14`; same in `inference/src/config/config-utils.ts`).
- The stripped data goes to the worker (`handler-utils.ts:23`, `setConfig`) and is stored as `configRegistry.deviceDefaults` (`state.ts:145`).
- On `loadModel`, `dispatch.ts:137-151` calls `resolveModelConfig`, then `getDefaultsFromPattern` (`model-config-utils.ts:120-135`). It looks up the canonical key, then `CANONICAL_TO_ALIAS[type]`. For `audiogen-ggml` that is 'audiogen', for `ggml-classification` 'classification', for `bci-whispercpp-transcription` 'bci'. These keys were already stripped, so it finds nothing.

Nothing else guards it:
- No error or warning is raised. The only log is a debug line that fires when a pattern was applied, and here none is.
- `MODEL_CONFIG_SCHEMAS` does register `audioGenConfigSchema` (which has device fields) and `bciConfigSchema`, so these defaults would be meaningful if they arrived.
- The comment at `config.ts:50-53` explains only the NMT/TTS passthrough. Nothing says the other types are left out on purpose.
- Tests call `resolveModelConfigWithContext` directly with in-memory patterns (for example `audiogen-plugin-config.test.ts:270`, which passes no patterns). That skips the schema parse, so no test covers this.

Where the claim is overstated:
- For `onnx-tts`, `CANONICAL_TO_ALIAS` maps to 'tts', which the schema keeps. A `"tts"` entry therefore still reaches onnx-tts models; only the literal `"onnx-tts"` key is dropped.
- There is a per-load workaround: pass `device` in `loadModel`'s `modelConfig`.
- The affected types are newer or niche.

Severity: a documented feature is silently ignored for some model types, but there is a workaround and it does not corrupt data. I rate it low-medium and chose medium.

### Human verification
Reproduced with verification/F-device-defaults.ts: qvacConfigSchema.parse keeps only 'llm' out of {audiogen, ggml-classification, bci, llm}; getDefaultsFromPattern returns undefined for audiogen-ggml, ggml-classification and bci-whispercpp-transcription. dispatch.ts:151/168 resolves config for every model type through resolveModelConfig, so these patterns are reachable and silently ignored.

<sub>fingerprint `qr1:b777f3657c0c0f0d` · first seen at 0c8a1510ab4f</sub>

### addModel can hang forever in reseedTracker.waitForComplete when two ingests overlap, or when the tracker is destroyed

**File:** `packages/registry-server/lib/registry-service.js:866`  
**Category:** concurrency · **Severity:** medium · **Confidence:** high · **Status:** confirmed

### Evidence
registry-service.js:866 awaits the shared ReseedTracker instance on every addModel. In reseed-tracker.js:38-136, waitForComplete makes a new Promise whose resolve/reject live only inside that call's `check` closure. It runs `check()` once, then does `if (this._pollInterval) return` (line 135). So a second concurrent caller never gets an interval, and its promise settles only if that single synchronous check finds every core complete. Separately, `destroy()` (reseed-tracker.js:140) clears the interval without settling the pending promise. destroy() is called from `_close()` (registry-service.js:365) and from `reseed()` (registry-service.js:490) while addModel may be awaiting at line 866. Nothing in registry-service serializes add-model RPCs (registry-service.js:563): every connection gets its own responder.

### Impact
With blind peers configured, the second of two overlapping add-model RPCs (two clients, or a client retry) never returns. The same happens to any ingest in flight during reseed() or service close. The RPC stays pending forever, the `finally` at line 901 never runs, so the model-sized download in TEMP_STORAGE/<hash> is never deleted, and clearAfterReseed never runs for that core.

### Reproduction
Build a RegistryService with blindPeerKeys and a blind peer that replicates slowly (not finished within one 2.5s poll). Stub _downloadArtifact. Call `Promise.all([svc.addModel(a), svc.addModel(b)])`: the first resolves once replication finishes, the second never does. Or start one addModel, call `svc.reseed()` while it waits at line 866, and watch it never resolve or reject.

### Suggested fix
Make waitForComplete give each caller its own interval/timer, or keep one shared in-flight promise and return it to concurrent callers. In destroy(), reject any pending waiters, e.g. with an 'ReseedTracker destroyed' error.

### Adversarial verification (agent)
I tried to disprove it and couldn't. The defect is real and nothing guards it.

1. **Second caller hangs.** In reseed-tracker.js:38-137, `waitForComplete` returns a new Promise. Its `resolve` and `reject` are reachable only through that call's own `check` closure. The method runs `check()` once (line 134), then returns early at line 135 if `this._pollInterval` is already set. So a second concurrent caller gets no interval. Its promise settles only if that single synchronous check finds every core already replicated to `expectedPeerCount` peers. The new blob was appended a moment earlier, so that is very unlikely. Its stall-timeout path (lines 95-122) also runs only from its own check, so it never fires either. When the first caller's interval finishes, it clears the interval (lines 127-128) and resolves only the first promise.

2. **`destroy()` leaves the promise pending.** `destroy()` (lines 140-146) clears the interval and empties `_cores` but never settles the outstanding promise. It is called from `_close()` (registry-service.js:364-366) and `reseed()` (registry-service.js:489-491). `addModel` keeps awaiting the old tracker instance (line 866), and nothing will ever resolve it.

3. **Reachable from a public entry point.** `rpc.respond('add-model')` (registry-service.js:563-575) is registered per connection and calls `addModel` directly. I grepped lib/ for mutex, lock, queue and serialize and found nothing that serializes ingests. Two writers, or a client retrying after a timeout, both reach line 866 while the first poll interval is still running. `_waitForInitialSeeding` (line 501) is another concurrent caller of the same shared instance.

4. **Impact.** The `finally` at line 901 never runs, so `TEMP_STORAGE/<hash>` (model-sized) leaks. `clearAfterReseed` is skipped for that call, and the RPC never returns.

**Why medium, not high:**
- It needs blind peers configured (otherwise `reseedTracker` is null).
- It needs an authorized writer (`ensureWriterAccess`).
- The model entry is already committed at line 861, so there is no data loss or corruption, only a hung request and leaked disk space and memory.
- If two ingests reuse the same pathHash, the first one's `finally` would delete the second's temp dir. That is a related cleanup race, but not this claim.

### Human verification
Reproduced with verification/registry-reseed-hang.repro.cjs against the real ReseedTracker: of two overlapping waitForComplete() calls the second stays pending after replication completes; a caller waiting when destroy() runs stays pending even past progressTimeout. registry-service.js awaits it in every addModel (866) and destroy() is called from reseed() (490) and _close() (365); add-model RPCs are not serialized (563). Only affects deployments with blind peers configured.

<sub>fingerprint `qr1:fada9fe9bced1cc3` · first seen at 0c8a1510ab4f</sub>

### fillFitBlobs writes back a stale model snapshot, overwriting concurrent metadata updates and re-ingests

**File:** `packages/registry-server/lib/registry-service.js:1432`  
**Category:** concurrency · **Severity:** medium · **Confidence:** high · **Status:** confirmed

### Evidence
fillFitBlobs reads every record once at the start (`const models = await this.listModels()`, line 1380). It then walks them one at a time, and each step may download a multi-GB artifact from source (lines 1413, 1340-1349). For each record it appends `{ ...model, fitBlobBinding }` (lines 1432-1442), which is the full record as it was when the run began, and the put-model apply handler replaces the whole record (line 107). Any update-model-metadata RPC (lines 646-680) or addModel re-ingest (new blobBinding, line 861) committed for that path after the listModels snapshot is silently undone.

### Impact
A deprecation, licence or description edit made while a fill-fit-blobs job runs is lost. A model re-ingested during the job is reverted to its old blobBinding/sha256, so clients are pointed back at the previous weights, which may already have been cleared locally. Nothing reports this: the fill report counts it as 'filled'/'replaced'.

### Reproduction
Seed two GGUF models without fit blobs. Start `svc.fillFitBlobs()` with the first model's download stubbed to block. While it is blocked, call update-model-metadata on the second model with `deprecated: true`. Release the stub. Afterwards getModelByKey for the second model shows `deprecated` back at its old value.

### Suggested fix
Right before the append, re-read the record with getModelByKey. Skip it (reason 'record changed') if its blobBinding.sha256 differs from the snapshot. Otherwise append `{ ...fresh, fitBlobBinding }` instead of the stale `model`.

### Adversarial verification (agent)
I couldn't disprove the claim. fillFitBlobs (registry-service.js:1379) reads every record once at the start with `this.listModels()` (line 1380). It then works through the records one at a time. Each one may come from `_loadArtifactForFill`, which falls back to a full source download (lines 1352-1364, 1340-1349), and each runs writeFitBlob and a blob upload/mirror (lines 1427-1430). After that it appends `{ ...model, fitBlobBinding }` (lines 1432-1442), and `model` is still the record as it was at the start of the run. The DISPATCH_PUT_MODEL apply handler calls `view.putModel(model)` (line 107). In shared/db.js:35-40 that is a plain `tx.insert` of the whole record, so the stale copy replaces the newer one with no check on version or sha. Nothing guards it: the server has no mutex or lock (grep finds none), and fill-fit-blobs is exposed as an RPC (lines 598-618) that awaits the whole loop. update-model-metadata (646-680), add-model (563, which appends at 861) and delete-model RPCs from any authorised writer, or from a second indexer, can commit during the run. A metadata edit made after the snapshot is reverted. A re-ingest is rolled back to the old blobBinding/sha256, the old fit blob replaces the new one, and the model counts as 'filled'/'replaced'. A delete-model committed during the run is also undone, because the put re-creates the deleted record. The integrity check at line 1345 only compares the download against the stale snapshot's sha, so it doesn't catch any of this. Tests only cover runs where nothing else writes at the same time, and no comment says the behaviour is intentional. Mitigating factors: the job is an operator-run maintenance RPC, it only touches selected candidates (by default those without a fitBlobBinding), and the window per record is the time to stage and process that model. Medium severity still fits: the corruption is silent and can point clients back at old weights.

### Human verification
Read registry-service.js:1379-1445: listModels() is snapshotted once, each record may take minutes (source download + fit blob + upload/mirror), then `{ ...model, fitBlobBinding }` is appended as DISPATCH_PUT_MODEL, whose apply handler (line 107) replaces the whole record. No lock or version check anywhere in the service; fill-fit-blobs is an RPC (598-618) that runs alongside update-model-metadata and add-model. Classic lost update. Not reproduced at runtime (needs an Autobase/HyperDB fixture); uncertainty is only about how often operators run both at once.

<sub>fingerprint `qr1:dc288eaa3153d460` · first seen at 0c8a1510ab4f</sub>

### Cancelling with clearCache during a registry transfer leaves the partial file or shard directory on disk

**File:** `packages/inference/src/handlers/load-model/registry.ts:567`  
**Category:** error-handling · **Severity:** medium · **Confidence:** high · **Status:** confirmed

### Evidence
The cleanup at registry.ts:567 (single file: unlink partialDownloadPath(modelPath)) and registry.ts:396 (sharded: rm getShardedModelCacheDir(cacheKey)) only runs when `error instanceof DownloadCancelledError`. When the abort fires during the transfer, the error comes from `lease.client.downloadBlob`/`downloadModel` (registry-download-utils.ts:139/142), and the registry client rejects with a plain `new Error('Download cancelled')` (packages/registry-server/client/lib/client.js:256, 277, 301, 757, 765). Nothing in registry-download-utils.ts or runtime/registry-client.ts maps that error to DownloadCancelledError; the lease wrapper only maps cancels that happen while waiting for the lease (runtime/registry-client.ts:236-245). So for the usual case, a cancel mid-download, the instanceof check is false and the cleanup is skipped. The same file already guards against this at line 468 (`ctx.signal.aborted || error instanceof DownloadCancelledError`), which shows the client error is known not to be a DownloadCancelledError.

### Impact
`cancel({ requestId, clearCache: true })` sets transfer.clearCache (download-manager.ts:333-343), which the docs there say deletes the partial download. Here it leaves the `.partial` file (for a single file) or every downloaded shard (for a sharded model) on disk. The client still clears the hypercore blocks because of clearBlocksOnCancel, so the user gets neither a resumable download nor the freed disk space. Multi-GB partial files stay in the cache until the user deletes them by hand. The caller also gets a plain Error instead of a DownloadCancelledError when the subscriber is settled by the transfer rejection.

### Reproduction
Start a registry model download through loadModel/downloadAsset, wait for progress > 0, then call cancel({ requestId, clearCache: true }). The blob stream rejects with Error('Download cancelled'). Check the cache directory: `<model>.partial` (or the shard dir from getShardedModelCacheDir) is still there. In a unit test, mock lease.client.downloadBlob to reject with new Error('Download cancelled') after setting clearCache, and assert that fsPromises.unlink/rm is not called.

### Suggested fix
Treat an aborted signal as a cancel in both catch blocks, as line 468 already does: `if ((ctx.signal.aborted || error instanceof DownloadCancelledError) && ctx.shouldClearCache())`. Also rethrow `new DownloadCancelledError()` when `ctx.signal.aborted`. A cleaner option is to wrap the client call in downloadSingleFileFromRegistry so that any rejection while `signal.aborted` is true becomes a DownloadCancelledError. registry-companion-set.ts:165 has the same check and needs the same fix.

### Adversarial verification (agent)
I traced the code and the main claim holds. In registry-download-utils.ts:105-107 the code throws DownloadCancelledError only if the signal is already aborted on entry. The lease wait at runtime/registry-client.ts:236-245 also maps a cancel to DownloadCancelledError, but only while the caller is still waiting for the lease. Once the transfer starts, `lease.client.downloadBlob`/`downloadModel` (registry-download-utils.ts:139/142) is awaited with nothing around it to map errors. The workspace client (@qvac/registry-client ^0.8.0) rejects an abort mid-stream with a plain `new Error('Download cancelled')` (client/lib/client.js:757, 765). Its own tests and integration tests assert exactly that message. The client never deletes outputFile: _streamBlobToFile only destroys the streams, and _doReleaseDownload clears blocks only.

So the `error instanceof DownloadCancelledError && ctx.shouldClearCache()` checks never pass for a mid-transfer cancel:
- registry.ts:567 skips the unlink of the `.partial` file.
- registry.ts:396 skips the rm of the shard dir. downloadShardedFilesFromRegistry only throws DownloadCancelledError between shards (line 199).
- registry-companion-set.ts:165 has the same gap.

The client still clears the hypercore blocks, because buildRegistryClientOptions maps shouldClearCache to clearBlocksOnCancel. The result is a partial file on disk whose blocks are gone, so it neither resumes nor frees space.

Nothing upstream does the cleanup either. download-manager.ts only sets transfer.clearCache. Its docstring (lines 316-331) promises the partial file "is deleted". registry-delete.ts removes partials only on an explicit deleteCache. Line 468 in the same file normalizes with `ctx.signal.aborted ||`, which shows the authors know about this error shape. The existing test registry-client-cache.test.ts:31 throws a plain Error('Download cancelled') and checks only that clearBlocksOnCancel is forwarded, not that the file is cleaned up.

The path is reachable from the public API: `cancel({ requestId, clearCache: true })` goes through cancelHandler → markClearCacheForRequest → registry cancel → last-subscriber abort.

Part of the claim is overstated. The transfer is aborted only after the last subscriber is removed, and attachRequestBinding has already settled that subscriber with InferenceCancelledError. So callers don't actually see the plain Error. The leftover file also causes no correctness problem: the next download truncates it with createWriteStream, and deleteCache removes it. The real impact is wasted disk space, up to multi-GB for large or sharded models, and an unkept clearCache contract. That makes medium a fair rating, at the lower end.

Fix: in the catch blocks, test `ctx.signal.aborted || error instanceof DownloadCancelledError`, or normalize the error in downloadSingleFileFromRegistry.

### Human verification
Read registry.ts:396 and :567 (cleanup only if `error instanceof DownloadCancelledError`), registry-download-utils.ts:134-143 (transfer awaited with no error mapping) and registry-server/client/lib/client.js:256/277/301/757/765 (client rejects with plain `new Error('Download cancelled')`). The lease wrapper maps only cancels during the lease wait (runtime/registry-client.ts:236-245). registry.ts:468 in the same file already checks `ctx.signal.aborted ||`, which is the fix pattern. Not reproduced at runtime (needs a registry peer).

<sub>fingerprint `qr1:55af96b5b781ae72` · first seen at 0c8a1510ab4f</sub>

### Corestore dir is keyed per drive but the lock is per file, so concurrent downloads from one drive collide and one deletes the other's store

**File:** `packages/inference/src/handlers/load-model/hyperdrive.ts:374`  
**Category:** concurrency · **Severity:** medium · **Confidence:** medium · **Status:** confirmed

### Evidence
getCorestoreDir (line 73-75) uses only hyperdriveKey. The download lock and the transfer dedupe use createHyperdriveDownloadKey(hyperdriveKey, modelFileName) (lines 739, 747), which is per file. Two loads of different files from the same drive (for example a model and its projector, or two models published in one drive) therefore run concurrently. Each calls setupHyperdrive → `new Corestore(sameDir)`, and the second instance contends for the same on-disk lock. When the first download succeeds and seed is false, line 374 does an `fsPromises.rm(corestoreDir, { recursive: true, force: true })` on the directory the second download is still writing.

### Impact
Loading two files from one hyperdrive key in parallel makes the second download fail (corestore lock error) or lose its storage mid-transfer. The user sees HyperdriveDownloadFailedError or corrupted resume state.

### Reproduction
Call loadModel for `pear://<key>/a.gguf` and `pear://<key>/b.gguf` at the same time with a fresh cache. One of the two fails while opening or using the corestore, or the first one's completion removes ~/.qvac/corestore/<key> under the second.

### Suggested fix
Lock on the corestore resource (hyperdriveKey) rather than the per-file key, or share one ref-counted setup per hyperdriveKey. Delete the directory only when no other transfer on that key is active.

### Adversarial verification (agent)
I tried to disprove the claim and could not. The code shows:

1. **The store is per drive, the lock is per file.** getCorestoreDir (hyperdrive.ts:73-75) builds the path from hyperdriveKey alone. The only serialization is per file: startOrJoinDownload and acquireDownloadLock both use createHyperdriveDownloadKey(hyperdriveKey, modelFileName), which is `${key}:${file}` (download-manager.ts:419-420). download-lock.ts hashes that resourceKey into its own .lock file. Nothing in download-manager.ts, download-lock.ts or resolve.ts serializes by drive key.

2. **Public entry points reach it with no special input.** handler.ts:110-128 runs the primary model resolve and plugin.resolveConfig at the same time with Promise.all.
   - OCR: for a pear:// recognizer, ggml-ocr/resolve-config.ts:62-66 derives the detector as `pear://${sameKey}/craft_mlt_25k.gguf` and resolves it while the recognizer downloads.
   - Bergamot NMT: for a pear:// model, nmtcpp-translation/resolve-vocab.ts:28-35 and 93-96 derive vocab files from the same key and resolve them alongside the model. For CJK pairs that is two different vocab files, plus the model.
   So a plain `loadModel` with a pear:// OCR or Bergamot source, using the auto-derived companions, starts two or three downloads from one drive at once.

3. **No guard elsewhere.** Each download calls setupHyperdrive, which runs `new Corestore(sameDir)` (line 81). In the finally block (lines 370-375), whichever non-seeding download succeeds first calls deleteCorestoreDirectory on the shared dir while the other is still running. The cache-hit path does the same (line 802), so a companion that is already cached also wipes the store of a sibling download that is still running. Lines 379-390 add the same risk on clearCache. No test covers concurrent same-drive downloads.

4. **Impact.** Whether the second Corestore open fails right away on the RocksDB LOCK or opens and then loses its files depends on the runtime, and I can't see that from the code. Both outcomes surface as HyperdriveDownloadFailedError or lost resume state. The claim holds.

**Severity: medium.** The failure is easy to hit on documented pear:// OCR and NMT paths. But registry:// sources take a different path, a retry usually succeeds once the companion is cached, and no data outside the corestore is corrupted.

### Human verification
Read hyperdrive.ts:73-75 (corestore dir keyed by drive key only), :739-747 (download key and lock keyed by drive key + file name) and :368-375 (non-seed success deletes the whole corestore dir). Two concurrent loads of different files from one drive therefore share a store directory under different locks, and the first to finish deletes it. Uncertainty: how common parallel loads from one pear:// drive are in practice (e.g. model + projector loaded concurrently).

<sub>fingerprint `qr1:7f9aeb15c35aa7ad` · first seen at 0c8a1510ab4f</sub>

### Shards inside a top-level folder are extracted but never found, so the load fails

**File:** `packages/inference/src/utils/archive.ts:292`  
**Category:** correctness · **Severity:** medium · **Confidence:** medium · **Status:** confirmed

### Evidence
extractTarStream keeps each entry's directory path: `path.resolve(path.join(extractDir, header.name))` (line 159) followed by `fs.mkdirSync(dir, { recursive: true })` (line 170). Validation then calls a non-recursive `fsPromises.readdir(extractDir)` (line 292) and looks for a top-level name matching the shard pattern (line 293). The cache check at lines 265-266 does the same. An archive made with `tar czf m.tar.gz model/` has entries such as `model/model-00001-of-00002.gguf`. They are written to extractDir/model/, readdir returns only `model`, and `detectShardedModel('model').isSharded` is false.

### Impact
An ordinary archive that wraps its shards in a folder always fails with ModelLoadFailedError 'No sharded model files found in archive', even though all the shards were just written to disk. On the HTTP path, every retry downloads the archive again and extracts it again, because no completion marker is ever written.

### Reproduction
In sharded-disk-load.test.ts, call writeTar(archivePath, {'model/model-00001-of-00002.gguf':'a','model/model-00002-of-00002.gguf':'b'}) and then extractAndValidateShardedArchive(archivePath, extractDir). It rejects with ModelLoadFailedError, and extractDir/model/ holds both shards.

### Suggested fix
Write model entries flat, at path.join(extractDir, path.basename(header.name)), since only basenames are used later. Otherwise, search extractDir recursively and return the nested path. Flattening also keeps the existing zip-slip check simple.

### Adversarial verification (agent)
The code matches the claim. extractTarStream (archive.ts:159-172) writes each .gguf entry to path.resolve(path.join(extractDir, header.name)) and runs mkdirSync on its parent directory, so the entry `model/x-00001-of-00002.gguf` lands in extractDir/model/. It does not strip leading path components and does not flatten. Both the cache check (265-266) and the post-extraction validation (292-293) then call a non-recursive fsPromises.readdir(extractDir) and look for a top-level name where detectShardedModel(...).isSharded is true. They only see 'model', so validation throws ModelLoadFailedError('No sharded model files found in archive'). The shard-existence loop (311-317) and the marker write (320) both assume the shards sit directly in extractDir, so the marker is never written, and the cache check would fail the same way anyway.

Reachability: this is a public path. extractAndValidateShardedArchive is called from load-model/http.ts:937 and resolve.ts:81/97/377 for any modelSrc ending in .tar/.tar.gz/.tgz. The SDK docs (sdk changelog 0.6.0 api.md) advertise 'Archive-based shards' through a URL or a local path and never say the shards must sit at the archive root.

Guards: nothing upstream or downstream normalises the paths. The zip-slip check only rejects paths that escape extractDir.

Tests: every test in test/sharded-disk-load.test.ts builds a flat archive, so none of them covers this case, and no comment says a flat layout is required.

Impact: an archive made the usual way with `tar czf m.tar.gz dir/` cannot be loaded, and the error message misleads, because the shards were extracted. The extra re-download on retry is plausible because the marker is never written, but that part is secondary. A user can work around the bug by re-packing the archive flat. Medium severity is fair.

### Human verification
Reproduced on Bare with the package's own runner (verification/inference-archive.repro.test.ts): an archive with model/model-0000N-of-00002.gguf entries writes both shards under out/model/ and extractAndValidateShardedArchive rejects with 'No sharded model files found in archive'. Uncertainty: depends on whether published QVAC archives ever wrap shards in a folder; any third-party archive made with `tar czf x.tar.gz dir/` does.

<sub>fingerprint `qr1:1f28569b0c696221` · first seen at 0c8a1510ab4f</sub>

### Synchronous mkdirSync throw inside tar-stream 'entry' listener escapes the promise as an uncaught exception

**File:** `packages/inference/src/utils/archive.ts:170`  
**Category:** error-handling · **Severity:** medium · **Confidence:** medium · **Status:** confirmed

### Evidence
tar-stream 3.2.0 extract.js calls `this.emit('entry', ...)` directly from `_consumeHeader`, which runs from `_update`/`_write` (lines 178/185, 296-299) and has no try/catch around the emit. The listener at archive.ts:144 calls `fs.mkdirSync` (line 170) without a guard. The throw goes up through the streamx write path started from the readStream pipe, outside the `new Promise` executor, so `settle` never runs. Triggers include an archive holding `a.gguf` and then `a.gguf/b.gguf` (the dirname is now a file, so ENOTDIR/EEXIST), a non-directory already sitting at that path in extractDir, or EACCES/ENOSPC on the cache directory.

### Impact
The extraction promise neither resolves nor rejects, and the exception reaches the process as uncaught, which can crash a Bare/Node host. The inFlightExtractions entry is never removed, so later loads of the same archive join a promise that will never settle and hang.

### Reproduction
writeTar(archivePath, {'a.gguf':'x','a.gguf/b.gguf':'y'}), then await extractTarStream(archivePath, extractDir, false). Expect an uncaught ENOTDIR/EEXIST from mkdirSync instead of a rejection.

### Suggested fix
Wrap the mkdirSync/createWriteStream block in try/catch and call `settle(err)` (and `stream.resume()`) on failure. Or make the listener async-safe by calling mkdir via the promise API with `.catch(settle)` before piping.

### Adversarial verification (agent)
I could not disprove the claim. The code works as the reviewer describes.

1. In archive.ts:144-170 the 'entry' listener calls `fs.mkdirSync(dir, { recursive: true })` with no try/catch. Nothing in the listener or around the Promise executor catches a synchronous throw. The executor returns as soon as the pipe is set up, so the listener runs later, outside it.

2. In tar-stream 3.2.0, extract.js:178/185 emits 'entry' from `_consumeHeader`, which runs from `_update`, which runs from `_write` (lines 296-299). None of these use try/catch. streamx index.js:202 calls `stream._write(data, this.afterWrite)` without a guard; the only catch blocks in streamx are in pipeline and iterator helpers. So the throw runs up the pipe's data/write path and becomes an uncaught exception. `this._callback` is never called, so the extract stream stalls and 'finish'/'error' never fire. `settle` never runs, and the promise neither resolves nor rejects.

3. There is no guard further up. extractAndValidateShardedArchiveOnce's try/catch only covers awaited rejections, and the `.finally` that deletes the inFlightExtractions entry never runs, so later callers join a promise that never settles. No production code registers an uncaughtException handler; I found them only in tests and benchmarks. A Bare host terminates on an uncaught exception by default.

4. Reachability is narrower than the reviewer suggests. Line 96 creates extractDir first, so flat archives never make mkdirSync throw. The listener extracts only *.gguf entries, so a conflicting path component would have to be a .gguf-named file. That means a crafted or malformed archive (`a.gguf` followed by `a.gguf/b.gguf`, which passes the zip-slip check), or EACCES/EROFS/ENOSPC on a nested dir inside the cache. Archives come from user-supplied model URLs, so a malicious archive is a realistic input. The result is a host crash or a permanent hang rather than a clean ArchiveExtractionFailedError.

Severity stays medium: the trigger needs unusual or hostile input or filesystem errors, but the failure mode is a process crash plus a stuck in-flight entry. The obvious fix is to wrap the mkdirSync and createWriteStream setup in try/catch and call `settle(err)`, or to use async mkdir.

### Human verification
Reproduced on Bare: archive {a.gguf, a.gguf/b.gguf} makes fs.mkdirSync throw EEXIST inside the tar-stream 'entry' listener; the extractTarStream promise is still pending after 3 s and the error surfaces as an unhandled rejection. Without handlers it killed the brittle process ('Uncaught (in promise) FileError: EEXIST'). Same path is hit by EACCES/ENOSPC on the cache dir, i.e. ordinary disk conditions, not only crafted archives.

<sub>fingerprint `qr1:e9263b55f9523595` · first seen at 0c8a1510ab4f</sub>

### Documented 'first matching pattern wins' contradicts the implementation, where every match is merged and the last one wins

**File:** `packages/inference/src/schemas/config.ts:226`  
**Category:** api-contract · **Severity:** low · **Confidence:** high · **Status:** confirmed

### Evidence
The deviceDefaults JSDoc (config.ts:222-227) says user patterns are checked before built-in ones and the first matching pattern wins. resolveModelConfigWithContext (model-config-utils.ts:151-174) does something else. It collects ALL matching built-in patterns, then ALL matching user patterns, and spreads each into mergedDefaults in array order (`mergedDefaults = { ...mergedDefaults, ...defaults }`). So the LAST matching user pattern overrides earlier ones for every shared key. The comment at model-config-utils.ts:62 also says 'later patterns override earlier'.

### Impact
A user following the documented rule puts the specific pattern first and the general fallback after it, e.g. [{ match: {platform:'android', deviceBrand:'samsung'}, defaults:{llm:{device:'gpu'}} }, { match:{platform:'android'}, defaults:{llm:{device:'cpu'}} }]. On a Samsung device both patterns match, and the general one, listed last, overrides the specific one, so the Samsung override never takes effect.

### Reproduction
Call resolveModelConfigWithContext('llamacpp-completion', {}, { platform: 'android', deviceBrand: 'samsung' }, [specificFirst, generalSecond], []). finalConfig.device is 'cpu', not 'gpu', and appliedPatterns lists both patterns.

### Suggested fix
Change the doc to match the code: all matching patterns are merged, built-in patterns first, then user patterns in order, and later matches override earlier ones, so list general patterns before specific ones. Or change the resolver to stop at the first matching user pattern if that is the intended contract.

### Adversarial verification (agent)
The JSDoc on the public `deviceDefaults` config field (config.ts:222-226) says user patterns are "checked before the built-in patterns" and "First matching pattern wins." The implementation does something else. In resolveModelConfigWithContext (model-config-utils.ts:151-174), findAllMatchingPatterns uses `patterns.filter`, so it returns every match. The function then spreads the built-in matches and after them the user matches into mergedDefaults with `mergedDefaults = { ...mergedDefaults, ...defaults }`. For each shared key, the last matching pattern wins. The code's own comments state that this is intended: line 62 says "Ordered general → specific (later patterns override earlier)" and lines 155-156 say "Later values override earlier (more specific wins)". The test names agree: "user patterns override builtin patterns". So the implementation is deliberate and the doc comment is the stale part.

The path is reachable from public input. state.ts:219 passes `getConfig().deviceDefaults` unchanged (not reversed) as userPatterns, from qvac.config. Nothing reorders the patterns or warns about overlap. The reviewer's scenario holds. With [specific samsung → gpu, general android → cpu], both patterns match on a Samsung device, and the general one comes last, so llm.device is 'cpu'. The configuration is silently wrong.

On impact: this is a documentation/contract mismatch, not a logic bug. Anyone who orders patterns general → specific gets the right result, and loadModel() userInput still overrides everything. The fix is to correct the JSDoc. The "checked before" half is also misleading, though user patterns do still override built-in ones in effect. I'm rating it low-medium; I put low because nothing crashes and the existing semantics are coherent and tested. The impact is still a silently wrong device setting for users who follow the docs.

### Human verification
Reproduced with verification/F-device-defaults.ts: with user patterns [samsung-specific gpu, android-general cpu] on a Samsung device the resolved device is 'cpu'. The public JSDoc (schemas/config.ts:222-227) says the first matching pattern wins; the resolver (model-config-utils.ts:151-174) merges all matches and the last wins. Docs-vs-behaviour contract issue: fix either side, but they must agree.

<sub>fingerprint `qr1:39bde97448daa996` · first seen at 0c8a1510ab4f</sub>

### Runner killed by a signal (OOM, SIGKILL, crash) is reported as exit code 0

**File:** `packages/test-suite/src/cli/commands/run-consumer-external.ts:47`  
**Category:** error-handling · **Severity:** low · **Confidence:** high · **Status:** confirmed

### Evidence
run-consumer-external.ts:46-48 listens to `child.on('exit', (code) => process.exit(code || 0))`. When the child dies from a signal, Node passes `code === null` with a non-null `signal`, so `null || 0` makes the CLI exit 0. Sibling code handles this case: utils/external-consumer.ts:105 uses `code ?? (signal ? 1 : 0)`, and run-consumer-snap.ts:110-114 exits 1 when `signal` is set. This command never reads the `signal` argument.

### Impact
A CI job running `run-consumer-external` reports success when the in-place runner is OOM-killed (likely when it loads local models), SIGKILLed by a timeout wrapper, or crashes with SIGSEGV or SIGABRT in a native addon. Any test run cut short this way is hidden from the pipeline.

### Reproduction
Start the command with a valid external consumer config. While it runs, `kill -9 <pid of node run-consumer-external-inplace.js>`. Then `echo $?` on the parent prints 0.

### Suggested fix
`child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)))`, the same as runMqttClient.

### Adversarial verification (agent)
The defect is real. Line 47 of run-consumer-external.ts is `child.on('exit', (code) => process.exit(code || 0))`. It never reads `signal`, so a runner killed by SIGKILL, OOM, SIGSEGV or SIGABRT (code=null) makes the CLI exit 0. Two sibling files handle the signal case: utils/external-consumer.ts:105 (`code ?? (signal ? 1 : 0)`) and run-consumer-snap.ts:110-114. Two other commands copy the same bug: run-consumer-desktop.ts:50-51 and run-consumer-electron.ts:204-205.

The path is reachable. index.ts:121 registers the command as `run:consumer:external`, and CI calls it: sdk/ci/e2e.mjs:351 uses it for the python family. Nothing upstream catches the masked code. e2e.mjs:363-365 takes the CLI's close code as `consumerExit = code ?? 0`, so a 0 from this CLI passes through unchanged.

The impact is overstated. In CI the producer runs in the foreground with `--consumer-timeout=60`, and e2e.mjs:394 returns the producer's non-zero status first. A consumer that dies mid-run leaves tests without results, so the producer should fail the job anyway. The masking only decides the outcome when the runner crashes after the producer has finished (for example, a native-addon abort during teardown), or when the command is used on its own outside the e2e wrapper. run-local.ts:246 checks consumer signals itself, but it watches the CLI process, so it sees the same 0.

Severity is re-rated to low: the bug is real but mostly covered by the producer's own pass/fail.

### Human verification
Reproduced with verification/test-suite-signal-exit.repro.mjs using the exact handler: child SIGKILLed -> code=null -> parent exits 0. Same bug, same fix, in run-consumer-desktop.ts:51 and run-consumer-electron.ts:205 (findings qr1:0682b8f6d74069cc and qr1:ad8a1dcd6c558df3, folded into this one). Siblings already handle it correctly (external-consumer.ts:105, run-consumer-snap.ts:110-114), which shows the intended behaviour.

<sub>fingerprint `qr1:9e04b8fa3979e17e` · first seen at 0c8a1510ab4f</sub>

### port 0 (ephemeral) is silently replaced by fixed port 9210

**File:** `packages/registry-server/lib/metrics-server.js:14`  
**Category:** correctness · **Severity:** low · **Confidence:** high · **Status:** confirmed

### Evidence
`opts.port || DEFAULT_PORT` treats 0 as falsy. tests/integration/metrics.integration.test.js:46-53 passes `port: opts.port || 0` to get an OS-assigned port and then reads `metricsServer._server.address().port`. Because of the `||`, every one of those servers actually binds 127.0.0.1:9210. bin.js only works because it handles 0 itself (0 disables the server) and never passes it in.

### Impact
Integration tests (and any embedder) that ask for an ephemeral port get 9210 instead. Running the tests while a local registry-server is up with default metrics, or running test files in parallel, fails with EADDRINUSE in `ready()`. The tests also scrape whatever process owns 9210.

### Reproduction
Start a registry-server with default metrics on 9210 (or `nc -l 127.0.0.1 9210`), then run `new MetricsServer(promClient.register, { port: 0 }).ready()`. It rejects with EADDRINUSE instead of binding a random port.

### Suggested fix
Use `this._port = opts.port ?? DEFAULT_PORT` (and the same for host if an empty string should be allowed).

### Adversarial verification (agent)
The claim holds up. In lib/metrics-server.js:14, `this._port = opts.port || DEFAULT_PORT` (DEFAULT_PORT = 9210, line 6) turns an explicit port 0 into 9210, and `_open()` then calls `listen(this._port, ...)` on line 40. No caller guards against this. tests/integration/metrics.integration.test.js:46-51 passes `port: opts.port || 0`, and no test ever passes a port, so every call ends up passing 0. The test at lines 240-244 also passes `port: 0` directly. Both then read the real port from `_server.address().port`, which shows they expect an OS-assigned port. Nothing in the code or comments suggests the fallback is meant to catch 0. Tests in this file close their server in cleanup, so running them one after another works, which is why the bug went unnoticed. They fail with EADDRINUSE in ready() if anything else already holds 127.0.0.1:9210 (for example a local registry-server running bin.js with the default metrics port) or if test files run in parallel. In that case the tests could also end up talking to the wrong process. The production path is not affected: scripts/bin.js:120-138 creates MetricsServer only when `metricsPort > 0` and treats 0 as 'disabled'. So the impact is limited to the tests and any embedder that passes 0. Severity stays low. The fix is `opts.port ?? DEFAULT_PORT`.

### Human verification
Initially rejected by me as unreachable in production (bin.js only constructs MetricsServer when port > 0). The verifier showed the integration tests pass `port: 0` expecting an OS-assigned port and get 9210 instead, so the suite fails with EADDRINUSE whenever a local registry-server is running. Kept as a low-severity, test-reliability finding: an example of the verifier correcting the human.

<sub>fingerprint `qr1:16832423a7702abe` · first seen at 0c8a1510ab4f</sub>

### Blind-peering setup and reseed mirror the legacy 'models' core instead of the active generation's core

**File:** `packages/registry-server/lib/registry-service.js:451`  
**Category:** correctness · **Severity:** medium · **Confidence:** medium · **Status:** confirmed

### Evidence
Since blob-core rotation, new ingests write to `this.activeBlobCoreLabel` ('models-<generation>', lines 69-72, 845, 1427). _setupBlindPeering, which runs at startup (line 278) and from reseed() (line 494), still opens and mirrors the hard-coded BLOB_CORE_NAME 'models' (line 451). It does not mirror the active core, and _mirroredCoreIds is cleared just before (line 441). The core that holds every post-rotation model is mirrored and tracked again only when the next addModel/fillFitBlobs calls _mirrorBlobCore. On a node configured with a generation from day one, line 451 also creates an empty writable 'blobs-models' core that is never used.

### Impact
After setting QVAC_BLOB_CORE_GENERATION and restarting, or after running reseed(), the blind peers are not asked to mirror the core that holds the post-rotation models. _waitForInitialSeeding reports 'blind peers finished initial sync' without having checked it. With --clear-after-reseed, the local blocks of those models are already gone, so their availability depends on mirroring that this setup no longer re-establishes.

### Reproduction
Start a service with blobCoreGeneration '2026-09-10' and blindPeerKeys, add a model, then restart it or call `svc.reseed()`. Inspect `svc._mirroredCoreIds` / `reseedTracker._cores`: they contain only the 'blobs-models' discovery key, not that of 'blobs-models-2026-09-10'.

### Suggested fix
In _setupBlindPeering, mirror the active core (`this.activeBlobCoreLabel`), and ideally every distinct blobBinding.coreKey this node owns among existing models, instead of only BLOB_CORE_NAME.

### Adversarial verification (agent)
The code matches the claim. activeBlobCoreLabel becomes 'models-<generation>' when a generation is configured (registry-service.js:69-72). addModel (845-849) and fillFitBlobs (1427-1430) write to that core and call _mirrorBlobCore on it. _setupBlindPeering (427-464) runs at startup (278) and from reseed() (494). It clears _mirroredCoreIds (441), then calls _getOrCreateBlobsCore(BLOB_CORE_NAME) with the hard-coded 'models' (451). _getOrCreateBlobsCore (1165-1172) opens 'blobs-models' with writable:true. On a node that never used the legacy label, that creates an empty, unused local core and mirrors it.

The eager open at 286-303 does use activeBlobCoreLabel, but it runs after _setupBlindPeering and never calls _mirrorBlobCore. So the active core is not added to the blind peers or to the ReseedTracker, and _waitForInitialSeeding (463, 497-503) logs 'finished initial sync' without having checked it. The core is mirrored again only when the next addModel or fillFitBlobs runs.

Reachability: QVAC_BLOB_CORE_GENERATION or the blobCoreGeneration option at startup, or a public reseed() call. reseed() also accepts new blindPeerKeys, and in that case the new mirrors never receive the rotated core until the next ingest. Nothing else guards this path. The rotation test (blob-core-rotation.integration.test.js) does not use blind peers, so this case is untested. I found no comment saying the behaviour is intentional.

The impact is somewhat smaller than claimed. Blind peers that had already mirrored the rotated core through an earlier addModel probably keep it across a restart, so the worst case is a reseed to new or wiped mirrors, especially with --clear-after-reseed. There is also no data corruption: models stay readable locally until that local data is cleared. Medium severity stands.

<sub>fingerprint `qr1:6852e505102253bb` · first seen at 0c8a1510ab4f</sub>

### broker.pid records the CLI's own PID, so shutdown on Windows force-kills the CLI before its own cleanup runs

**File:** `packages/test-suite/src/cli/utils/local-broker.ts:178`  
**Category:** correctness · **Severity:** medium · **Confidence:** high · **Status:** confirmed

### Evidence
local-broker.ts:178 writes `process.pid` (the CLI process that hosts the embedded broker) into `<reportDir>/broker.pid`. The only consumer of `*.pid` files is `killTracked(reportDir)` (process-manager.ts:90-116), which reads every `.pid` file in reportDir and kills that PID. On win32 it runs `taskkill /PID <pid> /F /T`. `setupCleanup` in run-local.ts:221-229 calls `killTracked(reportDir)` first, then `extraCleanup?.()`, `brokerHandle.cleanup()`, `printLogPaths(reportDir)` and `process.exit(exitCode)`. Because broker.pid holds the CLI's own PID, `taskkill /F /T` force-terminates the CLI (and its whole tree) from inside killTracked, so none of the later steps run. On POSIX the self-sent SIGTERM is only queued, and the `cleaningUp` guard plus the synchronous `process.exit` hide the problem. The embedded broker lives in-process and is already stopped by `brokerHandle.cleanup()`, so a PID file for it is wrong in the first place.

### Impact
On Windows, any `run:local:*` session that started the embedded broker ends with the CLI force-killed: the producer's exit code is replaced by taskkill's forced exit code (so a passing run looks failed in CI or scripts), `extraCleanup` (for example stopping device log capture, run-local.ts:512/619/773) is skipped, and the log-path summary never prints.

### Reproduction
On Windows, with no MQTT broker running, run a `run:local` command so ensureBroker starts the embedded aedes broker and writes reportDir/broker.pid. Let the producer exit with code 0, or press Ctrl+C. Check `echo %ERRORLEVEL%`: it is non-zero, and the 'log paths' output after 'Shutting down...' is missing.

### Suggested fix
Don't write the CLI's own PID to a `.pid` file that killTracked reads. Drop the broker.pid write, since `cleanup()` already stops the in-process broker, or give it a name or extension killTracked skips. Another option is for killTracked to skip `pid === process.pid`.

### Adversarial verification (agent)
I read the code and the claim holds. local-broker.ts:178 writes `process.pid` to `<reportDir>/broker.pid` after starting the embedded aedes broker in-process (lines 162-176). This is the CLI's own PID, not a child process. killTracked (process-manager.ts:90-116) reads every `*.pid` file in reportDir. On win32 it runs `execSync('taskkill /PID <pid> /F /T')`. Its catch only swallows errors from taskkill, and nothing excludes `process.pid`. setupCleanup (run-local.ts:221-230) calls killTracked(reportDir) first, then extraCleanup, brokerHandle.cleanup(), printLogPaths and process.exit(exitCode). On Windows, taskkill /F /T against the parent of the execSync child force-terminates the CLI and its tree, so none of the later steps run. The exit code becomes taskkill's forced-termination code (1) instead of the producer's code.

The path is reachable. Every run:local:* command goes through setupLocalRun → ensureBroker(brokerUrl, reportDir) (run-local.ts:208). The PID file is written whenever no broker is already running, which is the default case on a dev machine. run:local:desktop and run:local:electron are realistic on Windows: the repo has win32 handling in run-consumer-electron.ts:79 and build-consumer-electron.ts:59.

Nothing guards against it. No filter skips broker.pid or the current PID. No comment or test shows it is intentional. The embedded broker is already shut down in-process by brokerHandle.cleanup(), so the pid file does nothing useful. On POSIX the self-SIGTERM is queued and process.exit runs synchronously first. The cleaningUp guard also stops the handler from re-entering, so POSIX is largely unaffected, as the claim says.

One point in the claim is overstated. Tracked child processes still die, because /T kills the CLI's whole tree, so there are no orphans. The real impact is a wrong exit code (a passing run can look failed in CI), skipped extraCleanup (device log capture, which only matters for the mobile commands), and a missing log-path summary. That is Windows-only, with no data loss, so medium-to-low. I keep it at medium because a wrong exit code from a test runner breaks CI signal.

<sub>fingerprint `qr1:adf230d5a53d9f32` · first seen at 0c8a1510ab4f</sub>

### Abort during file lookup or metadata fetch is missed, so the hyperdrive transfer hangs and keeps the lock and corestore

**File:** `packages/inference/src/handlers/load-model/hyperdrive.ts:481`  
**Category:** concurrency · **Severity:** medium · **Confidence:** medium · **Status:** confirmed

### Evidence
downloadAndValidateFile registers the reject-on-abort listener only at line 481. That comes after validateFileExistence (lines 405-406), which awaits drive.core.update() and drive.entry(..., { wait: true }) (lines 160, 167) and can block until a peer answers. If the signal aborts in that window, the outer `cleanup` (lines 306-314) suspends the swarm, so the pending drive.entry and the read stream never get blocks. When execution reaches line 481 the signal is already aborted, and addEventListener on an already-aborted signal never fires. There is no `if (signal.aborted)` check before the await at 476. The promise never settles and nothing has timeouts. download-manager.ts:185-189 settles the subscriber on its own, so the caller sees a cancellation. Meanwhile the background startDownload promise stays pending forever. It holds the `await using` download lock (hyperdrive.ts:747), the open Corestore/Hyperdrive and its entry in runningDownloads.

### Impact
After a user cancels a pear:// download early (while peers are still being found or the entry/blob metadata is still arriving), the next load of the same model waits forever in acquireDownloadLock or fails to open the still-locked corestore. Shutdown, which waits for runningDownloads, can also hang.

### Reproduction
Start loading a hyperdrive model while the seeding peer is offline or slow, so drive.entry waits. Cancel the request, then bring the peer online or retry the load: the retry logs '⏳ … is being downloaded elsewhere' and never proceeds. In a unit test, stub drive.entry to resolve after the signal is aborted and observe that downloadAndValidateFile never settles.

### Suggested fix
Check `if (signal?.aborted) throw new DownloadCancelledError()` right before creating the streams and inside the Promise at 476. Also race validateFileExistence against the abort signal, or pass a timeout or abort to drive.entry/update. Remove the listener once the promise settles.

### Adversarial verification (agent)
The core defect is real. In downloadAndValidateFile (hyperdrive.ts:395-482), validateFileExistence runs first (lines 405-406). It awaits drive.core.update() (line 160), drive.entry(..., {wait:true}) (line 167) and drive.getBlobs()/blobs.core.has(). The only abort hookup in this function is the addEventListener at line 481, and nothing checks `signal.aborted` before it. A listener added to an already-aborted signal never fires. So an abort during the lookup is lost, and the promise at line 476 can only settle on stream finish or stream error. The callers do not guard this either. downloadSingleFileToFilesystem checks `signal.aborted` only before setup (line 298). The sharded loop checks it only before and after each downloadAndValidateFile call (lines 609, 670). Nothing in this path has a timeout. In download-manager.ts, attachRequestBinding settles the subscriber on its own (lines 185-189), and startOrJoinDownload starts a new transfer when the existing one is aborted (line 229). The orphaned startDownload promise keeps the `await using` lock (line 747) and stays in runningDownloads, and cleanupDownloads awaits it (line 473).

The reviewer's mechanism is partly wrong, and that lowers the severity. The abort `cleanup` (lines 306-312) sets `swarm.suspended = true` before it calls `swarm.suspend()`. In hyperswarm 4.17.x, suspend() starts with `if (this.suspended) return` (index.js:611), so the call does nothing. Existing connections are not destroyed, and the flag only blocks new connections (_attemptClientConnections at line 287, incoming at line 347). That gives two outcomes:
(a) A peer is already connected when the user cancels. Replication keeps going, the entry and blob blocks arrive, and the whole file downloads and validates while the cancel is ignored. The lock is held for the full transfer and then released, so this is not a permanent hang. It hangs only if that peer later drops, because no reconnection is possible.
(b) The user cancels while peers are still being found. Peers that discovery queues are never dialled. swarm.flush() can then stay pending, because its pending-flush `missing` count never decreases (index.js:577-583, 142-150). doneFindingPeers is then never called, and drive.core.update() on an empty core waits on findingPeers. The result is a permanent hang that keeps the lock and the corestore, matching the claimed impact.

The path is reachable from a public entry point: a user cancels a pear:// model load early. Outcome (b) depends on hypercore/hyperswarm runtime timing, and outcome (a) is a cancel that is ignored rather than a hang. I rate it medium, not high: the timing window is narrow, but when it hits, the stuck lock persists until restart. A real fix would check `signal.aborted` before line 476 and race the lookup awaits against the signal. Separately, the `swarm.suspended = true` line stops suspend() from ever tearing down connections, which is a second bug.

<sub>fingerprint `qr1:3a93e94a7e635a80` · first seen at 0c8a1510ab4f</sub>

### Failed or cancelled seed downloads never close the corestore; a retry cannot reopen it and clearCache deletes the dir while it is still open

**File:** `packages/inference/src/handlers/load-model/hyperdrive.ts:370`  
**Category:** resource-leak · **Severity:** medium · **Confidence:** medium · **Status:** confirmed

### Evidence
In both finally blocks (lines 367-391 and 711-726) cleanupHyperdrive runs only when `!seed`, whatever the outcome. For seed=true, an error (checksum mismatch, NoBlobFoundError, network failure) or an abort leaves the Corestore, Hyperdrive and swarm open. On abort, `cleanup` has already suspended the swarm, so the open swarm is not even seeding. A retry calls setupHyperdrive with the same corestoreDir while the old Corestore still holds its storage lock. Also, if the user aborts with clearCache, line 389/724 deletes corestoreDir while that corestore is still open. The comment at line 372 flags exactly this as an EBUSY hazard on Windows.

### Impact
With seed: true, one failed or cancelled download makes every later attempt for that drive fail until the process restarts. Handles and swarm connections leak, and clearCache can fail with EBUSY or leave a corrupted store.

### Reproduction
loadModel with seed: true for a hyperdrive model whose registry checksum mismatches, or cancel it mid-download. Then call loadModel again for the same model: opening the corestore fails because the previous instance still holds the lock.

### Suggested fix
Call cleanupHyperdrive(setup) in the finally block whenever downloadSucceeded is false, and keep the setup alive only for a successful seed.

### Adversarial verification (agent)
I read hyperdrive.ts and the defect holds. In downloadSingleFileToFilesystem (finally block, lines 367-391) and downloadShardedFilesToFilesystem (lines 711-726), cleanupHyperdrive(setup) runs only inside `if (!seed)`, and no other branch closes the setup. When seed is true, keeping things open is intended after a successful download (that is what seeding means). It is not intended after an error or an abort. downloadAndValidateFile can throw FileNotFoundError, NoBlobFoundError, ChecksumValidationFailedError, size mismatch or stream errors. Abort throws DownloadCancelledError, and the abort `cleanup` listener has already suspended the swarm. In all of those cases the Corestore, Hyperdrive and Hyperswarm are left open and registered, and nothing in the caller (startOrJoinDownload or the download lock) closes them.

The path is reachable from public APIs: loadModel and downloadAsset both pass `seed` through handler.ts, download-asset.ts and resolve.ts. resolve.ts only checks that the source is a hyperdrive.

A retry uses the same getCorestoreDir(hyperdriveKey) and setupHyperdrive always builds `new Corestore(corestoreDir)`. No cached instance is reused. corestore ^7.11 is backed by hypercore-storage/RocksDB, which holds an exclusive LOCK on the directory, so a second open in the same process should fail. That is likely, but I could not run it. Even if the reopen worked, the old handles and swarm would still leak.

The clearCache branch runs regardless of `seed`, so with seed=true it calls deleteCorestoreDirectory while the store is still open. The comment on line 372 names that ordering as the Windows EBUSY hazard. deleteCorestoreDirectory swallows the error, so the result is a silently failed or partial delete, not a thrown error.

There is no test or comment saying the failure path is meant to leave things open. I am rating it medium, not high, because it only affects the opt-in seed=true path and only after a failure or cancel. Restarting the process clears it.

<sub>fingerprint `qr1:48ba4e77ffd1fd98` · first seen at 0c8a1510ab4f</sub>

### A lock whose dead owner's pid gets reused is never stolen, so starts on that fleet key time out until that unrelated process exits

**File:** `packages/ai-sdk-provider/src/managed/index.ts:99`  
**Category:** correctness · **Severity:** medium · **Confidence:** medium · **Status:** confirmed

### Evidence
The lock lives in ~/.qvac/managed-serves (registry.ts:20-21, 50-51), so it survives crashes and reboots. A client killed while holding it (SIGKILL, OOM, power loss, or the `process.exit(0)` at index.ts:201, which skips the `finally releaseLock`) leaves `<key>.lock` holding its pid. Liveness is only `kill(pid,0)` (registry.ts:57-65), and EPERM also counts as alive. Once any unrelated process reuses that pid, which is common after a reboot, tryLock returns false forever. The mtime fallback (lines 105-108) only covers locks with no readable pid. sweepServes never touches lock files. Every later startManagedQvac for that fleet key then loops in waitForHealthyRecord until overallDeadline and throws ServeStartTimeoutError (lines 279-284), without ever spawning.

### Impact
The user cannot start the managed provider for that model set. Every attempt waits the full serveStartTimeout+10s (minutes) and then fails, until the unrelated pid exits, which may be never for a system daemon. The only fix is to delete the lock file by hand.

### Reproduction
Write `~/.qvac/managed-serves/<fleetKey>.lock` containing the pid of a long-lived process, e.g. `1` or the shell's pid. Call startManagedQvac with models that hash to that fleetKey: it times out and never spawns.

### Suggested fix
Record a start time, boot id, or nonce with the pid and check it. At a minimum, treat a lock as stealable when its mtime is older than serveStartTimeout plus a margin, even if the pid looks alive. The owner could also refresh the lock's mtime as a heartbeat while it waits.

### Adversarial verification (agent)
I read the code and the claim holds up.

1. tryLock (index.ts:97-101) steals a lock only when `isProcessAlive(owner)` is false. isProcessAlive (registry.ts:57-65) is just `kill(pid,0)`, and it treats EPERM as alive. Nothing else is checked: no process start time, no boot ID, no hostname.
2. The mtime fallback (index.ts:103-108) runs only when the lock has no readable pid. The test managed-spawn-lock.test.ts:37-42 confirms on purpose that a lock with a live owner and an old mtime is never stolen. So a live pid always wins, including a reused one.
3. Nothing else removes `<key>.lock`. The only caller of releaseLock is the finally block at index.ts:273. sweepServes and sweepRunnerParams never touch .lock files. The lock lives in ~/.qvac/managed-serves, so it survives a reboot.
4. A lock can be left behind on reachable paths:
   - SIGKILL, OOM or power loss during the spawn window, which can last minutes of model download.
   - The `closeOnParentExit` watcher calls `process.exit(0)` (index.ts:201). That can fire while resolveServe holds the lock, and the code comment says the watcher is armed for exactly this long first-run download. process.exit skips the async finally, so releaseLock never runs.
5. Once the dead owner's pid belongs to any other process, every caller with that fleet key gets false from tryLock. They loop in 5s slices (index.ts:279-284) until overallDeadline and then throw ServeStartTimeoutError without spawning. The fallback mtime is 30s, but it does not apply here.

There is also a worse variant: the new client can get the same pid itself. This is common in a container whose home directory is a persistent volume, where pids are small and deterministic. Then `kill(own pid,0)` succeeds and the client waits on its own stale lock.

What makes it less likely: it needs an abnormal exit inside the spawn-lock window, and then a pid reuse. Linux usually has a large pid_max, so reuse during normal uptime is rare. It is more plausible after a reboot or in containers.

What makes it worse: once it happens, the state lasts until the unrelated process exits or someone deletes the lock file by hand. Each attempt costs serveStartTimeout+10s. The claimed impact is accurate but uncommon. I rate it medium, borderline low.

<sub>fingerprint `qr1:957fe7d04aa64561` · first seen at 0c8a1510ab4f</sub>

### The abort listener added in _streamBlobToFile is never removed, so listeners and stream references build up on the caller's signal

**File:** `packages/registry-server/client/lib/client.js:760`  
**Category:** resource-leak · **Severity:** low · **Confidence:** high · **Status:** confirmed

### Evidence
Each call to _streamBlobToFile adds an 'abort' listener with { once: true } (client.js:760-768). The finally block (:771-778) destroys the streams and turns off the 'download' handler, but it never calls removeEventListener. A once listener is only removed when abort actually fires, so after a successful or failed attempt the closure (which holds stream, writeStream and reject) stays attached to the signal. withRetry calls _streamBlobToFile up to maxRetries times per download (:379-391, :489-499), and each attempt adds another listener.

### Impact
When a caller reuses one AbortSignal across many downloads (for example a session-wide cancel signal), listeners and the destroyed read/write streams they reference build up without limit. On Node this can raise MaxListenersExceeded warnings. A later abort then runs destroy/reject on stale streams from downloads that already finished.

### Reproduction
Create a single AbortController and run 20 downloadModel(path, source, { outputFile, signal: ctrl.signal }) calls one after another. On Node, use events.getEventListeners(ctrl.signal, 'abort').length: it reports 20 or more after every download has finished.

### Suggested fix
Keep the handler in a variable, and in the finally block call options.signal.removeEventListener('abort', onAbort).

### Adversarial verification (agent)
client.js:753-769 adds an anonymous 'abort' listener with { once: true } to options.signal, and nothing ever removes it. The finally block (:771-778) destroys both streams, awaits the writer closing, destroys rangeDownload and turns off the core 'download' handler, but it never calls removeEventListener, and no AbortController is kept to remove the listener later. options.signal is the caller's signal passed straight through. The public download paths call _streamBlobToFile inside withRetry (:380, :490), so each attempt adds one more listener. Nothing wraps or derives the signal per download (a grep for AbortController in the file finds none). The path is reachable and nothing guards it: a caller that reuses one signal across downloads keeps one closure per attempt, holding stream, writeStream and reject. On Node, an AbortSignal with more than 10 listeners triggers the MaxListenersExceededWarning. The impact is overstated in one way. On a later abort, the stale listeners call destroy() on streams that are already destroyed, which does nothing, and reject() on promises that already settled, which also does nothing. So there is no wrong behaviour, only memory held until the signal is collected, plus the warning. This only happens when a long-lived signal is reused; with one signal per download it is garbage-collected together with the listeners. Severity stays low.

<sub>fingerprint `qr1:7788c40f8eb4a180` · first seen at 0c8a1510ab4f</sub>

### getModelByName returns Object.prototype members for names like "constructor", "toString" or "__proto__" instead of undefined

**File:** `packages/inference/src/models/update-models/codegen.ts:233`  
**Category:** correctness · **Severity:** low · **Confidence:** high · **Status:** confirmed

### Evidence
The template (codegen.ts:222-224) emits `modelNameCompatibilityAliases` as a plain object literal, so it inherits from Object.prototype. When no catalog entry matches, `getModelByName` (codegen.ts:233, generated at models.ts:29617) falls back to `modelNameCompatibilityAliases[name]` with no own-property check. `name` is an arbitrary string, so 'constructor' returns the `Object` function, 'toString'/'hasOwnProperty' return functions, and '__proto__' returns Object.prototype. All of these are typed as `RegistryItem`. The JSDoc says the function returns `undefined` when no catalog entry has that name.

### Impact
A caller that looks up a user-supplied or config-supplied model name, such as the documented `getModelByName("WHISPER_TINY_Q8_0")` usage, gets a truthy non-RegistryItem back for these keys. Code then reads `.registryPath`, `.blobCoreKey` and similar fields as undefined and fails later with confusing errors, or builds a source like `registry://undefined/undefined`, instead of taking the not-found branch.

### Reproduction
`import { getModelByName } from '@qvac/sdk/models/registry'; console.log(getModelByName('constructor'))` prints `[Function: Object]`, not `undefined`. `getModelByName('__proto__')` returns `{}` (Object.prototype).

### Suggested fix
Emit the lookup table with a null prototype, e.g. `Object.assign(Object.create(null), { ... })`, or a `Map`, or guard it with `Object.hasOwn(modelNameCompatibilityAliases, name) ? modelNameCompatibilityAliases[name] : undefined`. Then regenerate models.ts.

### Adversarial verification (agent)
I could not disprove the claim. codegen.ts:222-224 emits `modelNameCompatibilityAliases` as a plain `{...}` literal. It is not built with `Object.create(null)` or a `Map`. At codegen.ts:233 (generated as models.ts:29617), `getModelByName` returns `models.find(...) ?? modelNameCompatibilityAliases[name]` without an own-property check (no `Object.hasOwn`). In JavaScript this means `getModelByName('constructor')` returns `Object`, `'toString'` and `'hasOwnProperty'` return functions, and `'__proto__'` returns `Object.prototype`. None of these is undefined, which breaks the JSDoc promise that the function returns `undefined` when nothing matches. The function is public. models/registry/index.ts re-exports `@/models/registry/models`, and both @qvac/inference (package.json:82) and @qvac/sdk (package.json:157) export `./models/registry`. The docs (ocr-ggml registry-models.md:145) show it being called with a string. Nothing guards the input: there is no schema validation, and no internal caller wraps it. The only use I found is model-constant-compatibility.test.ts, which tests only real legacy names. The impact is overstated, though. No code inside the repo passes untrusted names to it. Only an external caller doing a lookup by a name taken from config could hit it, and only with Object.prototype key names, which is unlikely. The likely result is a confusing error later on, with no security impact. The fix is one line: use `Object.hasOwn`, `Object.create(null)`, or a `Map`. Severity stays low.

<sub>fingerprint `qr1:340733195994c6be` · first seen at 0c8a1510ab4f</sub>

### The closeOnParentExit interval is never cleared when startup fails and can later process.exit() the caller

**File:** `packages/ai-sdk-provider/src/managed/index.ts:295`  
**Category:** resource-leak · **Severity:** low · **Confidence:** high · **Status:** confirmed

### Evidence
With closeOnParentExit, `parentWatch` is armed at lines 193-205, before resolveServe. If resolveServe throws (ServeStartTimeoutError, ServeSpawnFailedError, an fs error), the catch at lines 291-297 only removes the consumer and rethrows. `parentWatch` is not cleared, and no provider or close() is returned that could clear it. The interval is unref'd, so it doesn't keep the loop alive, but it keeps polling for the life of the process. If the parent later goes away, it calls `process.exit(0)` (line 201) for a provider that does not exist. Each failed attempt adds another interval.

### Impact
A host that catches the startup failure and keeps running (e.g. falls back to another backend or retries) is left with leaked timers, one per failed attempt. If the parent dies later, the host is force-exited with code 0 by an object it never got back, without its own shutdown logic.

### Reproduction
Call startManagedQvac({models, closeOnParentExit: true, serveBinPath: '/nonexistent'}) and catch the rejection. Check that the interval is still registered (e.g. via process._getActiveHandles or a fake-timer spy on setInterval/clearInterval): it was never cleared.

### Suggested fix
In the catch block around resolveServe (line 291), add `if (parentWatch !== undefined) clearInterval(parentWatch)` before rethrowing.

### Adversarial verification (agent)
The code matches the claim. In packages/ai-sdk-provider/src/managed/index.ts, `parentWatch` is armed at lines 193-205, before `resolveServe()`. The catch at lines 291-297 only calls `removeConsumer` and rethrows. It never calls `clearInterval(parentWatch)`. The only other place that clears the interval is `close()` (line 375), and `close()` only exists after startup succeeds. You can reach this from the public API: `startManagedQvac` (or `createQvac` with mode 'managed') with `closeOnParentExit: true` and a startup failure, such as ServeStartTimeoutError, ServeSpawnFailedError, or an fs/lock error from addConsumer or writeEphemeralConfig. No finally block or wrapper guards it, and no test or comment says the interval should outlive a failed start. Each failed attempt leaves one more unref'd 2s interval running.

The claimed impact is overstated, though. According to types.ts:77-85, `closeOnParentExit` is opt-in and only meant for daemon-style hosts "whose lifetime must not exceed its parent's", and it explicitly "exits this process" when the parent dies. A host that sets it has already agreed to be exited when the parent dies. So the leftover watch exiting the process after a failed start is close to what that host asked for, not an unexpected kill of an unrelated caller. The real problems are:
- the timers leak, one per retry, but each is cheap and unref'd;
- the behavior is inconsistent: a successful provider stops the pact on `close()`, while a failed start can never stop it;
- the exit skips the host's own shutdown, and the stale `removeConsumer` runs on an already-removed marker, which does no harm.

It's a real but minor lifecycle bug in an opt-in, niche path, so I'm keeping the severity at low.

<sub>fingerprint `qr1:18c3584e8579beaf` · first seen at 0c8a1510ab4f</sub>

### An abort that fires during the state-dir await is lost: the fitter still starts and the caller waits up to 30 s instead of getting 'cancelled'

**File:** `packages/inference/src/model-fit/run/run.ts:218`  
**Category:** correctness · **Severity:** low · **Confidence:** high · **Status:** confirmed

### Evidence
runFit checks `options.signal?.aborted` only once, at run.ts:209, before `await resolveStateDir(...)` (run.ts:218). When no stateDir is passed, which is the production path through fit-load.ts:48-51, that await runs a dynamic `import('@/utils/cache/paths')` plus `getCacheDir`, so it yields to the event loop. If the signal aborts in that window, its one 'abort' event fires while nothing is listening. After the await, runFit does not check `signal.aborted` again. It writes the `.running` marker, starts the fitter through settle() (run.ts:255), and then bounded() calls `signal.addEventListener('abort', onAbort, {once:true})` at run.ts:180 on a signal that is already aborted. That event never fires again, and bounded() never checks `signal.aborted` itself. The call therefore resolves only when the fitter returns, or after FIT_TIMEOUT_MS (30 s) with reason 'timeout'. If it times out, run.ts:177 also adds the key to `hung`, so every later fit of that request answers 'timeout' until the fitter returns. The doc comment (run.ts:196-198) says an aborted signal answers 'cancelled' at once, and the test 'an aborted caller never reaches the fitter' says a cancelled caller never reaches the fitter. Both are broken in this window.

### Impact
A user who cancels a model load right as it starts can still have the native fitter run and can wait up to 30 s before the load call returns. The result comes back as 'timeout' or 'completed' instead of 'cancelled'. A hung fitter can also put the request into the process-wide `hung` set, so later loads of that model get 'timeout' answers.

### Reproduction
In a brittle test, call `runFit(PROBE, { signal: controller.signal, callFit, timeoutMs: 200 })` with no stateDir, so the dynamic import runs, and call `controller.abort()` straight after, in the same tick and before the returned promise settles. Use a callFit that counts calls and waits on a promise that never resolves. Expected: status 'unknown' with reason 'cancelled' and calls === 0. Actual: calls === 1 and, after 200 ms, reason 'timeout'. You can also inject the delay by passing a stateDir and wrapping resolveStateDir in a setImmediate-delayed promise.

### Suggested fix
After the await, re-check `if (options.signal?.aborted === true) return unknown('cancelled', 'Fit was cancelled')` before any markers are written or inFlight is changed. As a second guard, have bounded() check `signal?.aborted` right after registering its listener and call onAbort() if the signal is already aborted.

### Adversarial verification (agent)
The code matches the claim. runFit (run.ts:209) checks `signal.aborted` once, before `await resolveStateDir(...)` (run.ts:218). fitLoad (fit-load.ts:48-51) never passes a stateDir, so production always takes the `await import('@/utils/cache/paths')` path. tsconfig uses module esnext, so the dynamic import is kept and the function yields there. After the await, nothing checks the signal again before settle() starts the fitter (run.ts:255). bounded() then only calls `signal.addEventListener('abort', ...)` (run.ts:180). bare-abort-controller@1.1.2 `_abort()` returns early when the signal is already aborted and dispatches 'abort' only once (index.js:39-44). A listener added later never fires, and bounded() never checks `signal.aborted`. So an abort that lands in that window cannot answer 'cancelled'. The fitter runs, and the call resolves only when the fitter returns or after 30 s with 'timeout' (which also adds the key to `hung`, run.ts:177). This breaks the doc comment at run.ts:196-198.

The path is reachable from a public entry point: load-model.ts:136-146 passes `request.signal` to runLoadFitCheck, then fitLoad, then runFit.

The impact is overstated:
1. The window is narrow. It lasts as long as the dynamic import of an already-cached module takes to resolve, maybe only a few microtasks. An abort delivered as an I/O or timer macrotask may rarely or never land in it. The exact timing depends on Bare's import() scheduling, which I can't observe.
2. The caller's final result is still correct. load-model.ts:150-152 re-checks `request.signal.aborted` after the fit check and throws InferenceCancelledError, so the user does get a cancellation, only late (up to 30 s).
3. The fit is advisory. A 'timeout' or `hung` entry maps to an 'unknown' verdict, and the load goes ahead, so later loads are not blocked.

The real costs are a delayed cancel, a wasted native fitter run, and possible `hung` pollution. Severity: low.

<sub>fingerprint `qr1:9b2979b4683f0ff7` · first seen at 0c8a1510ab4f</sub>

### Throughput rates divide swarm-lifetime byte counters by download-only elapsed time, inflating rx/tx per second

**File:** `packages/registry-server/client/lib/profiler.js:46`  
**Category:** correctness · **Severity:** low · **Confidence:** high · **Status:** confirmed

### Evidence
collectStats takes bytesRx/bytesTx from swarmStats.dhtStats.udxBytesReceived/Transmitted (lines 29-30). These counters are cumulative since the Hyperswarm was created at profiler.js:172. That covers DHT bootstrap, view-core metadata sync and blob-core update. But elapsedSec comes from emitStats as (performance.now() - tDownloadStart)/1000 (line 244), and tDownloadStart is only set at line 241, after all of that work. So rxPerSec = (metadata bytes + DHT bytes + blob bytes) / blob-transfer seconds.

### Impact
The 'Bytes received ... (X/s)' figure that the profiler exists to report is overstated, badly so in the first intervals and on small or fast blobs. A user diagnosing slow downloads sees a misleading throughput number. The 'Bytes received' total also includes non-blob traffic, while the line suggests it is the download.

### Reproduction
Profile a small model against a registry with a large view core. At the first stats tick, rxPerSec is far above the real blob throughput: compare it with blob.byteLength / transferSec from the final summary.

### Suggested fix
Snapshot udxBytesReceived/Transmitted at tDownloadStart. Pass the baseline into collectStats and compute rates from (current - baseline) / elapsedSec, or label the totals as cumulative swarm traffic.

### Adversarial verification (agent)
The code matches the claim. collectStats (profiler.js:29-30) reads swarmStats.dhtStats.udxBytesReceived/Transmitted. These are cumulative UDX counters for the Hyperswarm created at line 172, and the code never subtracts a baseline. emitStats (line 244) computes elapsed from tDownloadStart, which is set at line 241. That happens only after DHT bootstrap, the viewCore.update() metadata sync (line 203), the db reads, and blobCore.update() (line 236). So rxPerSec/txPerSec at line 46 divide all bytes since the swarm started by the blob-transfer seconds only. No baseline snapshot is taken, so nothing guards against this. The unit tests (tests/unit/profiler.test.js:84-126) only check the division on synthetic inputs, so they don't show the mixed time bases are intended. The path is the main code path of profileDownload, so every run hits it. The impact is limited, which keeps severity low. It is a diagnostic tool. The final summary's 'Avg speed' (line 274) is computed correctly as blob.byteLength/transferSec, so the headline number is not affected. Pre-download DHT and metadata traffic is usually small (KB to low MB) next to model blobs (hundreds of MB to GB). The inflation is therefore large mainly in the first interval and on small or fast blobs, and fades on long downloads. The 'Bytes received' total also counts non-blob traffic, but the label says 'Network (UDX)', which partly signals that. Fix: take a baseline of the UDX byte counters at tDownloadStart and report deltas, or divide by time since swarm creation.

<sub>fingerprint `qr1:e87043a1abebb634` · first seen at 0c8a1510ab4f</sub>

### totalBytesDownloaded/downloadSpeedBps count bytes that were already on disk (resumed partials, cached shards)

**File:** `packages/inference/src/handlers/load-model/download-stats.ts:61`  
**Category:** correctness · **Severity:** low · **Confidence:** high · **Status:** confirmed

### Evidence
wrapProgressCallback (download-stats.ts:57-67) takes the max of absolute progress counters (`fileSetInfo.overallDownloaded ?? shardInfo.overallDownloaded ?? downloaded`) as 'bytes downloaded', and computeStats (102-108) reports it as totalBytesDownloaded and divides it by elapsed time for downloadSpeedBps. Those counters are not network-transfer counts: (1) HTTP single-file resume sets `downloadedBytes = startOffset` (http.ts:230) and emits `downloaded: downloadedBytes` (http.ts:393-397), so the partial already on disk is included; (2) HTTP sharded download marks cached shards `downloadedBytes = expectedSize` (http.ts:780-784) and calls markCacheMiss when any shard is missing (http.ts:793), and overallDownloaded sums every shard (http.ts:1010); (3) Hyperdrive sharded download calls markCacheMiss (hyperdrive.ts:585) and then reports skipped, already-valid files with overallDownloaded including their size (hyperdrive.ts:618-638). Because cacheHit is false in all three cases, the collector accepts these values. No baseline is captured and subtracted.

### Impact
Profiling metrics for loadModel/downloadAsset (the totalBytesDownloaded and downloadSpeedBps gauges, types.ts:86-90) overstate network transfer. With a 10-shard model where 9 shards are cached, the stats report the full model size as downloaded in the time it took to fetch one shard, so the speed is off by roughly 10x. A resumed 5 GB download that only fetched the last 100 MB reports 5 GB. These numbers feed operation metrics and are misleading for bandwidth and benchmarking analysis.

### Reproduction
Unit test: call downloadModelFromHttpWithStats with downloadModelFromHttp mocked to call hooks.markCacheMiss() and then progressCallback({downloaded: 900, total: 1000}) followed by ({downloaded: 1000, total: 1000}), which mimics a resume from offset 900. The result has stats.totalBytesDownloaded === 1000, but only 100 bytes were transferred. Real repro: load a sharded HF model with profiling on, delete one shard file from the cache, load again, and compare totalBytesDownloaded with that shard's size.

### Suggested fix
Record a baseline from the first progress event received after markCacheMiss (or have producers report a transferred-bytes field) and store maxBytesDownloaded - baseline. Better still, add a `transferred` counter to the progress/hook contract (e.g. hooks.addBytesTransferred(n) called per chunk) and sum it instead of inferring transfer from absolute progress counters.

### Adversarial verification (agent)
I checked each part of the claim against the code and none of it holds up as a false alarm. wrapProgressCallback (download-stats.ts:57-67) skips progress only when collector.cacheHit === true. Otherwise it records max(fileSetInfo.overallDownloaded ?? shardInfo.overallDownloaded ?? downloaded). Nothing records the bytes already on disk at the start, so nothing is subtracted. computeStats (102-108) then reports that value as totalBytesDownloaded and divides it by elapsed time to get downloadSpeedBps. I confirmed each source the reviewer named. (1) http.ts:229-230 sets downloadedBytes = startOffset, the size of the partial file already on disk. When the server answers 206, the counter is not reset (it resets only for a non-206 reply, lines 302-306). The data handler then emits downloaded: downloadedBytes, which includes the prefix (393-397). The 416 branch (283-289) is worse: no cache hook is called, so cacheHit stays undefined, and it emits downloaded: startOffset. That reports the whole file as downloaded in roughly zero time. (2) In the HTTP sharded path, cached shards get downloadedBytes = expectedSize (780-784), markCacheMiss is called when any shard is missing (793), and overallDownloaded adds up every shard (1010). (3) In Hyperdrive, markCacheMiss runs at hyperdrive.ts:585, then already-valid files add their size to overallDownloaded and report it in progress (618-638). registry.ts:216 and registry-companion-set.ts:122 do the same thing, so the problem is wider than the reviewer said. These paths are reachable through the public loadModel/download flow whenever a download resumes or some shards are already cached. No caller or wrapper corrects for it. The comment at line 58 says cache-hit bytes should not count as network transfer, which shows this behaviour is not intended. No test sets an expected value for totalBytesDownloaded. The impact is limited to profiling gauges (types.ts:86-87, operation-metrics.ts:60-61) and does not affect downloads or model loading, so low severity is right.

<sub>fingerprint `qr1:73718bee0297c2cf` · first seen at 0c8a1510ab4f</sub>

### A mismatch in the inner addon is blamed on the platform package, which leads to a wrong message and a pin that cannot fix it

**File:** `packages/sdk/src/commands/verify/prebuilds.ts:105`  
**Category:** correctness · **Severity:** low · **Confidence:** medium · **Status:** confirmed

### Evidence
In resolvePrebuildLocations (prebuilds.ts:97-106), when the platform package wraps an inner `addon/` directory, the inner addon's version is stored in the same `mismatchedVersion` field used for the platform package's own version. This happens even when the platform package's own version (installedVersion, line 89) equals addon.version. Two things follow. (1) missingPlatformPackageHint (lines 203-207) prints `${platformPackage} ${mismatchedVersion} is installed, but it must be the same version as ${addon.name}. Pin it ...: "pkg": "<addon.version>"`. That names the inner addon's version as the platform package's version, and tells the user to pin a version that is already installed. (2) checkPrebuilds treats any mismatchedVersion as needsPin (lines 151-155), so it sets issue.platformPackage = {name, version: addon.version}. host-prebuilds/index.ts:161-196 collects that pin, installs the same version again (line 124), then runs the check again (line 135). The inner addon is still mismatched, so the same pin comes back and the command throws HostPrebuildsInstallFailedError("... succeeded, but <pkg> is still not installed under node_modules"). The test at commands-verify.test.ts:1052-1057 sets up exactly this state (wrapper 0.8.1, inner addon 0.8.0) but checks only the issue count, not the message or the pin.

### Impact
The user is told that `@qvac/asr-ggml-linux-x64 0.8.0 is installed` when 0.8.1 is installed, and is told to pin 0.8.1, which they already have. For mobile hosts, the automatic host-prebuilds install runs a useless reinstall, then fails with a false 'still not installed under node_modules' error.

### Reproduction
Use the fixture from commands-verify.test.ts:1020-1052: meta @qvac/asr-ggml@0.8.1, platform package @qvac/asr-ggml-linux-x64@0.8.1 (not an addon), and addon/package.json at version 0.8.0 with prebuilds/linux-x64/*.bare. Then call checkPrebuilds({addon, hosts:['linux-x64']}). issues[0].message contains '@qvac/asr-ggml-linux-x64 0.8.0 is installed', and issues[0].platformPackage is {name:'@qvac/asr-ggml-linux-x64', version:'0.8.1'}, which is the version already installed.

### Suggested fix
Store the inner-addon mismatch in its own field (for example `nestedMismatchedVersion`), or record which manifest it came from. In checkPrebuilds, emit a platformPackage pin only when the platform package's own version differs from the addon's. For an inner-addon mismatch, describe it as a broken or inconsistent platform package (report the inner addon's version and path) and do not ask the user to pin.

### Adversarial verification (agent)
I read the code and the claim holds. In prebuilds.ts:89-96, mismatchedVersion is set only when the platform package's own manifest version differs from addon.version. Lines 97-106 then fill that same field with the inner `addon/` manifest version when the wrapper's version matched. PrebuildLocation does not record which of the two mismatched. So when the wrapper is 0.8.1 (the same as the addon) and the inner addon is 0.8.0, three things follow. (1) missingPlatformPackageHint (lines 203-207) prints "<platformPackage> 0.8.0 is installed ... Pin it ...: \"<pkg>\": \"0.8.1\"". That is false: the wrapper is already at 0.8.1, so the pin changes nothing. (2) checkPrebuilds sets needsPin from any mismatchedVersion (lines 151-155), so issue.platformPackage = {name, version: addon.version}. (3) For mobile hosts, host-prebuilds/index.ts:108-145 runs `<pm> add pkg@0.8.1`, which installs the version already present, and checks again at line 135. The inner addon is still 0.8.0, so the same pin comes back and the command throws HostPrebuildsInstallFailedError("... succeeded, but <pkg> is still not installed under node_modules"). That error is misleading. Nothing upstream guards this. The test at commands-verify.test.ts:1052-1057 sets up exactly this state but asserts only the issue count, and the test at 1058-1066 covers only the precedence when both versions mismatch. So the behavior is untested, not shown to be intended. Impact is overstated in one respect: the inner addon only disagrees with its own wrapper when the platform package was published wrongly or node_modules was hand-edited or corrupted, which is uncommon. Rejecting the prebuild is still the right outcome there. Only the diagnosis and the auto-install remedy are wrong. Severity: low.

<sub>fingerprint `qr1:d3191d5eefefa18e` · first seen at 0c8a1510ab4f</sub>

### addModel reports failure after the model is already committed when blind-peer replication stalls

**File:** `packages/registry-server/lib/registry-service.js:861`  
**Category:** error-handling · **Severity:** low · **Confidence:** medium · **Status:** confirmed

### Evidence
The put-model op is appended at line 861. Only after that does addModel await `this.reseedTracker.waitForComplete()` (line 866), which rejects after 30s without replication progress (reseed-tracker.js:95-121). The rejection propagates out of addModel and the add-model RPC (lines 575, 592-595), so the client receives an error even though the registry record and blob already exist.

### Impact
A slow or unreachable blind peer turns every ingest into a reported failure that actually succeeded. The natural client response is a retry without skipExisting. That re-downloads the artifact and appends a second full copy to the blob core (lines 846-861), leaving the first copy orphaned: multi-GB storage growth per retry. clearAfterReseed is also skipped for that ingest.

### Reproduction
Configure blindPeerKeys with a peer that is offline. Call add-model over RPC: after about 30s the client gets 'ReseedTracker: stalled…', yet getModelByKey returns the model. Retry the same request and the active blob core length grows again.

### Suggested fix
Treat replication wait failure after a successful append as non-fatal: log it, return the model with a `replicated: false` flag, and skip clearing. Or wait for replication before appending the record.

### Adversarial verification (agent)
The mechanics are as the reviewer describes. In addModel (registry-service.js:845-866) the blob is uploaded, the core is mirrored, and DISPATCH_PUT_MODEL is appended at line 861. Only after that does it await `this.reseedTracker.waitForComplete()`. There is no try/catch around that wait, only a `finally` that removes the temp directory (901-903). waitForComplete (reseed-tracker.js:94-121) rejects if no replication progress is seen within 30s. The add-model RPC handler (563-595) re-throws, so the client gets an error for a model that was in fact committed.

Reachability: the path runs whenever blind peers are configured. `_setupBlindPeering` creates the tracker at line 440, and `_mirrorBlobCore` tracks the blob core at line 524. A blind peer that is down, unreachable or slow is enough to trigger it, which is realistic for multi-GB GGUF blobs under a 30s no-progress window.

Mitigations that cut the severity down:
1. Only a writer can reach this path (`ensureWriterAccess`), so the client is an operator script such as add-model.js or add-all-models.js, not an untrusted user.
2. The error text says "ReseedTracker: stalled …" plainly, and the scripts have a --skip-existing flag. A retry with that flag returns the existing record (803-811) without re-uploading.
3. Skipping clearAfterReseed on a stall is the safe outcome. Clearing local blocks that never replicated would lose data, so that part of the claim is not a defect.
4. Blind peering stays active, so replication can still finish in the background.

Waiting on replication is clearly deliberate (it protects clearAfterReseed). The defect is narrower: success is reported as failure after the commit, and nothing marks the record as committed-but-unreplicated. A naive retry without --skip-existing appends a second blob and orphans the first, so the storage-growth impact is real but depends on operator behaviour.

Severity: low. The path is operator-only, the error is explicit, and a documented mitigation exists.

<sub>fingerprint `qr1:b3225f38d2dd8ab1` · first seen at 0c8a1510ab4f</sub>

### close() returns early on a background-stop promise without bumping generation, so a pending getRPC starts a new worker after close() resolved

**File:** `packages/sdk/src/client/rpc/node-rpc-client.ts:482`  
**Category:** concurrency · **Severity:** low · **Confidence:** medium · **Status:** confirmed

### Evidence
`stopInBackground` (node-rpc-client.ts:333-344) stores its terminate promise in the shared `closePromise`. It is called from `notifyChannelClosed` (l.447) and from `ensureRPC`'s failure path (l.427). `close()` (l.481-485) treats any non-null `closePromise` as "a close is already running": it awaits that promise and returns. It skips `generation++` and does not abort a launch. Meanwhile, `ensureRPC` callers that arrived after the crash are parked at l.356-358 (`await closePromise; return ensureRPC()`). When the background stop resolves, they re-enter `ensureRPC` with `rpcPromise === null` and the unchanged `generation`, so they spawn a fresh worker (l.361-415). That happens after `close()` has already resolved to its caller.

### Impact
An app calls `close()` for shutdown right after a worker crash or channel close, while another call is waiting in `getRPC()`. `close()` resolves, but a new Bare worker process starts afterward and stays alive with live IPC handles. The Node process does not exit, and the caller gets a working client after it shut the SDK down.

### Reproduction
Start the client and get an RPC. Kill the worker so the RPC layer calls `notifyChannelClosed()` (which sets `closePromise` via `stopInBackground`). Call `getRPC()` without awaiting, then `await close()` right away. After `close()` resolves, check that a new worker was spawned (e.g. spy on `startUnbundled`/the harness `start`) and that `getWorkerLifeSignal()` becomes non-null again.

### Suggested fix
Keep a separate promise for background stops (e.g. `stoppingPromise`), which `ensureRPC` awaits and `close()` does not take as a finished close. Or, in `close()`, always run `generation++` before awaiting an existing `closePromise`, so starts that are waiting fail with `WorkerShutdownError` (and check `generation` again in `ensureRPC` after `await closePromise`).

### Adversarial verification (agent)
I traced the code and the path is real. `stopInBackground` (l.333-344) sets the shared `closePromise` to the terminate promise. It is called from `notifyChannelClosed` (l.447), which the RPC layer calls in rpc-client.ts:142, and from the `ensureRPC` failure path (l.427). After `resetModuleState()`, a later `getRPC()` waits at l.356-358 and then calls `ensureRPC()` again. If `close()` runs during that window, l.482-485 only awaits `closePromise` and returns. It does not run `generation++`, and since `rpcPromise` is null there is no pending start to cancel. When the terminate promise settles, its `.finally` clears `closePromise`. The waiting caller then finds `rpcPromise` and `closePromise` both null, takes `startGeneration` equal to the unchanged `generation`, and spawns a new worker. Nothing at l.364, 373, 378 or 411 stops it, because no bump happened. I found no guard in a caller or wrapper and no test covering this. expo-rpc-client.ts:153/250 has the same pattern.

The impact is overstated. `close()` is not a terminal shutdown by design: any `getRPC()` after `close()` starts a worker again. On the normal path (l.487+), a call that arrives *while* `close()` runs also waits on `closePromise` and then restarts a worker. So "a working client after shutdown" is partly how the code behaves anyway. The real inconsistency is narrower. A start that was already waiting before `close()` was called escapes the generation cancel that an in-flight launch would get (l.364/373/378). Triggering it needs three things at once: a worker crash or channel close, a concurrent `getRPC` caught in the short terminate window, and an app shutdown at that moment. The orphaned worker would keep the Node process alive, so the bug is real but rare. Severity: low.

<sub>fingerprint `qr1:b3fffed0cd3fbaa7` · first seen at 0c8a1510ab4f</sub>

### setupHyperdrive leaks an opened Corestore when Hyperdrive.ready() throws

**File:** `packages/inference/src/handlers/load-model/hyperdrive.ts:85`  
**Category:** resource-leak · **Severity:** low · **Confidence:** medium · **Status:** confirmed

### Evidence
The corestore is opened at lines 81-82, but registerCorestore runs only at line 109 and callers get `setup` only on success. If `drive.ready()` throws (for example on corrupted local storage or an invalid key length), nothing closes or registers the corestore. Neither caller can clean it up, because the throw happens before `setup` exists (lines 304, 589).

### Impact
The corestore's storage lock stays held for the rest of the process, so every retry against that hyperdriveKey fails and the runtime shutdown sweep never closes the store.

### Reproduction
Corrupt the files under ~/.qvac/corestore/<key> so Hyperdrive.ready rejects, then call loadModel twice. The second call fails on the corestore lock instead of the original error.

### Suggested fix
Wrap the drive.ready() call in try/catch and `await corestore.close()` before rethrowing, or register the corestore right after corestore.ready().

### Adversarial verification (agent)
The structural defect holds up. In setupHyperdrive (hyperdrive.ts:81-85) the Corestore is created and `await corestore.ready()` runs before `new Hyperdrive(...)` / `await drive.ready()`. Nothing wraps these lines in a try/catch or finally. registerCorestore only runs at line 109, after the swarm setup. Both callers do `const setup = await setupHyperdrive(...)` (lines 304 and 589) before their own try/finally starts, and cleanupHyperdrive(setup) needs the returned object, so if drive.ready() throws, nothing closes or unregisters the opened corestore. The lifecycle registry (runtime-lifecycle.ts:78) only tracks stores that were registered explicitly, so the shutdown sweep never sees this one.

Mitigation that lowers the impact: the "invalid key length" trigger the reviewer gives is mostly blocked on the public path. resolve.ts:246 parses pear:// sources with hyperdriveUrlSchema (schemas/load-model.ts:884), which requires exactly 64 hex characters. What is left as a trigger is an I/O or corruption failure inside drive.ready() (its Hyperbee/core open) that happens after corestore.ready() has succeeded. That is rare, but it is realistic on a persistent on-disk store that survives crashes. Callers that pass a raw hyperdriveKey (download-asset schema `hyperdriveKey: z.string()`) are a second, less-guarded way in. The claim that "every retry fails" depends on how Corestore locks its storage, which I can't see from here. It is plausible, given the comment at line 372 about the Windows EBUSY on LOCK. No test or comment suggests the leak is intentional. The fix is easy: wrap the lines after corestore.ready() in try/catch and close the corestore (and the drive) on failure. Severity stays low because the trigger is rare and needs local storage corruption.

<sub>fingerprint `qr1:cb83070b3082f59c` · first seen at 0c8a1510ab4f</sub>

### A cached Core ML set that is missing a bundle is reused forever, so bundles ingested later are never staged

**File:** `packages/inference/src/handlers/load-model/coreml-sidecars.ts:207`  
**Category:** correctness · **Severity:** low · **Confidence:** medium · **Status:** confirmed

### Evidence
findCoremlCompanionSet (lines 280-283) skips any .mlmodelc that is only partly ingested and returns a set with only the complete bundles. registry.ts:461 then saves that subset with writeCachedCoremlCompanionSet. isValidCachedSet (lines 145-149) accepts a bundle with 0 files, so the subset still validates. On every later load, findLocallyCachedCoremlCompanionSet (line 207-209) uses readCachedCoremlCompanionSet first, which beats both the catalog set (findCatalogCoremlCompanionSet) and the registry. registry.ts:430-439 returns as soon as it gets a cached set, and findCoremlCompanionSet is never called again.

### Impact
Take Sortformer's batch/AOSC pair. If the first load ran while only one bundle was ingested, the second bundle is never downloaded, even after the registry or the bundled catalog has it. The only way out is a manual cache clear.

### Reproduction
Stub client.findModels so it returns every component for bundle A and only some for bundle B. Load once, which writes the metadata. Then make findModels return everything for both bundles, or add both to the catalog, and load again. findLocallyCachedCoremlCompanionSet returns the set with bundle A only.

### Suggested fix
Treat a cached or catalog set that lacks some of spec.bundles as incomplete. Re-query the registry or fall back to the catalog when that one has more bundles, or require every bundle in isValidCachedSet and only write metadata for complete sets.

### Adversarial verification (agent)
I traced the code and found nothing that disproves the claim.

1. A partial set is a normal result. findCoremlCompanionSet (coreml-sidecars.ts:280-283) skips any bundle that is missing a component or a blobBinding.sha256 and returns the bundles that are complete. Tests (coreml-sidecars.test.ts:350-357) say an encoder-only set is usable "as Sortformer's two bundles do".

2. The partial set is saved. registry.ts:461 saves whatever findCoremlCompanionSet returned with writeCachedCoremlCompanionSet.

3. The saved partial set passes validation. isValidCachedSet (145-149) only rejects a bundle with between 1 and N-1 files. A bundle with 0 files is allowed, and actual.length only has to be greater than 0.

4. The cache key never changes. getCoremlSetKeySource (layout.ts:168-170) is registrySource:registryPath:coreml:spec.root. It does not depend on which bundles are present, so a bundle ingested later under the same root (Sortformer's two bundles share one root) gives the same setKey, and the old metadata still matches.

5. The cached set wins on every later load. findLocallyCachedCoremlCompanionSet (207-209) reads the cached metadata before the catalog. It returns the subset as long as those files are on disk, and registry.ts:430-439 returns right away without calling findCoremlCompanionSet again. Nothing compares the subset against the catalog or the registry, and the metadata has no TTL.

6. Nothing else clears it. The only removal in downloadCompanionSetFromRegistry (registry-companion-set.ts:165-167) runs on cancel with shouldClearCache. The doc comment at line 255 ("use them as soon as the registry has ingested the files") shows the intent is to pick up bundles as they appear, which this cache defeats.

Reachability: the bug needs the first load to happen while a bundle is only partly ingested, or before it is published at all. Bundles are published in steps (see the ACE-Step comment about a bundle "published after the GGUF"), so this can happen, but the window is narrow. If a bundle moves to a new dated root, spec.root and therefore the key change, which limits the bug to bundles added under the same root.

Impact: the missing bundle silently falls back to ggml or a degraded path rather than failing outright. The fix is a cache delete, so the impact is overstated as "forever", but it is a real staleness bug. I'm downgrading it to low.

<sub>fingerprint `qr1:947c206a36ad11a9` · first seen at 0c8a1510ab4f</sub>

### Deleting a model leaves its Core ML sidecar blobs in storage when any staged sidecar file is missing or partial

**File:** `packages/inference/src/handlers/load-model/coreml-sidecars.ts:216`  
**Category:** resource-leak · **Severity:** low · **Confidence:** medium · **Status:** confirmed

### Evidence
registry-delete.ts:179 builds the list of blob bindings to clear (clearBlob at :80) from findLocallyCachedCoremlCompanionSet. That function returns undefined as soon as one file in sets/<key>/ is missing or has the wrong size (lines 212-219). Delete then pushes no sidecar bindings. The sets directory is still removed (:176-178), but the hypercore blob ranges for the .mlmodelc components are never cleared.

### Impact
After a sidecar download is interrupted or cancelled, or one staged file is removed, deleting the model frees the files on disk but leaves the sidecar blob data in the registry blob store. That can be hundreds of MB that no later delete reclaims, because the sets dir and its metadata are gone.

### Reproduction
Download a Core ML model and cancel partway through the sidecars, or delete one file under sets/<key>/. Then run the delete handler. The clearBlob calls cover the GGUF binding only.

### Suggested fix
For deletion, get the set from readCachedCoremlCompanionSet ?? findCatalogCoremlCompanionSet without the per-file stat check. For example, export a metadata-only lookup and use it in registry-delete.ts.

### Adversarial verification (agent)
The claim holds up when I trace the code. In registry-delete.ts:173-185 (planCatalogued, the single-file branch), Core ML sidecar blob bindings are added only from `findLocallyCachedCoremlCompanionSet(entry, platform)`. That function (coreml-sidecars.ts:202-222) first takes the set from the `.coreml-companions.json` metadata, or from the catalog if there is none. It then stats every file in `sets/<key>/`, and returns `undefined` if any file is missing, is not a regular file, or has the wrong size. When that happens, `coremlSet?.files ?? []` is empty and no sidecar bindings are pushed. The sets directory is still added to `targets` (:176-178) and removed at :84-88. `clearBlob` (:78-80) then runs only on the GGUF's own binding.

The triggering path is reachable. registry.ts:452-461 writes the metadata only after `downloadCompanionSetFromRegistry` succeeds. A sidecar download that is paused or cancelled without clearCache keeps its corestore blocks for resume (registry-client-options `clearBlocksOnCancel` applies only when `shouldClearCache()` is true; see also registry-companion-set.ts:165). In that case the staged files are partial. The doc comment on `deleteRegistryModelCache` says it exists to delete "the corestore blocks a cancelled or failed download kept for resume". For the Core ML sidecars, the size gate does the opposite: it supplies bindings only when the download is complete, and drops them exactly in the partial-download case the function is meant to clean up.

Nothing else guards this. Other layouts (shards, the catalog `companionSet`, the plain single file) push bindings without checking the disk. No test or comment shows the strict check is intended for deletion; it was written for the load-time cache-hit check in registry.ts:430, and the delete code reuses it.

Impact: the leaked data is limited to blocks already fetched for the sidecars, and a later download of the same sidecars would reuse them rather than duplicate them. On top of that, when there is no metadata, the catalog fallback only works if the sidecars are in the catalog, so for registry-only sidecars the leak happens no matter what this gate does. That makes it a real but minor storage leak with no correctness or security effect. Severity: low.

<sub>fingerprint `qr1:00a6a3e24d6949aa` · first seen at 0c8a1510ab4f</sub>

### An IPv6 serveHost builds an invalid health URL, so every start times out

**File:** `packages/ai-sdk-provider/src/managed/serve-process.ts:361`  
**Category:** correctness · **Severity:** low · **Confidence:** medium · **Status:** confirmed

### Evidence
`host` comes straight from the user option `serveHost` (managed/index.ts:162, types.ts:60) and is put into the URL without brackets. With `serveHost: '::1'`, the serve binds correctly (it gets `--host ::1`) and reports its port on fd 3. But `baseURL` becomes `http://::1:PORT/v1`, which is not a valid URL. In waitForHealth (lines 203-213), `fetchImpl(healthUrl)` throws `TypeError: Invalid URL` on every attempt. The bare `catch {}` treats that as 'not listening yet' and keeps polling until the deadline, then throws `ServeStartTimeoutError` (line 216). registry.ts:121-122 strips `[`/`]` from hostnames, so IPv6 hosts are meant to be supported. Passing `[::1]` instead does not help, because that string also goes to `--host` and the serve cannot bind it.

### Impact
With an IPv6 loopback host, managed mode never starts. It waits the full start timeout and then shows a misleading 'serve did not become healthy' error, even though the serve is up and listening.

### Reproduction
Call spawnServe({ apiKey, configPath, host: '::1' }) with the fake-serve helper from test/helpers/fake-serve.ts. It rejects with ServeStartTimeoutError after startTimeoutMs. `new URL('http://::1:1234/v1')` throws.

### Suggested fix
Format the URL host separately from the bind host: `const urlHost = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host` and use urlHost in baseURL (lines 359 and 361). Also stop swallowing non-network errors such as TypeError in the waitForHealth catch.

### Adversarial verification (agent)
The claim holds. In serve-process.ts:305, `host` is `options.host ?? DEFAULT_SERVE_HOST`. It is passed unchanged to `--host` (line 327) and placed into `baseURL = \`http://${host}:${port}/v1\`` (line 361) without IPv6 brackets. Nothing validates or normalizes it on the way in: types.ts:60 and README:204 declare `serveHost?: string` with no constraint, and managed/index.ts:162 passes it straight through. With `serveHost: '::1'`, `http://::1:PORT/v1` is not a valid WHATWG URL, so `fetchImpl(healthUrl)` throws TypeError on every attempt. The bare `catch {}` at lines 211-213 swallows that as 'not listening yet', and the loop ends in ServeStartTimeoutError at line 216 even though the serve is up. The bracketed form is no workaround: the CLI hands `options.host` straight to fastify `app.listen({ host })` (cli/src/serve/index.ts:180). Node cannot resolve '[::1]' as a bind address, so the serve exits (ServeExitedError). The CLI clearly means to support IPv6 binds: server.ts:244-245 adds brackets itself when building origins, and cors.ts and host-check.ts strip them. The provider's registry.ts:121-122 also strips brackets. No test covers an IPv6 serveHost (no '::1' hits in ai-sdk-provider). I rate it below medium. The default is 127.0.0.1, and IPv6 loopback or '::' is an uncommon explicit opt-in. A user who sets it does get a total failure after the full 180s default timeout with a misleading error, but there are easy workarounds (an IPv4 host or 'localhost'). Fix: bracket the host when it contains ':' while building the URL (lines 359 and 361, plus index.ts:270/283), and/or stop the catch from hiding non-network TypeErrors.

<sub>fingerprint `qr1:6da3f6f4f22e007c` · first seen at 0c8a1510ab4f</sub>

### Stealing a dead owner's lock is check-then-delete, so two waiters can both 'win' and spawn duplicate serves

**File:** `packages/ai-sdk-provider/src/managed/index.ts:100`  
**Category:** concurrency · **Severity:** low · **Confidence:** medium · **Status:** confirmed

### Evidence
tryLock (index.ts:97-101) reads the owner pid, sees it is dead, then unconditionally `rm`s the lock path and retries `open(...,'wx')`. Nothing checks that the file being removed is still the dead owner's lock. Interleaving: waiters A and B both call readLockOwner and get the dead pid. A runs rm and then open('wx'), so the lock is now A's with A's pid. B then runs its rm, which deletes A's fresh lock, and B's open('wx') succeeds. Both return true, so both run the spawn branch (index.ts:230-256) for the same fleetKey. A's `finally releaseLock` (line 273) later deletes B's lock as well. The mtime branch at lines 105-107 has the same race. This is the exact 'duplicate runner/serve and double-load the model' case the comment at lines 80-86 says the lock exists to prevent.

### Impact
After a spawner crashes, several clients waiting on the same fleet key (e.g. several editor/agent sessions started together) can each launch a detached runner. You get two `qvac serve` processes that both load the same model, doubling RAM/VRAM, and one serve's registry record overwrites the other's.

### Reproduction
Write `<key>.lock` holding a dead pid. Make `rm` slow by stubbing fs (or loop many times), then run `Promise.all([tryLock(k), tryLock(k)])`. Both can resolve true. In an integration run, kill a spawner while it holds the lock and start two providers with the same models at once: two runners appear.

### Suggested fix
Make the steal atomic. Rename the stale lock to a unique temp name (rename is atomic, and only one stealer's rename succeeds) and re-check its contents before deleting it. Or re-read the owner just before rm and only remove the file if it still holds the same dead pid and inode (compare with stat). After winning open('wx'), check that the file contains our own pid.

### Adversarial verification (agent)
The code matches the claim. In tryLock (index.ts:88-111), when the 'wx' open fails with EEXIST, the function reads the owner pid (readLockOwner, line 97). If that process is dead (line 99), it does an unconditional `rm(lockPath(key))` (line 100) and calls itself again. Nothing checks that the file being removed is the one whose pid was read: there is no inode or content compare, no rename-to-claim and no atomic link-based steal. Two waiters can both read the dead pid. A removes the lock and re-creates it with 'wx', then B's rm deletes A's fresh lock and B's 'wx' open succeeds. Both return true and both reach the spawn branch (lines 230-256). The mtime fallback (lines 105-107) has the same problem. Nothing downstream stops a second runner. The winner's re-check `findReusableServe` (line 233) runs before either side has written a record, so it can't see the other. runner.ts only uses 'wx' at line 45, for its own file, and writes the record with writeRecordSync, so the last writer wins and one serve becomes orphaned. In the finally block, `releaseLock` (line 273) also does an unconditional rm, so it can delete another client's lock. The path is reachable through the public startManagedQvac whenever reuse is true. Waiters loop back to tryLock every 5s slice (lines 279-281), so after a spawner crashes every waiter on that fleet key contends for the lock. The comment at lines 80-86 shows that preventing a duplicate serve is the lock's stated purpose, so this is not intended behaviour. On impact: the race window is small, from the readFile to the rm, a few ms of async fs work. The waiters' 5s slices are also not synchronized, since each starts when that client's previous tryLock returned. And the trigger needs a spawner to crash mid-start while two or more clients wait. The cost is a wasted duplicate model load, plus one serve that only gets reaped by its idle timeout or the sweep. Data stays intact. So the defect is real but rare; I rate it low rather than medium.

<sub>fingerprint `qr1:84cf3436d5ce0fff` · first seen at 0c8a1510ab4f</sub>

### Live spec fetch fails outright when the cache directory isn't writable, even though the download succeeded

**File:** `packages/cli/src/openai/coverage/parse-spec.ts:129`  
**Category:** error-handling · **Severity:** low · **Confidence:** medium · **Status:** confirmed

### Evidence
fetchSpecLive calls mkdirSync(cacheDir) at parse-spec.ts:129 before fetching, and calls writeFileAtomically at :168-:172 after parsing. Neither call is wrapped. The cache is only an optimisation for the ETag and --offline paths, but any EACCES/EROFS/ENOSPC from these calls rejects parseSpecWithDependencies, so build-report.ts:100 never gets the entries it needed. The default CACHE_DIR is join(homedir(), '.cache', 'qvac') (:18).

### Impact
`qvac openai coverage` without --offline crashes with EACCES/EROFS in sandboxed CI, read-only HOME containers, or non-root Docker images with HOME=/. The spec was downloadable and parseable, and the cache isn't needed for a live run.

### Reproduction
Call parseSpecWithDependencies({}, { cacheDir: '/proc/qvac-cache', fetch: () => Promise.resolve(new Response(fixtureYaml, { status: 200 })), timeoutMs: 100 }). It rejects with an mkdir error instead of returning entries with sourceMode 'live'.

### Suggested fix
Make cache I/O best-effort in live mode: wrap the mkdirSync and the three writeFileAtomically/rmSync calls in try/catch (optionally logging a warning) and still return { yaml, entries, source, sourceMode: 'live' }.

### Adversarial verification (agent)
I read the code and the claim is correct. The live path is reached from a public command: `qvac openai coverage` without `--offline` goes from openai/command.ts to runOpenAiCoverage (coverage.ts:16), then buildCoverageReport (build-report.ts:100), then parseSpec, then fetchSpecLive.

In fetchSpecLive (parse-spec.ts:123-177), the call `mkdirSync(dependencies.cacheDir, { recursive: true })` at :129 runs before the fetch and is not wrapped in try/catch. The etag read at :132-137 is guarded, but this mkdir is not. After a successful 200 and a successful parseSpecYaml at :167, the code calls writeFileAtomically for the spec, sha256 and etag files (:168-172). Each of those calls mkdirSync, mkdtempSync, writeFileSync and renameSync (:110-121), and none of them is guarded. If any of them throws EACCES, EROFS or ENOSPC, the whole promise rejects and the entries that were already parsed are thrown away. The 304 fallback path (:144-158) also hits the same unguarded writes after its refetch.

Nothing upstream catches this. buildCoverageReport awaits parseSpec directly, and runOpenAiCoverage awaits buildCoverageReport directly.

There is no way around it from the CLI. CACHE_DIR is hardcoded to `join(homedir(), '.cache', 'qvac')` (:18), with no XDG_CACHE_HOME or environment override. The command offers only `--offline`, and that needs a cache which is already populated, so it doesn't help. buildCoverageReport does accept `specPath`, but the CLI never sets it: coverage.ts passes only `offline`.

None of the tests in openai-spec-fetch.test.ts cover an unwritable cache directory. Every test uses a writable mkdtemp directory, and nothing suggests the hard failure is intentional.

The impact is real but narrow. It needs a read-only or unwritable HOME, for example a container running with HOME=/ as non-root, a read-only rootfs, or a full disk. It affects one diagnostic or developer-facing command, it fails loudly instead of corrupting anything, and it doesn't touch the main runtime. Severity stays low.

<sub>fingerprint `qr1:50b76899eba2d613` · first seen at 0c8a1510ab4f</sub>

### Spec, SHA and ETag cache files are updated separately, so an interrupted or concurrent run leaves a hash-mismatched cache

**File:** `packages/cli/src/openai/coverage/parse-spec.ts:169`  
**Category:** concurrency · **Severity:** low · **Confidence:** medium · **Status:** confirmed

### Evidence
parse-spec.ts:168-175 renames openai-spec.yaml, then openai-spec.sha256, then openai-spec.etag, each in its own atomic step. Each file is atomic on its own, but the set is not. If the process dies or the write throws (e.g. ENOSPC) between :168 and :169, the new spec sits next to the old SHA. If two CLI runs overlap across an upstream spec change, the writes can interleave (A.spec, B.spec, B.sha, A.sha). After that, validateCachedSpecHash (:56) throws 'cached OpenAI specification hash mismatch' for the --offline path (:200), and the ETag/304 path silently does a full re-download.

### Impact
After a Ctrl-C during the cache write, or two coverage runs at once (e.g. parallel CI jobs sharing HOME), `--offline` refuses a cache that holds a perfectly valid spec until someone runs online again.

### Reproduction
Stub writeFileSync so the second writeFileAtomically call throws, run parseSpecWithDependencies({}, deps-with-200), then run parseSpecWithDependencies({ offline: true }, deps). It rejects with 'hash mismatch' even though openai-spec.yaml holds the newly fetched, valid spec.

### Suggested fix
Store spec, sha256 and etag together in one file (e.g. a JSON envelope or a header line), or write the SHA file first and the spec last so a partial update always fails toward a refetch. A per-cacheDir lock would cover concurrent runs.

### Adversarial verification (agent)
The code matches the claim. In fetchSpecLive (parse-spec.ts:168-175) the spec, sha256 and etag files are written by three separate writeFileAtomically calls. Each call does a temp write and then renameSync (:110-121), so each file is replaced atomically, but nothing makes the three together atomic. There is no lock, no versioned directory and no combined manifest. The offline path (:197-213) reads the spec and calls validateCachedSpecHash(yaml, sha256Path, false). If the sha file exists but belongs to another spec, :56 throws 'cached OpenAI specification hash mismatch', which comes back as 'Offline mode requires a valid cached spec...'. The ETag path (:143-158) catches the same mismatch and silently fetches the whole spec again.

How reachable it is:
(1) Process death between :168 and :169. Lines 168-175 run synchronously, so a JS-level handler can't run in between. But Node installs no default SIGINT handler, so the OS can kill the process at any instruction. The window is microseconds, so this is possible but rare.
(2) An error between the writes, such as ENOSPC or EACCES on the second mkdtemp or write. This leaves the new spec next to the old sha. It is plausible but uncommon.
(3) Two processes sharing ~/.cache/qvac, for example parallel CI jobs. Their writes can interleave across processes. Only interleavings that span an upstream spec change produce a mismatch, so this is rare too.

Nothing else guards against it, and no comment says the behaviour is intended.

The impact is overstated in one way. The failure is loud and fixes itself: the error message tells the user to run without --offline once, and the online path fetches again and repairs the cache. No wrong data is used, since the hash check does its job. There is also a related variant the reviewer didn't mention: if the etag is newer than a matching spec+sha pair (writes interleaved as A.spec, A.sha, B.etag), a later 304 would serve spec A as 'not modified' even though the etag belongs to B. That is a silent stale-but-hash-valid result. The defect survives the checks, but given how narrow the windows are and how easy recovery is, severity stays low.

<sub>fingerprint `qr1:0f8b4dce91d5fe48` · first seen at 0c8a1510ab4f</sub>

### Scratch folder is visible before its owner.pid is written, so a concurrent removeStaleScratch can delete a live bundle's scratch

**File:** `packages/sdk/src/commands/bundle/scratch.ts:27`  
**Category:** concurrency · **Severity:** low · **Confidence:** medium · **Status:** confirmed

### Evidence
scratchFolderFor (scratch.ts:26-28) creates `.<name>-<uuid>` with mkdir, and only afterwards writes owner.pid with writeFile, which truncates the file and then writes it. removeStaleScratch (scratch.ts:58-63) matches every `.<name>-<uuid>` entry. ownerRunning (scratch.ts:69-74) returns false when owner.pid is missing (readFile ENOENT) or empty (parseInt('') is NaN). In that case the folder is rm'd recursively, unless `<name>.previous` exists, which it never does for a fresh folder. Callers run removeStaleScratch on the same dir right before scratchFolderFor (index.ts:544-545 and 587, link.ts:117-118). Two `qvac bundle` runs on the same project (for example a watch or IDE task plus a manual run, or two CI steps sharing a workspace) can therefore interleave like this: A mkdir, then B readdir/readFile with no owner.pid, then B rm, then A writeFile. The same happens if B reads while A's writeFile has truncated the file but not yet written the pid.

### Impact
Run A's scratch folder is deleted while A is still running. A's writeFile of owner.pid fails with ENOENT, or bare-stow/bare-link write into a folder that was just removed. The bundle fails with a confusing ENOENT. If the rm overlaps A's stow (rm -r racing with recreated subdirectories), A can also replace the working output with a partially deleted tree.

### Reproduction
In one process, loop `scratchFolderFor(dir)` and in another loop `removeStaleScratch(dir)` against the same dir. After enough iterations the first process gets ENOENT from writeFile(owner.pid), or finds its returned scratch parent missing. To make it deterministic, stub fsp.writeFile to await a promise that resolves only after removeStaleScratch(dir) has run, then assert that `path.dirname(scratch)` still exists. It does not.

### Suggested fix
Make the folder appear to removeStaleScratch only once it is owned. Create it under a name the pattern does not match (e.g. `.<name>-<uuid>.tmp`), write owner.pid there, then rename it to `.<name>-<uuid>`. Alternatively, have removeStaleScratch skip folders whose owner.pid is missing or unparsable and that are younger than a grace period (check the folder's mtime).

### Adversarial verification (agent)
The window the reviewer describes is real in the code. scratchFolderFor (scratch.ts:26-28) runs mkdir on `.<name>-<uuid>` first and writes owner.pid afterwards with a separate, non-atomic writeFile. removeStaleScratch (scratch.ts:58-63) matches every `.<name>-<uuid>` entry and calls ownerRunning. ownerRunning (67-74) returns false when readFile throws (ENOENT) or when parseInt gives NaN (an empty file). The `.previous` guard does not protect a fresh folder, so `rm -r` deletes it. Nothing else guards this. There is no lock anywhere in commands/bundle; I grepped for "lock" and found none. Callers run removeStaleScratch on the same dir just before scratchFolderFor (index.ts:544-545, 587; link.ts:117-118). The worker-scan scratch at index.ts:567 also runs after another run may be sweeping scanOutputDir. The ownerRunning/EPERM logic and the doc comment ("A folder whose process is still running belongs to a bundle in progress ... stay") show the authors meant to protect concurrent live bundles, so this is a hole in that intended guarantee, not something they accepted on purpose. The impact is overstated, though: (1) The window is tiny, a single mkdir→writeFile gap of microseconds to milliseconds. The other run's readdir→readFile has to land exactly inside it. (2) Two concurrent `qvac bundle` runs on the same project already clobber each other regardless. Both write entryPath (index.ts:598) and both replaceAll the same outputDir. So the scenario is not well supported to begin with. (3) The likely result is a loud ENOENT failure in run A, not silent corruption. A partial-tree output would need the rm to race the stow and then the rename to succeed, which is unlikely. Fix: write owner.pid atomically before the folder becomes visible. One way is to mkdir a temp name without the uuid pattern, write the pid, then rename it. Another is to treat a missing or empty owner.pid as live when the folder's mtime is recent.

<sub>fingerprint `qr1:3781234b1ff509be` · first seen at 0c8a1510ab4f</sub>

### Ctrl+C sends SIGINT to the runner twice, and the second one kills it during graceful shutdown

**File:** `packages/test-suite/src/cli/commands/run-consumer-external.ts:43`  
**Category:** concurrency · **Severity:** low · **Confidence:** medium · **Status:** confirmed

### Evidence
The child is spawned without `detached` and with stdio 'inherit' (lines 33-36), so it is in the parent's foreground process group and gets the terminal's SIGINT directly. Line 43 then forwards another SIGINT. The runner registers `process.once('SIGINT', ...)` (run-consumer-external-inplace.ts:134), and in mqtt mode utils/external-consumer.ts:103 does the same. After the first delivery the once-listener is removed and Node restores the default SIGINT behaviour, so the forwarded signal ends the runner immediately. That cuts off the async `consumer.forceShutdown()` and `executor.stop()` (lines 119-133), and in mqtt mode it kills the runner before it can mirror its client's exit. Because the child then exits by signal (code null), finding 1 also applies and the parent exits 0.

### Impact
Pressing Ctrl+C in an interactive run can skip the consumer's MQTT shutdown and the stop of the external bridge client. The spawned interpreter or worker can be left orphaned, and the parent still exits 0.

### Reproduction
Run the command interactively in bridge mode and press Ctrl+C once. The '⚠️ Force shutdown' / graceful path does not finish, and `ps` can still show the external client process. Delivery order of the two signals depends on timing, so this may not happen every run.

### Suggested fix
Do not forward SIGINT when the child shares the terminal's process group, for example by only forwarding SIGTERM. Or spawn the child with `detached: true` so it receives only the forwarded signal. Making the runner's handlers `process.on` (idempotent) would also prevent the default kill.

### Adversarial verification (agent)
I could not disprove the mechanism. In run-consumer-external.ts:33-36 the runner is spawned with no `detached` and with stdio 'inherit', so it stays in the terminal's foreground process group. Ctrl+C therefore sends SIGINT straight to the runner, and line 43 (`process.on('SIGINT', () => child.kill('SIGINT'))`) then sends it a second one.

The runner listens only with `process.once('SIGINT', ...)` (run-consumer-external-inplace.ts:134; in mqtt mode also external-consumer.ts:103). The first SIGINT removes that listener. When the last SIGINT listener goes, Node closes its signal watcher and SIGINT goes back to the default action. The forwarded signal arrives after the parent's event loop has handled its own SIGINT, which is usually milliseconds later and not close enough to merge with the first. So it most likely kills the runner while `await consumer.forceShutdown()` / `await executor.stop()` (lines 119-133) are still running.

The child then exits by signal with code null, and the parent runs `process.exit(code || 0)` (line 47), so it exits 0. Nothing guards against this: there is no `detached`, no check that the signal was already received, and no persistent handler. The same pattern is copied in run-consumer-desktop.ts:47 and the desktop runner's `once`, which suggests copy-paste rather than a deliberate choice.

The impact is somewhat overstated. Grandchildren with inherited stdio (the bridge interpreter and the mqtt-mode client) are in the same process group, so they get the terminal's SIGINT directly, and orphaning is less likely than the claim says. What is really lost is the consumer's MQTT forceShutdown/cleanup, plus a misleading exit code 0. This only affects interactive Ctrl+C in a dev/test CLI, so the severity stays low. One detail depends on runtime timing (whether the two signals merge), but in practice they usually don't.

<sub>fingerprint `qr1:70f4f2e80c0fd6ac` · first seen at 0c8a1510ab4f</sub>

### Server 'error' listener left as a stale promise reject, so runtime server errors are swallowed

**File:** `packages/registry-server/lib/metrics-server.js:50`  
**Category:** error-handling · **Severity:** low · **Confidence:** medium · **Status:** confirmed

### Evidence
The `error` handler only exists to reject the listen promise, but it is never removed after `listen` succeeds. Any later 'error' event on the http.Server (for example EMFILE/ENFILE while accepting connections) calls `reject` on a promise that has already resolved. That call does nothing: nothing is logged and the error is not re-thrown. Because a listener is attached, Node also does not treat it as an unhandled 'error' event.

### Impact
After startup, server-level failures of the metrics endpoint disappear without a trace. Prometheus scrapes start failing and operators get no log line explaining why.

### Reproduction
After `await ms.ready()`, run `ms._server.emit('error', new Error('boom'))`. Nothing is logged and nothing throws.

### Suggested fix
In the listen callback, swap the handler: `this._server.off('error', reject); this._server.on('error', (err) => this._logger.error({ err }, 'MetricsServer: server error'))`. Alternatively, use `once('error', ...)` and remove it on success.

### Adversarial verification (agent)
metrics-server.js:39-51 attaches `this._server.on('error', reject)` inside the listen promise and never removes it or replaces it with a logging handler. Nothing else attaches one: grep finds no other `_server.on(` in the package, and bin.js:137-142 just constructs the server and awaits `ready()`. Once listen resolves, any later server-level 'error' goes to an already-settled promise's `reject`, which does nothing. The path is reachable: in Node, net.Server's onconnection emits 'error' on the server when accept fails (for example EMFILE/ENFILE under fd exhaustion), and this is a long-running daemon. Only per-request collection errors are logged (line 28). No test or comment shows the behaviour is intentional. The impact is somewhat overstated, though. The leftover listener also stops Node from crashing the whole registry process on an unhandled 'error', which is arguably better than the alternative. The lost data is only a log line for a secondary metrics endpoint, and the accept errors are usually transient. The defect is real (diagnostics are silently lost) and the severity stays low. Fix: after listen succeeds, swap `reject` for a handler that logs the error, e.g. `this._server.off('error', reject); this._server.on('error', err => this._logger.error({ err }, 'MetricsServer: server error'))`.

<sub>fingerprint `qr1:ae849d5d916d422d` · first seen at 0c8a1510ab4f</sub>

### runFfmpeg has no cancellation path: aborted requests/jobs leave ffmpeg running until exit or the 5-minute timeout

**File:** `packages/cli/src/serve/lib/ffmpeg.ts:38`  
**Category:** resource-leak · **Severity:** low · **Confidence:** medium · **Status:** confirmed

### Evidence
FfmpegRunOptions (ffmpeg.ts:3-10) only has ffmpegPath/timeoutMs/maxStderrBytes, and there is no AbortSignal. The only kill path is the timeout handler (ffmpeg.ts:61-68). Callers have cancellation signals they cannot pass on: music.ts:491 has job.controller.signal and still calls transcodeWav at music.ts:583 without one. videos.ts:235/257 checks job.controller.signal, but transcodeAviToMp4 at videos.ts:379 cannot be cancelled. The HTTP routes (audio.ts:534, videos.ts:379) never observe client disconnect for the transcode, even though require-model.ts:134 shows the server already builds disconnect signals for model loads.

### Impact
If a client disconnects, a job is cancelled or a client retries GET /v1/videos/{id}/content, ffmpeg keeps running at full CPU for up to 5 minutes (DEFAULT_TIMEOUT_MS) per request. Its whole output is buffered in memory and then thrown away. Repeated retries pile up concurrent ffmpeg processes on the local machine.

### Reproduction
Generate a long video, request /v1/videos/{id}/content?format=mp4, then abort the HTTP request right away. `ps` shows ffmpeg still running until the transcode finishes or 5 minutes pass. Repeat the request N times and N ffmpeg processes run concurrently.

### Suggested fix
Add `signal?: AbortSignal` to FfmpegRunOptions. In runFfmpeg, if signal.aborted, reject at once. Otherwise add an 'abort' listener that calls child.kill('SIGKILL') and settles with an abort error, and remove the listener in settle(). Thread the request disconnect signal or job.controller.signal through transcodeWav/transcodeAviToMp4.

### Adversarial verification (agent)
The core claim holds, but the impact is overstated.

What holds:
- `runFfmpeg` (ffmpeg.ts:38-113) accepts no AbortSignal. Its only kill path is the `timeoutMs` SIGKILL (61-68, default 5 minutes).
- Neither HTTP caller listens for client disconnect. These are videos.ts:379, which calls `transcodeAviToMp4(aviRecord.data)`, and audio.ts:534 plus music.ts:583, which call `transcodeWav`. The server does have a disconnect helper, `disconnectSignal` in require-model.ts:134, but it is not used here.
- A client that disconnects mid-transcode leaves ffmpeg running until it finishes, and the output buffer is then thrown away.
- videos.ts:370-379 has no in-flight dedup. Only a completed MP4 is cached (`mp4FileId`, set at line 414). So concurrent or retried GETs on `/v1/videos/{id}/content` while a transcode is running each spawn their own ffmpeg.

What is overstated or wrong:
1. The "cancelled job" path does not exist. Both music.ts:583 and videos.ts:379 run only in the content-GET handler, after `job.status === 'completed'` (music.ts:557, videos.ts:~327). The job's generation work is already finished by then, so `job.controller.signal` has nothing to cancel during a transcode.
2. Each ffmpeg normally exits once it finishes the input. The inputs are bounded buffers already in memory: a model-generated WAV or a short AVI. A typical transcode takes seconds, so "up to 5 minutes at full CPU" is the worst case, not the usual one.
3. After one transcode succeeds, the MP4 is cached and later retries skip ffmpeg. For audio, each request re-encodes, but the cost is small.
4. This is the local `qvac serve` model server. Piling up processes needs a client that keeps re-requesting while a transcode is still running.

The cleanup gap is real but the impact is modest. I rate it low, not medium.

<sub>fingerprint `qr1:b428984430b95821` · first seen at 0c8a1510ab4f</sub>

### Stale .pid files are never removed, so killTracked can SIGTERM unrelated processes that reused those PIDs

**File:** `packages/test-suite/src/cli/utils/process-manager.ts:106`  
**Category:** correctness · **Severity:** low · **Confidence:** medium · **Status:** confirmed

### Evidence
spawnTracked writes `<name>.pid` (process-manager.ts:68), and nothing deletes it when the child exits: the 'close' handler at :80 only ends the log stream. killTracked (:90-115) signals every `*.pid` it finds in the directory and never checks that the PID still belongs to a child of this run. createReportDir (:187) reuses `opts.reportDir` exactly as given, and setupCleanup (run-local.ts:225) calls killTracked whenever the producer exits, on SIGINT or on SIGTERM. Even within one run, cleanup fires from the producer's 'exit' event, after Node has already reaped that PID, so the PID is signalled after it has been released.

### Impact
Rerun with the same `--reportDir` (for example a fixed CI path) and the earlier run's producer.pid and consumer-*.pid files are still there. When the new run cleans up, it sends SIGTERM to whatever processes now hold those PIDs, which can kill unrelated user processes. On Windows the call is `taskkill /F /T`, which also force-kills their child processes.

### Reproduction
Run `run:local:desktop --reportDir=/tmp/r` and let it finish. Start a long-running process and give it the PID recorded in /tmp/r/consumer-desktop.pid (or wait for PID wraparound). Run `run:local:desktop --reportDir=/tmp/r` again and press Ctrl+C. The unrelated process receives SIGTERM.

### Suggested fix
Delete the pid file in the child's 'exit' handler inside spawnTracked, and have killTracked signal only the PIDs of processes tracked in this run (or use child.kill() on the tracked ChildProcess objects), not every *.pid in the directory.

### Adversarial verification (agent)
The mechanism holds up. spawnTracked writes `<name>.pid` (process-manager.ts:68), and the 'close' handler (:80-82) only ends the log stream. No code anywhere in src/cli deletes a .pid file. killTracked (:90-115) reads every `*.pid` in reportDir and sends SIGTERM (or `taskkill /F /T` on Windows) without checking that the PID is still one of its own children. setupCleanup (run-local.ts:214-254) calls it on SIGINT, on SIGTERM, on producer exit and on a failed consumer exit. Users can reach this: `--report-dir` is a public option on every run:local:* command (index.ts:260), and createReportDir (:187-193) reuses that directory with nothing to clear it. A fixed `--runId` also gives the same default dir.

The claimed impact is overstated, though. On a rerun, spawnTracked overwrites producer.pid and consumer-<same name>.pid before cleanup can happen, so those files are not stale. The stale files that actually survive are:
(a) consumer-<other>.pid from an earlier run with a different consumer, for example a desktop run followed by a python run in the same dir;
(b) broker.pid, which local-broker.ts:178 writes with the old CLI's own process.pid when the earlier run started the embedded broker and the new run did not.

Within a single run, a consumer may exit cleanly with code 0, which run-local.ts:247 ignores, and its reaped PID is signalled later when the producer finishes. The producer-exit window the reviewer cites is microseconds, so PID reuse there is negligible.

Exploiting this needs an opt-in reused directory or an early-exiting consumer, plus PID reuse by another process of the same user. Low likelihood, but a real wrong-process kill, and on Windows `/F /T` also kills that process's children.

A side note: broker.pid holds the CLI's own PID, so killTracked SIGTERMs itself. The cleaningUp guard keeps that harmless.

Re-rated low: not the default path, and it needs PID reuse.

<sub>fingerprint `qr1:43fbf3ec560df1ee` · first seen at 0c8a1510ab4f</sub>

### spawnTracked has no 'error' listener, so a failed spawn crashes the CLI and skips cleanup

**File:** `packages/test-suite/src/cli/utils/process-manager.ts:67`  
**Category:** error-handling · **Severity:** low · **Confidence:** medium · **Status:** confirmed

### Evidence
If spawn cannot start the process (ENOENT, EACCES, EMFILE or EAGAIN), Node sets `child.pid` to undefined and emits 'error' asynchronously. spawnTracked registers no 'error' handler (:61-82), so the event becomes an uncaught exception. Before that happens, :67-68 write the string "undefined" into the .pid file and the function returns a TrackedProcess whose `pid` is undefined, which goes against its `pid: number` type. Callers in run-local.ts (e.g. :268, :279) wrap the call in try/catch, but the error is emitted after the call returns, so the catch never sees it and setupCleanup's brokerHandle.cleanup() never runs.

### Impact
Under fd or process exhaustion, or when `node` is not on the PATH of the env passed in, the CLI dies with an unhandled 'error' event stack trace. A local broker it started, and any sibling process it already spawned (for example the producer when the consumer spawn fails), keep running.

### Reproduction
Call spawnTracked('does-not-exist', [], {reportDir: tmp, name: 'x'}). The .pid file contains "undefined", and the process crashes on the next tick with `Error: spawn does-not-exist ENOENT` (unhandled 'error' event).

### Suggested fix
Add `child.on('error', err => { logStream.end(); /* log the error and surface it to the caller */ })`, and write the pid file only when `child.pid !== undefined` (throw synchronously otherwise, so callers' try/catch and cleanup run).

### Adversarial verification (agent)
I read the code and the mechanism holds. In process-manager.ts:61-82, spawnTracked calls spawn() and attaches only stdout/stderr 'data' listeners and a 'close' listener. It never adds an 'error' listener. When Node hits ENOENT, EACCES, EAGAIN, EMFILE or ENFILE at spawn time, it does not throw synchronously. It leaves child.pid undefined and emits 'error' on nextTick, and it emits no 'exit' event. Line 67 uses a non-null assertion (`child.pid!`), so line 68 writes "undefined" to the .pid file, and the returned TrackedProcess has pid undefined even though the type says number. killTracked parses that value to NaN and skips it, so that part does no harm.

Caller check: in run-local.ts:260-294 (and the other run:local:* variants) the try/catch around spawnTracked only catches synchronous throws. setupCleanup (:214-254) registers SIGINT/SIGTERM and 'exit' listeners only. There is no process.on('uncaughtException') anywhere in packages/test-suite/src (I grepped). So the asynchronous 'error' crashes the CLI with an unhandled-error stack trace. setupCleanup's cleanup(), which runs killTracked and brokerHandle.cleanup(), never runs. A producer that was already spawned, or a local broker started by ensureBroker, can be left running. I found no tests or comments that make this intentional.

Impact is overstated in one respect: the trigger is unlikely. The command is 'node', which the user is already running the CLI with. cwd is configDir, which loadConfig has just read successfully. The env is inherited unless a caller overrides it. That leaves fd or process exhaustion (EMFILE/EAGAIN) or an unusual PATH or runtime (for example the CLI running under bun without a node binary on PATH). It is a real but rare robustness gap in a dev/test CLI that leaves orphaned processes, so I rate it low rather than medium.

<sub>fingerprint `qr1:98344fa2e9646d11` · first seen at 0c8a1510ab4f</sub>

### cleanupResources skips store close and temp-dir removal if swarm.destroy() rejects, and masks the original error

**File:** `packages/registry-server/client/lib/profiler.js:185`  
**Category:** error-handling · **Severity:** low · **Confidence:** medium · **Status:** uncertain

### Evidence
cleanupResources runs `await swarm.destroy(); await store.close();` and only then the guarded rmSync (lines 185-189). Any rejection from swarm.destroy() or store.close() aborts the remaining steps. Because the function is awaited inside `finally` (line 296), that rejection replaces whatever error the try block threw, for example a stream-timeout from pipeline.

### Impact
The downloaded model copy (download.bin, possibly multi-GB) stays in os.tmpdir(). The caller sees a teardown error instead of the real download failure it was profiling.

### Reproduction
Make swarm.destroy() reject (for example monkeypatch it) while pipeline throws a timeout. profileDownload rejects with the destroy error, the timeout is lost, and the qvac-profile-* directory with download.bin remains.

### Suggested fix
Run each teardown step in its own try/catch (or use Promise.allSettled), always run the rmSync, and do not let cleanup errors override an in-flight error from the try block.

### Adversarial verification (agent)
The code matches the claim. In profiler.js lines 184-190, cleanupResources runs `await swarm.destroy()` and then `await store.close()` with no guard. Only `fs.rmSync(tmpdir)` sits inside try/catch. The function is awaited in the outer `finally` at line 296. If either teardown call rejects, the temp-dir removal never runs, and under JS semantics that rejection replaces any error thrown in the try block (for example a pipeline timeout at line 266). The path is reachable through the public `profileDownload` export, which bin/cli.js and examples/profile-download.js both call.

I could not show the trigger happens in practice. Hyperswarm and Corestore are not installed in this checkout, so I could not check whether `swarm.destroy()` or `store.close()` actually reject. Both are teardown methods built to be idempotent, and they rarely reject. Without a rejection the defect never shows. That is runtime behaviour I can't see, so the verdict is uncertain rather than confirmed.

The impact is also smaller than claimed. This is a diagnostic profiler, not a production download path. The leftover file sits in os.tmpdir() under a uniquely named qvac-profile-* folder, and the OS eventually clears it.

Separately, the code has a related gap the reviewer didn't mention. If `store.ready()` or `HypercoreStats.fromCorestore()` throws (lines 170-173), that happens before the try block, so the tmpdir leaks anyway. Low severity at most.

<sub>fingerprint `qr1:fa0cb9276164ac4c` · first seen at 0c8a1510ab4f</sub>
