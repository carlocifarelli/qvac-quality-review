# `qr pr` on a simulated pull request

Target: the local checkout of `tetherto/qvac` with two local commits on top of `0c8a1510` (never pushed anywhere):

1. `37148738` fixes the `process.exit(code || 0)` in `run-consumer-external.ts` (one of the three sites of #8);
2. `7fca5044` adds a `spawnQuiet()` helper to `process-manager.ts` that repeats the #31 pattern.

Command: `qr pr <checkout> --base 0c8a1510`, with a copy of `state/` (so the demo did not touch the real state).

Result (`PR.md` is the comment a PR would get, `pr.json` the full result, `stderr.txt` the summary line):

- **Blocking:** the rule `spawn-without-error-listener` flags the new helper (not in the baseline), so the command exits 1.
- **Advisory:** the agent reviewed both changed files and the verifier confirmed one lead, the same helper. 4 agent calls, $0.88, 63 s wall time.
- **Probably fixed:** #8, because its anchor line disappeared from the changed file. The two sibling sites of #8 are in files this change did not touch, so the issue stays open until they are fixed too.
- **Context:** the three known open findings in the touched files (#28, #30, #31).

Caveat: the regression commit has a comment saying it repeats #31, and the verifier quoted it. The rule does not read comments, so the blocking result does not depend on it.
