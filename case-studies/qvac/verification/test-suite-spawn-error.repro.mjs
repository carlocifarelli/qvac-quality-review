// Repro for qr2:621f2d08e39c5ab8: spawnTracked has no 'error' listener.
// Mirrors process-manager.ts:61-82 and the caller pattern in run-local.ts
// (try/catch around the call, cleanup registered afterwards).
// Usage: node verification/test-suite-spawn-error.repro.mjs
import { spawn } from 'node:child_process'
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dir = mkdtempSync(join(tmpdir(), 'spawn-'))
function spawnTracked(name, command, args) {
  const pidPath = join(dir, `${name}.pid`)
  const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
  const pid = child.pid
  writeFileSync(pidPath, String(pid))
  child.on('close', () => {})
  return { pid, child }
}

process.on('uncaughtException', (err) => {
  console.log(`uncaughtException: ${err.code} (the caller's catch never ran, cleanup skipped)`)
  console.log(`pid file contents: ${JSON.stringify(readFileSync(join(dir, 'broker.pid'), 'utf8'))}`)
  console.log('REPRODUCED')
  process.exit(0)
})
try {
  const h = spawnTracked('broker', 'definitely-not-installed-binary', [])
  console.log(`spawnTracked returned pid=${h.pid}`)
} catch (err) {
  console.log('caller catch:', err.message)
}
