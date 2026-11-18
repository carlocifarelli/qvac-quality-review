import { z } from 'zod'

/** A file chosen for AI review, with the deterministic signals that put it there. */
export interface ReviewUnit {
  file: string
  loc: number
  /** Commits touching the file inside the churn window */
  churn: number
  /** Risk-surface pattern hits, e.g. { 'child-process': 2, 'json-parse': 1 } */
  signals: Record<string, number>
  /** Correctness lint hits (ESLint rule id -> line numbers) */
  lint: Record<string, number[]>
  /** Priority used to pick the top-N files for review */
  priority: number
  /** sha256 of the file content: the review cache key */
  contentHash: string
}

export const Category = z.enum([
  'correctness',
  'security',
  'resource-leak',
  'concurrency',
  'error-handling',
  'api-contract',
  'performance',
  'maintainability',
])
export const Severity = z.enum(['low', 'medium', 'high', 'critical'])
export const Confidence = z.enum(['low', 'medium', 'high'])

/** What the review agent returns for one file. Kept small so it validates reliably. */
export const CandidateOut = z.object({
  title: z.string().describe('One line, specific: what goes wrong'),
  category: Category,
  severity: Severity,
  confidence: Confidence,
  line: z.number().int().describe('Primary line in the reviewed file'),
  anchor: z.string().describe('The exact source text of the primary line, trimmed, copied verbatim'),
  evidence: z.string().describe('Code-level reasoning: the path that triggers it, with file:line references'),
  impact: z.string().describe('What a user or operator would observe'),
  reproduction: z.string().describe('How to demonstrate it: a test, a script or an input'),
  fix: z.string().describe('Smallest credible fix'),
})
export type CandidateOut = z.infer<typeof CandidateOut>
export const ReviewOut = z.object({ findings: z.array(CandidateOut).max(5) })

export const VerdictOut = z.object({
  verdict: z.enum(['confirmed', 'rejected', 'uncertain']),
  reasoning: z.string().describe('Why, citing code you read'),
  severity: Severity.describe('Severity after verification'),
  duplicateSearchTerms: z.array(z.string()).max(4).describe('Short phrases to search existing GitHub issues/PRs'),
})
export type VerdictOut = z.infer<typeof VerdictOut>

export type Status = 'candidate' | 'confirmed' | 'rejected' | 'uncertain'

/** A person's decision on a finding (state/overrides.json). Always wins over the agents. */
export interface HumanDecision {
  status: Status
  note: string
  verifiedBy?: string
  /** Optional severity re-rating */
  severity?: z.infer<typeof Severity>
}

/** Severity after every review: human, then verifier, then reviewer. */
export const severityOf = (f: Pick<Finding, 'human' | 'verdict' | 'severity'>) => f.human?.severity ?? f.verdict?.severity ?? f.severity

/** A finding as stored in the state file; identity is the fingerprint, not the line. */
export interface Finding extends CandidateOut {
  fingerprint: string
  file: string
  status: Status
  verdict?: VerdictOut
  /** Human decision overrides the agent: set in state/overrides.json */
  human?: HumanDecision
  firstSeenCommit: string
  lastSeenCommit: string
  /** present | moved (anchor found on another line) | gone (anchor no longer in file) */
  presence: 'present' | 'moved' | 'gone'
  issue?: string
  duplicates?: { query: string; searchedAt: string; total: number; top: { title: string; url: string; state: string }[] }[]
  /** Commits touching the file in the churn window when last reviewed */
  churn?: number
  score: number
}

export interface Usage { calls: number; cached: number; costUsd: number; seconds: number }
