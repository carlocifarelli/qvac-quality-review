import { readFile } from 'node:fs/promises'
import { z } from 'zod'

export const Config = z.object({
  /** What the target is, in the reviewer's words. Rendered into the prompts. */
  project: z
    .object({
      /** Short name, e.g. "QVAC" or "execa" */
      name: z.string().default('target'),
      /** One phrase completing "You are reviewing one file of ...": what it is, language, runtime */
      description: z.string().default('a JS/TS repository'),
    })
    .default({ name: 'target', description: 'a JS/TS repository' }),
  /** Globs (relative to the target repo) of files in scope */
  include: z.array(z.string()).default(['**/*.{ts,tsx,js,mjs,cjs}']),
  exclude: z
    .array(z.string())
    .default(['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.d.ts', '**/test/**', '**/tests/**', '**/__tests__/**', '**/*.test.*', '**/*.spec.*', '**/examples/**', '**/e2e/**', '**/benchmarks/**', '**/fixtures/**', '**/generated/**']),
  churnSince: z.string().default('6 months ago'),
  /** How many files the AI reviewer reads per run */
  reviewTop: z.number().int().default(25),
  /** PR mode: at most this many changed files get the agent review (highest risk first); rules always cover all */
  prMaxFiles: z.number().int().default(10),
  /** Files smaller than this are skipped (barrels, constants) */
  minLoc: z.number().int().default(40),
  /** Files larger than this are still reviewed but flagged as partial */
  maxLoc: z.number().int().default(1500),
  /** claude-cli: Claude Code headless. openai-compatible: any local or hosted OpenAI-style server (llama.cpp, Ollama, vLLM, `qvac serve --openai`). none: deterministic stages only */
  backend: z.enum(['claude-cli', 'openai-compatible', 'none']).default('claude-cli'),
  /** openai-compatible backend: base URL and how many tool calls the model may make before answering */
  openaiBaseUrl: z.string().default('http://127.0.0.1:11435/v1'),
  openaiMaxToolCalls: z.number().int().default(6),
  reviewModel: z.string().default('claude-opus-5-5'),
  verifyModel: z.string().default('claude-opus-5-5'),
  concurrency: z.number().int().default(4),
  /** Weights of the deterministic risk signals (pattern name -> weight) */
  signalWeights: z.record(z.string(), z.number()).default({}),
  /** GitHub repo of the target (owner/name): report links, duplicate search. Optional. */
  upstreamRepo: z.string().optional(),
  /** GitHub repo where `publish` files confirmed findings as issues. Never the upstream repo. */
  findingsRepo: z.string().optional(),
})
export type Config = z.infer<typeof Config>

/** `optional`: a missing file means "all defaults" (the default path); an explicit path must exist. */
export async function loadConfig(path?: string, opts: { optional?: boolean } = {}): Promise<Config> {
  if (!path) return Config.parse({})
  try {
    return Config.parse(JSON.parse(await readFile(path, 'utf8')))
  } catch (e) {
    if (opts.optional && (e as NodeJS.ErrnoException).code === 'ENOENT') return Config.parse({})
    throw e
  }
}
