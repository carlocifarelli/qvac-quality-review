import { z } from 'zod'

export const Severity = z.enum(['info', 'minor', 'major', 'critical'])
export type Severity = z.infer<typeof Severity>

export const Dimension = z.enum(['maintainability', 'reliability', 'security', 'testing'])
export type Dimension = z.infer<typeof Dimension>

/** One measured problem. Every collector speaks this shape, so scoring and reports stay generic. */
export const Finding = z.object({
  collector: z.string(),
  rule: z.string(),
  dimension: Dimension,
  severity: Severity,
  file: z.string(),
  line: z.number().int().optional(),
  message: z.string(),
})
export type Finding = z.infer<typeof Finding>

export interface Target {
  /** Absolute path of the code under analysis */
  root: string
  /** Files to analyse, relative to root (already filtered) */
  files: string[]
}

export interface Collector {
  name: string
  /** Return findings plus optional raw metrics for the report */
  run(target: Target): Promise<{ findings: Finding[]; metrics?: Record<string, number> }>
}

export interface DimensionScore {
  dimension: Dimension
  score: number
  findings: number
}

export interface Report {
  target: string
  generatedAt: string
  overall: number
  dimensions: DimensionScore[]
  metrics: Record<string, number>
  findings: Finding[]
  review?: import('./llm/review.js').Review
  reviewError?: string
}
