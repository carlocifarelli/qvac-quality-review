### qvac-quality: 2 changed file(s) checked against `0c8a1510`

**Blocking: 1 rule hit(s) not in the baseline**
- `spawn-without-error-listener` [packages/test-suite/src/cli/utils/process-manager.ts:265](https://github.com/tetherto/qvac/blob/7fca50446e1c930a8bb4d5c155436ca3983b07a1/packages/test-suite/src/cli/utils/process-manager.ts#L265): The child from `spawn(…)` has no 'error' listener: a failed start (ENOENT, EACCES) becomes an uncaught exception.

Fix it, or if it is intended, add the id to `state/rules-baseline.json` with a reason (reviewed like any code change).

**Agent review (advisory, not blocking): 1 lead(s) in the changed files**
- [low] [packages/test-suite/src/cli/utils/process-manager.ts:265](https://github.com/tetherto/qvac/blob/7fca50446e1c930a8bb4d5c155436ca3983b07a1/packages/test-suite/src/cli/utils/process-manager.ts#L265): New spawnQuiet helper spawns without an 'error' listener, so a missing binary crashes the process _(verifier: confirmed)_

A maintainer confirms or rejects each lead; confirmed ones are tracked as issues, and if the defect has a syntactic shape it becomes a rule.

**Probably fixed by this change: 1**
- [#8](https://github.com/carlocifarelli/qvac-quality-review/issues/8) Runner killed by a signal (OOM, SIGKILL, crash) is reported as exit code 0

<details><summary>Known open findings in these files (3)</summary>

- [#30](https://github.com/carlocifarelli/qvac-quality-review/issues/30) [packages/test-suite/src/cli/utils/process-manager.ts:106](https://github.com/tetherto/qvac/blob/7fca50446e1c930a8bb4d5c155436ca3983b07a1/packages/test-suite/src/cli/utils/process-manager.ts#L106): Stale .pid files are never removed, so killTracked can SIGTERM unrelated processes that reused those PIDs
- [#31](https://github.com/carlocifarelli/qvac-quality-review/issues/31) [packages/test-suite/src/cli/utils/process-manager.ts:67](https://github.com/tetherto/qvac/blob/7fca50446e1c930a8bb4d5c155436ca3983b07a1/packages/test-suite/src/cli/utils/process-manager.ts#L67): spawnTracked has no 'error' listener, so a failed spawn crashes the CLI and skips cleanup
- [#28](https://github.com/carlocifarelli/qvac-quality-review/issues/28) [packages/test-suite/src/cli/commands/run-consumer-external.ts:43](https://github.com/tetherto/qvac/blob/7fca50446e1c930a8bb4d5c155436ca3983b07a1/packages/test-suite/src/cli/commands/run-consumer-external.ts#L43): Ctrl+C sends SIGINT to the runner twice, and the second one kills it during graceful shutdown

</details>

<sub>4 agent call(s), 0 cached, $0.88</sub>
