import type { Collector } from '../types.js'
import type { Config } from '../config.js'
import { complexityCollector } from './complexity.js'
import { gitChurnCollector } from './git-churn.js'

/**
 * Add collectors here. Ideas for the day: lint (ESLint API), duplication (jscpd),
 * coverage (c8 json-summary), dependencies (npm audit --json, knip), secrets.
 */
export function defaultCollectors(cfg: Config): Collector[] {
  return [complexityCollector(cfg), gitChurnCollector()]
}
