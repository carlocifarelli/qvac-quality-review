// One-off migration from qr1 (file + category + anchor) to qr2 (file + anchor)
// fingerprints. Rewrites state/findings.json and state/overrides.json; when two
// qr1 findings collapse into one qr2 identity, the one a human decided on (or
// the higher-scored one) is kept and the other is reported.
// Usage: npx tsx scripts/migrate-fingerprints-v2.ts [stateDir]
import { resolve } from 'node:path'
import { Store, fingerprint } from '../src/state.js'
import type { Finding } from '../src/types.js'
import { writeJson } from '../src/util.js'

const store = new Store(resolve(process.argv[2] ?? 'state'))
const state = await store.load()
const overrides = await store.overrides()
const next: Record<string, Finding> = {}
const nextOverrides: typeof overrides = {}
const oldToNew = new Map<string, string>()
// Computed before any fingerprint is rewritten: a human decision outranks score.
const rankOf = new Map(Object.values(state.findings).map((f) => [f, (overrides[f.fingerprint] ? 1000 : 0) + f.score]))
const rank = (f: Finding) => rankOf.get(f) ?? 0

for (const f of Object.values(state.findings)) {
  const old = f.fingerprint
  const fp = old.startsWith('qr1:') ? fingerprint(f.file, f.anchor) : old
  oldToNew.set(old, fp)
  const existing = next[fp]
  if (existing) {
    const keep = rank(f) > rank(existing) ? f : existing
    const drop = keep === f ? existing : f
    console.log(`merged ${drop.fingerprint} into ${fp}: "${drop.title}"`)
    if (keep !== f) continue
  }
  if (overrides[old]) nextOverrides[fp] = overrides[old]
  f.fingerprint = fp
  next[fp] = f
}
// Human notes cross-reference other findings by id: rewrite those too.
for (const o of Object.values(nextOverrides)) {
  o.note = o.note.replace(/qr1:[0-9a-f]{16}/g, (id) => oldToNew.get(id) ?? id)
}
state.findings = next
await store.save(state)
await writeJson(store.path('overrides.json'), nextOverrides)
console.log(`findings: ${Object.keys(next).length}, overrides: ${Object.keys(nextOverrides).length}, ids mapped: ${oldToNew.size}`)
