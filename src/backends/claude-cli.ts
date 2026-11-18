import { spawn } from 'node:child_process'
import { z } from 'zod'
import type { Usage } from '../types.js'

/**
 * Runs Claude Code headless (`claude -p`) as a read-only agent inside the
 * target checkout. Why the CLI and not the raw API: the agent can open the
 * callers, types and tests a finding depends on, which a single-file prompt
 * cannot. Writes, shell and web access are disallowed, so the target is never
 * modified and code is not sent anywhere except the model provider.
 */
export interface AgentCall<T> {
  cwd: string
  model: string
  prompt: string
  schema: z.ZodType<T>
  timeoutMs?: number
}

const READ_ONLY = ['Read', 'Grep', 'Glob']
const DENIED = ['Bash', 'Edit', 'Write', 'NotebookEdit', 'WebFetch', 'WebSearch', 'Agent', 'Task']

export async function runAgent<T>(call: AgentCall<T>, usage: Usage): Promise<T> {
  const { $schema: _drop, ...schemaBody } = z.toJSONSchema(call.schema) as Record<string, unknown>
  const jsonSchema = JSON.stringify(schemaBody)
  const args = [
    '-p', call.prompt,
    '--model', call.model,
    '--output-format', 'json',
    '--json-schema', jsonSchema,
    '--allowedTools', ...READ_ONLY,
    '--disallowedTools', ...DENIED,
    '--no-session-persistence',
  ]
  const started = Date.now()
  const stdout = await new Promise<string>((resolve, reject) => {
    const child = spawn(process.env.QR_CLAUDE_BIN ?? 'claude', args, { cwd: call.cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (err += d))
    const timer = setTimeout(() => child.kill('SIGTERM'), call.timeoutMs ?? 15 * 60_000)
    child.on('error', reject)
    child.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) resolve(out)
      else reject(new Error(`claude exited ${code}: ${err.slice(-500) || out.slice(-500)}`))
    })
  })
  usage.calls++
  usage.seconds += (Date.now() - started) / 1000
  const res = JSON.parse(stdout) as { is_error?: boolean; result?: string; structured_output?: unknown; total_cost_usd?: number }
  usage.costUsd += res.total_cost_usd ?? 0
  if (res.is_error) throw new Error(`agent error: ${res.result}`)
  const payload = res.structured_output ?? extractJson(res.result ?? '')
  return call.schema.parse(payload)
}

function extractJson(text: string): unknown {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/)
  if (!m) throw new Error('agent returned no JSON')
  return JSON.parse(m[1]!)
}
