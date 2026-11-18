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

## run-inference-repros.sh (Bare + brittle)
```
TAP version 13

# REPRO nested-folder shards: extracted to disk but validation fails
    ok 1 - load rejected: Failed to load model: No sharded model files found in archive. Expected pattern: *-00001-of-0000X.*
    ok 2 - both shards are on disk under out/model/
ok 1 - REPRO nested-folder shards: extracted to disk but validation fails # time = 12ms

# REPRO mkdirSync throw in entry listener escapes the promise
    # promise outcome: still pending after 3s
    # uncaught exception: EEXIST: file already exists, mkdir "<tmp>/out/a.gguf"
    ok 1 - the extraction promise never settles
    ok 2 - the mkdirSync error surfaced as an uncaught exception
ok 2 - REPRO mkdirSync throw in entry listener escapes the promise # time = 3006ms

1..2
# tests = 2/2 pass
# asserts = 4/4 pass
# time = 3118ms

# ok
```
