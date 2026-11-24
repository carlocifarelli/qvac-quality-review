import { readFile } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'
import { z } from 'zod'
import type { Usage } from '../types.js'
import { git } from '../util.js'
import type { AgentCall } from './claude-cli.js'

/**
 * Backend for any OpenAI-compatible chat endpoint (llama.cpp, Ollama, vLLM,
 * `qvac serve --openai`): with a local server the model runs on this machine and no source code
 * leaves it.
 *
 * Two phases, because some servers (QVAC's among them) do not combine `tools`
 * with `response_format` in one request:
 *  1. exploration: the model may call read-only tools (read_file, grep) inside
 *     the target checkout, up to `maxToolCalls`;
 *  2. answer: one more request with no tools and a JSON-schema response_format,
 *     validated with the same zod schema as the Claude backend.
 * Local models are small, so the file under review is inlined in the first
 * message: the review still works when the model never calls a tool.
 */
export interface OpenAiOptions {
  baseUrl: string
  apiKey?: string
  maxToolCalls: number
  inlineFile?: string
}

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read lines of a file in the repository',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string' }, start: { type: 'integer' }, end: { type: 'integer' } },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'grep',
      description: 'Search the repository (fixed string), returns up to 40 matching lines as path:line:text',
      parameters: { type: 'object', properties: { text: { type: 'string' }, path: { type: 'string' } }, required: ['text'] },
    },
  },
]

interface Msg {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[]
  tool_call_id?: string
}

export async function runOpenAi<T>(call: AgentCall<T>, opts: OpenAiOptions, usage: Usage): Promise<T> {
  const started = Date.now()
  const { $schema: _drop, ...schema } = z.toJSONSchema(call.schema) as Record<string, unknown>
  const inline = opts.inlineFile ? await inlined(call.cwd, opts.inlineFile) : ''
  const messages: Msg[] = [
    { role: 'system', content: 'You review code in a repository. Use the tools to read code you need; do not guess. Then answer.' },
    { role: 'user', content: call.prompt + inline },
  ]

  for (let used = 0; used < opts.maxToolCalls; ) {
    const res = await chat(opts, { model: call.model, messages, tools: TOOLS, temperature: 0 }, call.timeoutMs)
    usage.calls++
    const msg = res.choices?.[0]?.message as Msg | undefined
    if (!msg?.tool_calls?.length) break
    messages.push({ role: 'assistant', content: msg.content ?? null, tool_calls: msg.tool_calls })
    for (const tc of msg.tool_calls) {
      used++
      messages.push({ role: 'tool', tool_call_id: tc.id, content: await runTool(call.cwd, tc.function.name, tc.function.arguments) })
    }
  }

  messages.push({ role: 'user', content: 'Now give your final answer as JSON matching the schema. Use an empty list if you found nothing solid.' })
  const res = await chat(
    opts,
    { model: call.model, messages, temperature: 0, response_format: { type: 'json_schema', json_schema: { name: 'answer', schema, strict: true } } },
    call.timeoutMs,
  )
  usage.calls++
  usage.seconds += (Date.now() - started) / 1000
  const text = res.choices?.[0]?.message?.content ?? ''
  return call.schema.parse(JSON.parse(stripFence(text)))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function chat(opts: OpenAiOptions, body: Record<string, unknown>, timeoutMs = 15 * 60_000): Promise<any> {
  const r = await fetch(`${opts.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(opts.apiKey ? { authorization: `Bearer ${opts.apiKey}` } : {}) },
    // Cap generation: an unbounded reasoning loop blocks the single-slot local server and outlives fetch's 5-min header timeout.
    body: JSON.stringify({ max_tokens: 4096, ...body }),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!r.ok) throw new Error(`chat/completions ${r.status}: ${(await r.text()).slice(0, 300)}`)
  return r.json()
}

/** Paths are confined to the checkout: no absolute paths, no `..` escapes. */
export function confine(root: string, p: string): string {
  const abs = resolve(root, p)
  if (abs !== root && !abs.startsWith(root + sep)) throw new Error(`path outside the repository: ${p}`)
  return abs
}

async function runTool(root: string, name: string, rawArgs: string): Promise<string> {
  try {
    const args = JSON.parse(rawArgs || '{}') as { path?: string; start?: number; end?: number; text?: string }
    if (name === 'read_file') {
      const lines = (await readFile(confine(root, args.path ?? ''), 'utf8')).split('\n')
      const start = Math.max(1, args.start ?? 1)
      const end = Math.min(lines.length, args.end ?? start + 199, start + 399)
      return lines.slice(start - 1, end).map((l, i) => `${start + i}: ${l}`).join('\n')
    }
    if (name === 'grep') {
      const dir = relative(root, confine(root, args.path ?? '.')) || '.'
      const out = await git(root, ['grep', '-n', '-F', '-I', '--', args.text ?? '', dir]).catch(() => '')
      return out.split('\n').slice(0, 40).join('\n') || 'no matches'
    }
    return `unknown tool ${name}`
  } catch (e) {
    return `error: ${(e as Error).message}`
  }
}

async function inlined(root: string, file: string): Promise<string> {
  const lines = (await readFile(confine(root, file), 'utf8')).split('\n').slice(0, 1500)
  return `\n\nContents of ${file} (line-numbered):\n` + lines.map((l, i) => `${i + 1}: ${l}`).join('\n')
}

function stripFence(t: string): string {
  const m = t.match(/```(?:json)?\s*([\s\S]*?)```/)
  return (m ? m[1]! : t).trim()
}
