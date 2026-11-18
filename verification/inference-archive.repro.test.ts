// Reproductions for two archive.ts findings. Copied into packages/inference/test/
// by verification/run-inference-repros.sh and run with brittle-bare, the
// package's own runner. Never committed upstream.
import test from 'brittle'
import fs from 'bare-fs'
import os from 'bare-os'
import path from 'bare-path'
import tarStream from 'tar-stream'
import Buffer from 'bare-buffer'
import { extractAndValidateShardedArchive, extractTarStream } from '@/utils/archive'

function tempDir(t: { teardown: (fn: () => void) => void }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qr-repro-'))
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true }))
  return dir
}

async function writeTar(archivePath: string, entries: Record<string, string>) {
  const pack = tarStream.pack()
  const chunks: Buffer[] = []
  const done = new Promise<void>((resolve, reject) => {
    pack.on('data', (c) => chunks.push(c as Buffer))
    pack.on('end', () => resolve())
    pack.on('error', reject)
  })
  for (const [name, content] of Object.entries(entries)) pack.entry({ name }, content)
  pack.finalize()
  await done
  fs.writeFileSync(archivePath, Buffer.concat(chunks))
}

test('REPRO nested-folder shards: extracted to disk but validation fails', async (t) => {
  const dir = tempDir(t)
  const archive = path.join(dir, 'model.tar')
  const extractDir = path.join(dir, 'out')
  // What `tar cf model.tar model/` produces
  await writeTar(archive, {
    'model/model-00001-of-00002.gguf': 'a',
    'model/model-00002-of-00002.gguf': 'b'
  })
  let error: unknown = null
  try {
    await extractAndValidateShardedArchive(archive, extractDir)
  } catch (e) {
    error = e
  }
  t.ok(error, `load rejected: ${(error as Error)?.message}`)
  t.alike(fs.readdirSync(path.join(extractDir, 'model')).sort(), [
    'model-00001-of-00002.gguf',
    'model-00002-of-00002.gguf'
  ], 'both shards are on disk under out/model/')
})

test('REPRO mkdirSync throw in entry listener escapes the promise', async (t) => {
  const dir = tempDir(t)
  const archive = path.join(dir, 'bad.tar')
  const extractDir = path.join(dir, 'out')
  fs.mkdirSync(extractDir)
  await writeTar(archive, { 'a.gguf': 'x', 'a.gguf/b.gguf': 'y' })

  let uncaught: unknown = null
  const onUncaught = (err: unknown) => { uncaught = err }
  // Without these handlers the error kills the Bare process ("Uncaught (in promise) FileError: EEXIST").
  Bare.prependListener('uncaughtException', onUncaught)
  Bare.prependListener('unhandledRejection', onUncaught)
  t.teardown(() => {
    Bare.off('uncaughtException', onUncaught)
    Bare.off('unhandledRejection', onUncaught)
  })

  const outcome = await Promise.race([
    extractTarStream(archive, extractDir, false).then(() => 'resolved', (e: Error) => `rejected: ${e.message}`),
    new Promise((r) => setTimeout(() => r('still pending after 3s'), 3000))
  ])
  t.comment(`promise outcome: ${outcome}`)
  t.comment(`uncaught exception: ${(uncaught as Error)?.message ?? 'none'}`)
  t.is(outcome, 'still pending after 3s', 'the extraction promise never settles')
  t.ok(uncaught, 'the mkdirSync error surfaced as an uncaught exception')
})
