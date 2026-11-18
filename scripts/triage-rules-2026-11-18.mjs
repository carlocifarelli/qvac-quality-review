// One-off: record the human triage of the first qvac-quality run (2026-11-18,
// tetherto/qvac@0c8a1510ab4f) as state/rules-baseline.json. Each hit gets a
// status: finding (tracked as an issue), accepted (the pattern is there but
// fixing it is not worth it), false-positive (rule limitation, explained).
import { readFileSync, writeFileSync } from 'node:fs'
const hits = JSON.parse(readFileSync(process.argv[2], 'utf8')).hits
const T = {
  'packages/inference/src/handlers/load-model/hyperdrive.ts:481': ['finding', 'Issue #11 (reproduced).'],
  'packages/inference/src/handlers/load-model/hyperdrive.ts:325': ['finding', 'Issue #11, caller side: the signal goes to downloadAndValidateFile, which adds its listener without a check.'],
  'packages/inference/src/model-fit/run/run.ts:256': ['finding', 'Issue #16.'],
  'packages/inference/src/model-fit/run/run.ts:180': ['finding', 'Issue #16: bounded() is the callee that never checks signal.aborted.'],
  'packages/inference/src/handlers/load-model/hyperdrive.ts:85': ['finding', 'Issue #22.'],
  'packages/test-suite/src/cli/commands/run-consumer-desktop.ts:51': ['finding', 'Issue #8 (folded sibling).'],
  'packages/test-suite/src/cli/commands/run-consumer-electron.ts:205': ['finding', 'Issue #8 (folded sibling).'],
  'packages/test-suite/src/cli/commands/run-consumer-external.ts:47': ['finding', 'Issue #8 (reproduced).'],
  'packages/registry-server/lib/metrics-server.js:50': ['finding', 'Issue #29.'],
  'packages/test-suite/src/cli/utils/process-manager.ts:61': ['finding', 'Issue #31 (reproduced).'],
  'packages/inference/src/utils/archive.ts:170': ['finding', 'Issue #6 (reproduced).'],
  'packages/inference/src/model-fit/description/fetch.ts:181': ['finding', 'NEW, found by this rule: issue #32. withinBudget() never checks options.signal.aborted, so a load cancelled before the fit-stub step still runs the registry fetch for up to FIT_STUB_BUDGET_MS (40 s) and the caller (resolve-load.ts:150) waits for it.'],
  'packages/test-suite/src/cli/utils/process-manager.ts:219': ['accepted', 'Same class as #31 (idevicesyslog spawn, child returned in an object, no caller listens for error). Guarded by `which idevicesyslog` just before, so ENOENT is unlikely. Fix together with #31.'],
  'packages/test-suite/src/cli/utils/process-manager.ts:237': ['accepted', 'Same class as #31 (adb logcat spawn, no caller listens for error). An Android run without adb on PATH crashes here instead of reporting it. Fix together with #31.'],
  'packages/test-suite/src/cli/utils/local-broker.ts:172': ['accepted', 'Same class as #29 in the local MQTT broker used by tests: errors after startup are swallowed. Test tooling; fix together with #29.'],
  'packages/test-suite/src/cli/utils/local-broker.ts:173': ['accepted', 'Same as the line above, for the WebSocket server.'],
  'packages/inference/src/handlers/load-model/download-lock.ts:174': ['accepted', 'Pattern is real (delay() never checks an already-aborted signal) but the loop re-checks right after; the cost is at most one LOCK_POLL_MS (250 ms).'],
  'packages/inference/src/handlers/load-model/download-lock.ts:220': ['accepted', 'delay() itself; see the line above. Bounded by 250 ms.'],
  'packages/registry-server/client/lib/profiler.js:173': ['accepted', 'Store and swarm leak if setup throws before the try/finally. Same as the agent lead qr2:d82789a0a393efdf, rejected by the verifier: diagnostic CLI whose process exits right after.'],
  'packages/inference/src/plugins/builtin/llamacpp-completion/ops/kv-cache-session.ts:483': ['false-positive', 'The signal is stored in a handle (makeHandle), not used to wait; whether an abort during adoptPersistedCache is lost depends on code the rule cannot see. Not a demonstrated defect.'],
  'packages/tts-ggml/src/lib/pocketLifecycle.ts:131': ['false-positive', 'The only caller (tts-ggml/src/index.ts:426-431) checks signal.aborted synchronously before attachAbort(). The rule does not follow checks into callers.'],
}
const accepted = {}
const seen = new Set()
for (const h of hits) {
  const k = `${h.file}:${h.line}`
  const t = T[k]
  if (!t) throw new Error('untriaged hit ' + k)
  seen.add(k)
  accepted[h.id] = { rule: h.rule, file: h.file, code: h.code, status: t[0], reason: t[1], triagedAt: '2026-11-18' }
}
for (const k of Object.keys(T)) if (!seen.has(k)) throw new Error('stale triage entry ' + k)
writeFileSync(process.argv[3], JSON.stringify({ commit: '0c8a1510ab4fe89893de174b07eb4901a2f3e9fd', accepted }, null, 2) + '\n')
console.log(Object.keys(accepted).length, 'entries')
