import type { Config } from './config.js'
import type { DimensionScore, Finding } from './types.js'
import { Dimension } from './types.js'

/**
 * Deliberately simple and explainable: each dimension starts at 100 and loses
 * points per finding by severity, normalised by codebase size so big repos are not punished
 * just for being big. Overall = weighted mean of the dimensions.
 */
export function score(findings: Finding[], fileCount: number, cfg: Config) {
  const sizeFactor = Math.max(1, Math.sqrt(fileCount / 10))
  const dimensions: DimensionScore[] = Dimension.options.map((dimension) => {
    const own = findings.filter((f) => f.dimension === dimension)
    const penalty = own.reduce((sum, f) => sum + cfg.penalties[f.severity], 0) / sizeFactor
    return { dimension, score: clamp(Math.round(100 - penalty)), findings: own.length }
  })
  const totalWeight = dimensions.reduce((s, d) => s + cfg.weights[d.dimension], 0)
  const overall = Math.round(
    dimensions.reduce((s, d) => s + d.score * cfg.weights[d.dimension], 0) / totalWeight,
  )
  return { overall, dimensions }
}

const clamp = (n: number) => Math.min(100, Math.max(0, n))
