// Repro for qr2:59e0a7ed358e79c6: Ctrl+C reaches the runner twice.
// Mirrors run-consumer-external.ts:33-48 (spawn without `detached`, stdio
// 'inherit', forward SIGINT, exit with `code || 0`) and the runner's
// `process.once('SIGINT', gracefulShutdown)` from run-consumer-external-inplace.ts:134.
// A terminal Ctrl+C signals the whole foreground process group; we simulate it
// with `kill -INT -<pgid>` on a detached wrapper that owns its own group.
// Usage: node verification/test-suite-double-sigint.repro.mjs
import { spawn, execSync } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dir = mkdtempSync(join(tmpdir(), 'sigint-'))
const runner = join(dir, 'runner.mjs')
const parent = join(dir, 'parent.mjs')
writeFileSync(runner, `
process.once('SIGINT', async () => {
  console.log('runner: graceful shutdown started')
  await new Promise((r) => setTimeout(r, 500)) // consumer.forceShutdown(), executor.stop()
  console.log('runner: graceful shutdown finished')
  process.exit(130)
})
console.log('runner: ready')
setInterval(() => {}, 1000)
`)
writeFileSync(parent, `
import { spawn } from 'node:child_process'
const child = spawn(process.execPath, [${JSON.stringify(runner)}], { stdio: 'inherit' })
process.on('SIGINT', () => child.kill('SIGINT'))
child.on('exit', (code, signal) => {
  console.log('parent: child exit code=' + code + ' signal=' + signal)
  process.exit(code || 0)
})
`)

const p = spawn(process.execPath, [parent], { detached: true, stdio: ['ignore', 'inherit', 'inherit'] })
await new Promise((r) => setTimeout(r, 700))
execSync(`kill -INT -${p.pid}`) // what the terminal does on Ctrl+C
p.on('exit', (code) => {
  console.log(`wrapper exit code=${code}`)
  console.log(code === 0 ? 'REPRODUCED: graceful shutdown cut off and the run reports success' : 'not reproduced')
})
