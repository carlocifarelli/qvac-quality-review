import { mkdtempSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { confine, runOpenAi } from '../src/backends/openai-compatible.js'

// A stand-in for `qvac serve --openai`: first turn asks for a tool, second answers in JSON.
const requests: Record<string, unknown>[] = []
const server = createServer((req, res) => {
  let body = ''
  req.on('data', (c) => (body += c))
  req.on('end', () => {
    const b = JSON.parse(body)
    requests.push(b)
    const message = b.tools
      ? requests.length === 1
        ? { role: 'assistant', content: null, tool_calls: [{ id: 't1', type: 'function', function: { name: 'read_file', arguments: '{"path":"lib/a.js","start":2,"end":2}' } }] }
        : { role: 'assistant', content: 'done' }
      : { role: 'assistant', content: '```json\n{"findings":[{"line":2,"title":"x"}]}\n```' }
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ choices: [{ message }] }))
  })
})
let baseUrl = ''
beforeAll(async () => {
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`
})
afterAll(() => new Promise<void>((r) => server.close(() => r())))

describe('openai-compatible backend', () => {
  it('runs read-only tools in the checkout, then validates a JSON-schema answer', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qr-oa-'))
    const { mkdirSync } = await import('node:fs')
    mkdirSync(join(root, 'lib'))
    writeFileSync(join(root, 'lib/a.js'), 'one\nspawn(cmd)\nthree\n')
    const schema = z.object({ findings: z.array(z.object({ line: z.number(), title: z.string() })) })
    const usage = { calls: 0, cached: 0, costUsd: 0, seconds: 0 }
    const out = await runOpenAi({ cwd: root, model: 'reviewer', prompt: 'review', schema }, { baseUrl, maxToolCalls: 3, inlineFile: 'lib/a.js' }, usage)
    expect(out.findings[0]).toEqual({ line: 2, title: 'x' })
    expect(usage.calls).toBe(3) // tool round, round without tool calls, final answer
    expect(usage.costUsd).toBe(0)
    const first = requests[0] as { messages: { content: string }[] }
    expect(first.messages[1]!.content).toContain('2: spawn(cmd)') // file inlined
    const second = requests[1] as { messages: { role: string; content: string }[] }
    expect(second.messages.find((m) => m.role === 'tool')!.content).toBe('2: spawn(cmd)')
    const last = requests[2] as { tools?: unknown; response_format: { type: string } }
    expect(last.tools).toBeUndefined()
    expect(last.response_format.type).toBe('json_schema')
  })

  it('confines tool paths to the checkout', () => {
    expect(() => confine('/repo', '../etc/passwd')).toThrow(/outside/)
    expect(() => confine('/repo', '/etc/passwd')).toThrow(/outside/)
    expect(confine('/repo', 'packages/a.ts')).toBe('/repo/packages/a.ts')
  })
})
