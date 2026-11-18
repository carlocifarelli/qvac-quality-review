import { mkdtemp, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { fingerprint, refreshPresence, score, type State } from '../src/state.js'
import type { Finding } from '../src/types.js'

const base = (over: Partial<Finding> = {}): Finding => ({
  title: 't', category: 'correctness', severity: 'high', confidence: 'high', line: 2,
  anchor: 'return a + b', evidence: '', impact: '', reproduction: '', fix: '',
  fingerprint: 'fp', file: 'src/x.ts', status: 'candidate', firstSeenCommit: 'c1', lastSeenCommit: 'c1',
  presence: 'present', score: 0, ...over,
})

describe('fingerprint', () => {
  it('ignores whitespace and line number', () => {
    expect(fingerprint('a.ts', 'security', '  foo(  x )')).toBe(fingerprint('a.ts', 'security', 'foo( x )'))
  })
  it('differs by file and category', () => {
    expect(fingerprint('a.ts', 'security', 'x')).not.toBe(fingerprint('b.ts', 'security', 'x'))
    expect(fingerprint('a.ts', 'security', 'x')).not.toBe(fingerprint('a.ts', 'correctness', 'x'))
  })
})

describe('refreshPresence', () => {
  async function repo(content: string) {
    const root = await mkdtemp(join(tmpdir(), 'qr-'))
    await mkdir(join(root, 'src'))
    await writeFile(join(root, 'src/x.ts'), content)
    return root
  }
  it('keeps a finding present when the anchor is on its line', async () => {
    const root = await repo('function f(a, b) {\n  return a + b\n}\n')
    const s: State = { schemaVersion: 1, findings: { fp: base() }, runs: [] }
    await refreshPresence(root, s, 'c2')
    expect(s.findings.fp).toMatchObject({ presence: 'present', line: 2, lastSeenCommit: 'c2' })
  })
  it('follows the anchor when code above moves', async () => {
    const root = await repo('// new header\n\nfunction f(a, b) {\n    return a + b\n}\n')
    const s: State = { schemaVersion: 1, findings: { fp: base() }, runs: [] }
    await refreshPresence(root, s, 'c2')
    expect(s.findings.fp).toMatchObject({ presence: 'moved', line: 4 })
  })
  it('marks gone when the anchor disappears or the file is deleted', async () => {
    const root = await repo('function f(a, b) {\n  return safeAdd(a, b)\n}\n')
    const s: State = { schemaVersion: 1, findings: { fp: base(), fp2: base({ file: 'src/missing.ts' }) }, runs: [] }
    await refreshPresence(root, s, 'c2')
    expect(s.findings.fp!.presence).toBe('gone')
    expect(s.findings.fp2!.presence).toBe('gone')
    expect(s.findings.fp!.lastSeenCommit).toBe('c1')
  })
})

describe('score', () => {
  it('ranks confirmed above uncertain and zeroes rejected', () => {
    const conf = score(base({ verdict: { verdict: 'confirmed', reasoning: '', severity: 'high', duplicateSearchTerms: [] } }), 0)
    const unc = score(base({ verdict: { verdict: 'uncertain', reasoning: '', severity: 'high', duplicateSearchTerms: [] } }), 0)
    const rej = score(base({ verdict: { verdict: 'rejected', reasoning: '', severity: 'high', duplicateSearchTerms: [] } }), 0)
    expect(conf).toBeGreaterThan(unc)
    expect(rej).toBe(0)
  })
  it('lets a human override the agent verdict', () => {
    const f = base({ verdict: { verdict: 'confirmed', reasoning: '', severity: 'high', duplicateSearchTerms: [] }, human: { status: 'rejected', note: 'intended' } })
    expect(score(f, 0)).toBe(0)
  })
  it('uses the verified severity, not the reviewer one', () => {
    const lowered = score(base({ verdict: { verdict: 'confirmed', reasoning: '', severity: 'low', duplicateSearchTerms: [] } }), 0)
    const kept = score(base({ verdict: { verdict: 'confirmed', reasoning: '', severity: 'high', duplicateSearchTerms: [] } }), 0)
    expect(lowered).toBeLessThan(kept)
  })
})
