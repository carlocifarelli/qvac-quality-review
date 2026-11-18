import { readFile } from 'node:fs/promises'
import { z } from 'zod'

export const Config = z.object({
  /** Globs (relative to the target repo) of files in scope */
  include: z.array(z.string()).default(['**/*.{ts,tsx,js,mjs,cjs}']),
  exclude: z
    .array(z.string())
    .default(['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.d.ts', '**/test/**', '**/tests/**', '**/__tests__/**', '**/*.test.*', '**/*.spec.*', '**/examples/**', '**/e2e/**', '**/benchmarks/**', '**/fixtures/**', '**/generated/**']),
  churnSince: z.string().default('6 months ago'),
  /** How many files the AI reviewer reads per run */
  reviewTop: z.number().int().default(25),
  /** Files smaller than this are skipped (barrels, constants) */
  minLoc: z.number().int().default(40),
  /** Files larger than this are still reviewed but flagged as partial */
  maxLoc: z.number().int().default(1500),
  backend: z.enum(['claude-cli', 'none']).default('claude-cli'),
  reviewModel: z.string().default('claude-opus-5-5'),
  verifyModel: z.string().default('claude-opus-5-5'),
  concurrency: z.number().int().default(4),
  /** Weights of the deterministic risk signals (pattern name -> weight) */
  signalWeights: z.record(z.string(), z.number()).default({}),
  /** GitHub repo searched for duplicates, and repo where findings are filed */
  upstreamRepo: z.string().default('tetherto/qvac'),
  findingsRepo: z.string().optional(),
})
export type Config = z.infer<typeof Config>

export async function loadConfig(path?: string): Promise<Config> {
  if (!path) return Config.parse({})
  return Config.parse(JSON.parse(await readFile(path, 'utf8')))
}
