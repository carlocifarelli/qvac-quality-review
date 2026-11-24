# Reproduction outputs

Recorded on 2026-11-18 against tetherto/qvac@0c8a1510ab4f (Node v22.23.5, Bare v1.37.1 via brittle-bare).

## F-device-defaults.ts
```
keys kept after parse: [ 'llm' ]
defaults resolved for audiogen-ggml: undefined
defaults resolved for ggml-classification: undefined
defaults resolved for bci-whispercpp-transcription: undefined
device with [specific, general]: cpu
REPRODUCED
```

## registry-reseed-hang.repro.cjs
```
overlapping callers: { first: 'resolved', second: 'pending' }
caller during destroy(): pending (even past progressTimeout)
REPRODUCED
```

## test-suite-signal-exit.repro.mjs
```
runner exited: code=null signal=SIGKILL
parent exit: 0
```

## test-suite-double-sigint.repro.mjs
```
runner: ready
parent: child exit code=null signal=SIGINT
wrapper exit code=0
REPRODUCED: graceful shutdown cut off and the run reports success
```

## test-suite-spawn-error.repro.mjs
```
spawnTracked returned pid=undefined
uncaughtException: ENOENT (the caller's catch never ran, cleanup skipped)
pid file contents: "undefined"
REPRODUCED
```

## get-model-by-name-prototype.repro.ts
```
NOT_A_MODEL     -> undefined
constructor     -> function Object
toString        -> function toString
__proto__       -> object
hasOwnProperty  -> function hasOwnProperty
REPRODUCED
```

## run-inference-repros.sh (Bare + brittle: archive and hyperdrive-abort tests)
```
TAP version 13

# REPRO nested-folder shards: extracted to disk but validation fails
    ok 1 - load rejected: Failed to load model: No sharded model files found in archive. Expected pattern: *-00001-of-0000X.*
    ok 2 - both shards are on disk under out/model/
ok 1 - REPRO nested-folder shards: extracted to disk but validation fails # time = 37ms

# REPRO mkdirSync throw in entry listener escapes the promise
    # promise outcome: still pending after 3s
    # uncaught exception: EEXIST: file already exists, mkdir "<tmp>/out/a.gguf"
    ok 1 - the extraction promise never settles
    ok 2 - the mkdirSync error surfaced as an uncaught exception
ok 2 - REPRO mkdirSync throw in entry listener escapes the promise # time = 3007ms

# CONTROL hyperdrive: abort after the lookup rejects with DownloadCancelledError
    # abort at 300 ms (after lookup): rejected: DOWNLOAD_CANCELLED
    ok 1 - should be equal
ok 3 - CONTROL hyperdrive: abort after the lookup rejects with DownloadCancelledError # time = 302ms

# REPRO hyperdrive: abort during the lookup is lost and the download never settles
    # abort at 50 ms (during lookup): pending 2 s later
    ok 1 - expected a DownloadCancelledError rejection like the control
ok 4 - REPRO hyperdrive: abort during the lookup is lost and the download never settles # time = 2051ms

1..4
# tests = 4/4 pass
# asserts = 6/6 pass
# time = 5907ms

# ok
```
