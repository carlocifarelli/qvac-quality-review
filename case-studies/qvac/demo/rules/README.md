# Rules gate demos

Both runs use `state/rules-baseline.json` (the triage of the 22 hits on `tetherto/qvac@0c8a1510ab4f`).

- `fixed/`: `qr rules` on the simulated next commit (`37148738`, local only), which fixes the `process.exit(code || 0)` in `run-consumer-external.ts`. 21 hits, all triaged, exit 0. The fixed instance is simply absent.
- `regression/`: `qr rules --changed HEAD~1` on a further local commit that adds a `spawnQuiet()` helper repeating the #31 pattern. Only the changed file is linted (95 ms); the new hit is not in the baseline, so the command prints it and exits 1. This is what a PR check would run.

Neither commit was pushed anywhere; both exist only in the local checkout used for the demo.
