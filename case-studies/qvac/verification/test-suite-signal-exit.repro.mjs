// Repro: test-suite CLI commands map a signal-killed runner to exit code 0.
// The handler below is copied verbatim from
//   packages/test-suite/src/cli/commands/run-consumer-external.ts:46-48
//   (identical in run-consumer-desktop.ts:51 and run-consumer-electron.ts:205)
// Run: node verification/test-suite-signal-exit.repro.mjs ; echo "parent exit: $?"
import { spawn } from 'node:child_process'

if (process.argv[2] === 'child') {
  setInterval(() => {}, 1000) // a runner that is busy, e.g. loading a model
} else {
  const child = spawn(process.execPath, [new URL(import.meta.url).pathname, 'child'], { stdio: 'inherit' })
  child.on('exit', (code, signal) => {
    console.error(`runner exited: code=${code} signal=${signal}`)
    process.exit(code || 0) // <- QVAC's handler
  })
  setTimeout(() => child.kill('SIGKILL'), 300) // OOM killer / CI timeout / native crash
}
