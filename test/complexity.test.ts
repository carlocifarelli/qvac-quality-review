import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { analyze } from '../src/analyze.js'
import type { Reviewer } from '../src/llm/review.js'

const fixture = join(import.meta.dirname, 'fixtures/messy')

describe('analyze', () => {
  it('flags the complex function and leaves the simple one alone', async () => {
    const { report } = await analyze(fixture)
    const complex = report.findings.filter((f) => f.rule === 'cyclomatic-complexity')
    expect(complex).toHaveLength(1)
    expect(complex[0].message).toContain('classify')
    expect(report.metrics.functions).toBe(2)
    expect(report.overall).toBeLessThan(100)
  })

  it('keeps the report when the reviewer fails', async () => {
    const broken: Reviewer = { review: async () => Promise.reject(new Error('boom')) }
    const { report } = await analyze(fixture, { reviewer: broken })
    expect(report.review).toBeUndefined()
    expect(report.reviewError).toBe('boom')
  })

  it('attaches the review when the reviewer succeeds', async () => {
    const fake: Reviewer = {
      review: async ({ findings }) => ({
        summary: `${findings.length} findings`,
        topActions: [],
        designNotes: [],
      }),
    }
    const { report } = await analyze(fixture, { reviewer: fake })
    expect(report.review?.summary).toMatch(/findings/)
  })
})
