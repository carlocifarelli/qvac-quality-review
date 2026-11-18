import { describe, expect, it } from 'vitest'
import { countSignals, priority } from '../src/stages/signals.js'

describe('signals', () => {
  it('counts risk-surface patterns', () => {
    const s = countSignals("import { spawn } from 'child_process'\nconst x = JSON.parse(buf)\nspawn('ls')\nnew Promise((r) => setTimeout(r, 1))")
    expect(s['child-process']).toBeGreaterThanOrEqual(2)
    expect(s['untrusted-parse']).toBe(1)
    expect(s['promise-ctor']).toBe(1)
    expect(s.timers).toBe(1)
  })
  it('prefers risky, changing code over large inert code', () => {
    const risky = priority(100, 8, { 'child-process': 3, network: 2 }, 0)
    const inert = priority(2000, 0, { listeners: 2 }, 0)
    expect(risky).toBeGreaterThan(inert)
  })
  it('caps a single repeated pattern', () => {
    expect(priority(100, 0, { timers: 500 }, 0)).toBe(priority(100, 0, { timers: 20 }, 0))
  })
})
