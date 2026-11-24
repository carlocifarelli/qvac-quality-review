# async-hygiene rules on nrwl/nx@741bf7670c40

2391 files, 7 hits: 0 new, 7 in the accepted baseline.

## New (not in the baseline)
| Rule | Location | Code | Id |
|---|---|---|---|

## Triaged baseline
| Rule | Location | Status | Reason | Id |
|---|---|---|---|---|
| spawn-without-error-listener | [packages/create-nx-workspace/src/utils/child-process-utils.ts:22](https://github.com/nrwl/nx/blob/741bf7670c40d41da1f0b460a8bb81bce836ec74/packages/create-nx-workspace/src/utils/child-process-utils.ts#L22) | accepted | shell: true: the shell itself always exists, so only a missing cwd could make the start fail. Low value; accepted. | rh:ad82fd6e0e02c25a |
| abort-signal-race | [packages/gradle/src/utils/exec-gradle.ts:70](https://github.com/nrwl/nx/blob/741bf7670c40d41da1f0b460a8bb81bce836ec74/packages/gradle/src/utils/exec-gradle.ts#L70) | finding | Lead, not reproduced or reported: a signal that is already aborted never fires 'abort', so execGradleAsync starts and waits for the whole Gradle build. Depends on callers passing a pre-aborted signal, not checked. | rh:eb7666a2298ac181 |
| spawn-without-error-listener | [packages/nx/src/command-line/release/utils/launch-editor.ts:15](https://github.com/nrwl/nx/blob/741bf7670c40d41da1f0b460a8bb81bce836ec74/packages/nx/src/command-line/release/utils/launch-editor.ts#L15) | finding | Lead, not reproduced or reported: an EDITOR/VISUAL that is not on PATH makes spawn emit 'error' with no listener, so 'nx release' crashes with an uncaught ENOENT instead of rejecting with the 'Editor process exited' error the caller handles. | rh:50e7f289d0432ce8 |
| spawn-without-error-listener | [packages/nx/src/command-line/watch/watch.ts:132](https://github.com/nrwl/nx/blob/741bf7670c40d41da1f0b460a8bb81bce836ec74/packages/nx/src/command-line/watch/watch.ts#L132) | accepted | shell: true with cwd = process.cwd(): a start failure is not realistic. | rh:1292a746e929a80b |
| throw-in-promise-listener | [packages/nx/src/nx-cloud/update-manager.ts:677](https://github.com/nrwl/nx/blob/741bf7670c40d41da1f0b460a8bb81bce836ec74/packages/nx/src/nx-cloud/update-manager.ts#L677) | finding | Lead, not reproduced or reported: same class as QVAC #6. mkdirSync inside the tar 'entry' listener can throw (EACCES, ENOSPC, a file where a directory is expected); the throw escapes the Promise executor, so the download neither rejects nor cleans its temp folder. | rh:40624f91044a405a |
| spawn-without-error-listener | [packages/nx/src/tasks-runner/cache.ts:525](https://github.com/nrwl/nx/blob/741bf7670c40d41da1f0b460a8bb81bce836ec74/packages/nx/src/tasks-runner/cache.ts#L525) | finding | Lead, not reproduced or reported: spawn('node', …) with shell: false fails with ENOENT when 'node' is not on PATH (Nx started via an absolute Node path); the 'error' event is emitted after the try/catch returned, so it is an uncaught exception in about 1 of 50 runs. process.execPath would avoid it. | rh:c8a7820f40d9c93e |
| abort-signal-race | [packages/nx/src/tasks-runner/readiness/probes.ts:140](https://github.com/nrwl/nx/blob/741bf7670c40d41da1f0b460a8bb81bce836ec74/packages/nx/src/tasks-runner/readiness/probes.ts#L140) | finding | Lead, not reproduced or reported: the sibling probe checks context.signal.aborted after adding its listener (line 66) but waitForLogMatch does not, so a task that already exited waits for the readiness timeout instead of settling as 'exited'. | rh:42b1591144278c18 |
