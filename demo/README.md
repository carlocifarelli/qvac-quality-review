# Repeat-run evidence

Recorded on 2026-11-18, before the fingerprint v1 → v2 migration (ids here start with `qr1:`).

- `run2-same-commit/`: second run on `0c8a151` with the state from run 1. 0 agent calls, 40 cache hits, $0.
- `run3-simulated-next-commit/`: run on a local commit on top of `0c8a151` that fixes finding #8 in one file
  (`simulated-commit.txt`; never pushed anywhere). 2 agent calls (re-review and re-verify of the changed file),
  39 cache hits, $0.64. The fixed finding is listed under "No longer present". The re-review also re-reported the
  other known finding of that file under a different category: that duplicate led to fingerprint v2.
- `run4-simulated-next-commit-v2/`: the same simulated commit, after the v2 fix, starting from the submission state
  (`qr2:` ids). 1 agent call (the changed file is re-reviewed with its known findings in the prompt), 39 cache hits,
  $0.32, **0 new candidates**: no duplicate this time. The fixed finding is again "No longer present", and the
  other finding in that file keeps its identity. (The verify call was not needed because nothing new was found.)
