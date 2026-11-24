// Repro: ReseedTracker.waitForComplete() never settles for a second concurrent
// caller, nor for any caller when destroy() runs. registry-service.js awaits it
// in every addModel (line ~866) and calls destroy() from reseed() and _close().
// Run: QVAC=<qvac checkout> node verification/registry-reseed-hang.repro.cjs
const assert = require('node:assert/strict')
const ReseedTracker = require(`${process.env.QVAC}/packages/registry-server/lib/reseed-tracker.js`)
const quiet = { info() {}, error() {} }

// A core of 10 blocks whose single blind peer has replicated `remote` blocks.
function fakeCore(id) {
  const peer = { remoteContiguousLength: 0 }
  return { core: { discoveryKey: Buffer.from(id), length: 10, replicator: { peers: [peer] } }, peer }
}
const state = (p) => Promise.race([p.then(() => 'resolved', (e) => 'rejected: ' + e.message), new Promise((r) => setTimeout(() => r('pending'), 400))])

async function main() {
  // 1) Two overlapping ingests
  const t = new ReseedTracker(['blind-peer-key'], quiet)
  const a = fakeCore('core-a')
  t.trackCore(a.core)
  const first = t.waitForComplete({ pollInterval: 50 })
  const second = t.waitForComplete({ pollInterval: 50 })
  a.peer.remoteContiguousLength = 10 // replication finishes
  const [s1, s2] = await Promise.all([state(first), state(second)])
  console.log('overlapping callers:', { first: s1, second: s2 })
  assert.equal(s1, 'resolved')
  assert.equal(s2, 'pending', 'second caller never polled again')

  // 2) destroy() while a caller waits (reseed() / close during an ingest)
  const t2 = new ReseedTracker(['blind-peer-key'], quiet)
  t2.trackCore(fakeCore('core-b').core)
  const waiting = t2.waitForComplete({ pollInterval: 50, progressTimeout: 200 })
  t2.destroy()
  const s3 = await state(waiting)
  console.log('caller during destroy():', s3, '(even past progressTimeout)')
  assert.equal(s3, 'pending')
  console.log('REPRODUCED')
  process.exit(0)
}
main()
