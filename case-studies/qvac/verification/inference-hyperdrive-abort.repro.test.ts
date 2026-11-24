// Repro: an abort that lands while downloadAndValidateFile is still looking up
// the file (drive.entry / getBlobs) is never observed. The abort listener is
// added later, on an already-aborted signal, so it never fires; with the swarm
// suspended by the abort, the read stream never ends and the promise never
// settles. Uses a stub drive: the real one needs peers.
import test from 'brittle'
import fs from 'bare-fs'
import os from 'bare-os'
import path from 'bare-path'
import { Readable } from 'bare-stream'
import { AbortController } from 'bare-abort-controller'
import { downloadAndValidateFile } from '@/handlers/load-model/hyperdrive'

function stubDrive() {
  const blob = { blockOffset: 0, blockLength: 1, byteOffset: 0, byteLength: 4 }
  return {
    core: { length: 1 },
    // Metadata arrives from peers after 200 ms.
    entry: () => new Promise((resolve) => setTimeout(() => resolve({ value: { blob } }), 200)),
    getBlobs: async () => ({ core: { has: async () => false, on() {}, off() {} } }),
    download() {},
    // Swarm suspended by the abort: no blocks ever arrive.
    createReadStream: () => new Readable({ read() {} })
  }
}

async function runWithAbortAt(t: { teardown: (fn: () => void) => void }, abortAtMs: number) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qr-hd-'))
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true }))
  const ac = new AbortController()
  setTimeout(() => ac.abort(), abortAtMs)
  return Promise.race([
    downloadAndValidateFile(stubDrive() as never, 'm.gguf', path.join(dir, 'm.gguf'), 4, '', undefined, ac.signal as never)
      .then(() => 'resolved', (e: Error) => `rejected: ${e.name}`),
    new Promise((r) => setTimeout(() => r('pending'), abortAtMs + 2000))
  ])
}

test('CONTROL hyperdrive: abort after the lookup rejects with DownloadCancelledError', async (t) => {
  const outcome = await runWithAbortAt(t, 300)
  t.comment(`abort at 300 ms (after lookup): ${outcome}`)
  t.is(outcome, 'rejected: DOWNLOAD_CANCELLED') // DownloadCancelledError's name is its code
})

test('REPRO hyperdrive: abort during the lookup is lost and the download never settles', async (t) => {
  const outcome = await runWithAbortAt(t, 50)
  t.comment(`abort at 50 ms (during lookup): ${outcome} 2 s later`)
  t.is(outcome, 'pending', 'expected a DownloadCancelledError rejection like the control')
})
