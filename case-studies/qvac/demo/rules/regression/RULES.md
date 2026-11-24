# qvac-quality rules on tetherto/qvac@7fca50446e1c

1 files, 4 hits: 1 new, 3 in the accepted baseline.

## New (not in the baseline)
| Rule | Location | Code | Id |
|---|---|---|---|
| spawn-without-error-listener | [packages/test-suite/src/cli/utils/process-manager.ts:265](https://github.com/tetherto/qvac/blob/7fca50446e1c930a8bb4d5c155436ca3983b07a1/packages/test-suite/src/cli/utils/process-manager.ts#L265) | `const child = spawn(command, args, { stdio: 'ignore' })` | qq:6b54e602f4e39e5e |

## Triaged baseline
| Rule | Location | Status | Reason | Id |
|---|---|---|---|---|
| spawn-without-error-listener | [packages/test-suite/src/cli/utils/process-manager.ts:61](https://github.com/tetherto/qvac/blob/7fca50446e1c930a8bb4d5c155436ca3983b07a1/packages/test-suite/src/cli/utils/process-manager.ts#L61) | finding | Issue #31 (reproduced). | qq:29c82f8d771a1996 |
| spawn-without-error-listener | [packages/test-suite/src/cli/utils/process-manager.ts:219](https://github.com/tetherto/qvac/blob/7fca50446e1c930a8bb4d5c155436ca3983b07a1/packages/test-suite/src/cli/utils/process-manager.ts#L219) | accepted | Same class as #31 (idevicesyslog spawn, child returned in an object, no caller listens for error). Guarded by 'which idevicesyslog' just before, so ENOENT is unlikely. Fix together with #31. | qq:2b205c9c05640d58 |
| spawn-without-error-listener | [packages/test-suite/src/cli/utils/process-manager.ts:237](https://github.com/tetherto/qvac/blob/7fca50446e1c930a8bb4d5c155436ca3983b07a1/packages/test-suite/src/cli/utils/process-manager.ts#L237) | accepted | Same class as #31 (adb logcat spawn, no caller listens for error). An Android run without adb on PATH crashes here instead of reporting it. Fix together with #31. | qq:b6feec0f56eeb04f |
