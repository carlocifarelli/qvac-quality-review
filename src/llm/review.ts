import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import type { Finding, Target } from '../types.js'

export const Review = z.object({
  summary: z.string().describe('Two or three sentences on the overall state of the code'),
  topActions: z
    .array(
      z.object({
        title: z.string(),
        file: z.string(),
        why: z.string().describe('Which measured findings support this, and the risk if ignored'),
        suggestion: z.string(),
        effort: z.enum(['small', 'medium', 'large']),
      }),
    )
    .describe('At most 5 actions, highest impact first'),
  designNotes: z.array(z.string()).describe('Issues the metrics cannot see, e.g. naming, coupling'),
})
export type Review = z.infer<typeof Review>

export interface Reviewer {
  review(input: { target: Target; findings: Finding[] }): Promise<Review>
}

const SYSTEM = `You review code quality for an engineering team.
You receive measured findings from deterministic tools and excerpts of the most affected files.
Ground every action in the findings or in code you can see; do not invent files, lines or numbers.
If the evidence is thin, say so in the summary instead of guessing.`

/** Picks the files with the most findings and sends them, truncated per file, with the findings. */
async function buildPrompt(target: Target, findings: Finding[], maxFiles = 5, maxChars = 6000) {
  const byFile = new Map<string, number>()
  for (const f of findings) byFile.set(f.file, (byFile.get(f.file) ?? 0) + 1)
  const worst = [...byFile].sort((a, b) => b[1] - a[1]).slice(0, maxFiles)
  const excerpts = await Promise.all(
    worst.map(async ([file]) => {
      const text = await readFile(join(target.root, file), 'utf8')
      const cut = text.length > maxChars ? `${text.slice(0, maxChars)}\n/* …truncated… */` : text
      return `<file path="${file}">\n${cut}\n</file>`
    }),
  )
  return `<findings>\n${JSON.stringify(findings, null, 1)}\n</findings>\n\n${excerpts.join('\n\n')}`
}

/** Claude reviewer with schema-validated output. Model overridable via QC_MODEL. */
export function claudeReviewer(model = process.env.QC_MODEL ?? 'claude-opus-5-5'): Reviewer {
  const client = new Anthropic()
  return {
    async review({ target, findings }) {
      const response = await client.messages.parse({
        model,
        max_tokens: 16000,
        system: SYSTEM,
        messages: [{ role: 'user', content: await buildPrompt(target, findings) }],
        output_config: { format: zodOutputFormat(Review) },
      })
      if (response.stop_reason === 'refusal') throw new Error('model declined the request')
      if (!response.parsed_output)
        throw new Error(`no parsable output (stop: ${response.stop_reason})`)
      return response.parsed_output
    },
  }
}
