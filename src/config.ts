import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'

export const Config = z.object({
  include: z.array(z.string()).default(['.ts', '.tsx', '.js', '.mjs', '.cjs']),
  ignoreDirs: z.array(z.string()).default(['node_modules', 'dist', 'build', 'coverage', '.git']),
  /** How much each dimension weighs in the overall score (normalised at runtime) */
  weights: z
    .object({
      maintainability: z.number().default(0.4),
      reliability: z.number().default(0.3),
      security: z.number().default(0.2),
      testing: z.number().default(0.1),
    })
    .prefault({}),
  /** Points lost per finding, by severity */
  penalties: z
    .object({
      info: z.number().default(0),
      minor: z.number().default(1),
      major: z.number().default(4),
      critical: z.number().default(10),
    })
    .prefault({}),
  thresholds: z
    .object({
      functionComplexity: z.number().default(10),
      functionLength: z.number().default(60),
    })
    .prefault({}),
  failUnder: z.number().default(70),
})
export type Config = z.infer<typeof Config>

/** Reads qc.config.json from the target root if present; every field has a default. */
export async function loadConfig(root: string): Promise<Config> {
  try {
    const raw = await readFile(join(root, 'qc.config.json'), 'utf8')
    return Config.parse(JSON.parse(raw))
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return Config.parse({})
    throw err
  }
}
