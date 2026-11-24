import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Config, loadConfig } from '../src/config.js'
import { githubRepoOf, includeFor, initConfig } from '../src/init.js'
import { reviewPrompt, verifyPrompt } from '../src/prompts.js'
import { sourceLink, exec } from '../src/util.js'
import type { Finding, ReviewUnit } from '../src/types.js'

const unit: ReviewUnit = { file: 'src/a.ts', loc: 50, churn: 1, signals: {}, lint: {}, priority: 1, contentHash: 'h' }
const finding = { file: 'src/a.ts', line: 3, title: 't', category: 'correctness', severity: 'low', evidence: 'e', impact: 'i' } as Finding

describe('prompts', () => {
  it('render the project from the config', () => {
    const cfg = Config.parse({ project: { name: 'execa', description: 'the execa library (Node child processes)' } })
    expect(reviewPrompt(cfg.project, unit, false)).toMatch(/^You are reviewing one file of the execa library \(Node child processes\) for defects/)
    expect(verifyPrompt(cfg.project, finding)).toMatch(/^A reviewer claims a defect in the execa repository\./)
  })
  it('reproduce the v1 QVAC text exactly, so the case study cache stays valid', async () => {
    const cfg = await loadConfig('case-studies/qvac/qr.config.json')
    expect(reviewPrompt(cfg.project, unit, false)).toMatch(
      /^You are reviewing one file of the QVAC monorepo \(Tether's local-AI SDK, JS\/TS, runs on Node and Bare\) for defects worth a maintainer's time\.\n/,
    )
    expect(verifyPrompt(cfg.project, finding)).toMatch(/^A reviewer claims a defect in the QVAC repository\. Your job/)
  })
  it('default to a neutral description', () => {
    expect(reviewPrompt(Config.parse({}).project, unit, false)).toMatch(/^You are reviewing one file of a JS\/TS repository for defects/)
  })
})

describe('config', () => {
  it('has no target-specific defaults', () => {
    const c = Config.parse({})
    expect(c.upstreamRepo).toBeUndefined()
    expect(c.findingsRepo).toBeUndefined()
  })
  it('treats a missing default config as defaults, a missing explicit one as an error', async () => {
    await expect(loadConfig('/nonexistent/qr.config.json', { optional: true })).resolves.toMatchObject({ reviewTop: 25 })
    await expect(loadConfig('/nonexistent/qr.config.json')).rejects.toThrow()
  })
})

describe('sourceLink', () => {
  it('links to GitHub when the repo is known', () => {
    expect(sourceLink('o/r', 'abc', 'src/a.ts', 3)).toBe('[src/a.ts:3](https://github.com/o/r/blob/abc/src/a.ts#L3)')
  })
  it('falls back to a plain location', () => {
    expect(sourceLink(undefined, 'abc', 'src/a.ts', 3)).toBe('`src/a.ts:3`')
  })
})

describe('init', () => {
  it('parses GitHub remotes', () => {
    expect(githubRepoOf('https://github.com/sindresorhus/execa.git')).toBe('sindresorhus/execa')
    expect(githubRepoOf('git@github.com:tetherto/qvac.git\n')).toBe('tetherto/qvac')
    expect(githubRepoOf('https://gitlab.com/a/b.git')).toBeUndefined()
  })
  it('scopes monorepo workspaces to their sources', () => {
    expect(includeFor({ workspaces: ['packages/*'] })).toEqual(['packages/*/src/**/*.{ts,tsx,js,mjs,cjs}', 'packages/*/lib/**/*.{ts,tsx,js,mjs,cjs}'])
    expect(includeFor({ workspaces: { packages: ['apps/**'] } })[0]).toBe('apps/*/src/**/*.{ts,tsx,js,mjs,cjs}')
    expect(includeFor(undefined)).toContain('src/**/*.{ts,tsx,js,mjs,cjs}')
  })
  it('writes a config from package.json and the remote, and refuses to overwrite', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'qr-init-'))
    await exec('git', ['init', '-q', dir])
    await exec('git', ['-C', dir, 'remote', 'add', 'origin', 'https://github.com/acme/widget.git'])
    const { writeFile } = await import('node:fs/promises')
    await writeFile(join(dir, 'package.json'), JSON.stringify({ name: 'widget', description: 'Widgets for Node.' }))
    const out = join(dir, 'ws', 'qr.config.json')
    await initConfig(dir, out, false)
    const cfg = Config.parse(JSON.parse(await readFile(out, 'utf8')))
    expect(cfg.project).toEqual({ name: 'widget', description: 'the widget repository (Widgets for Node)' })
    expect(cfg.upstreamRepo).toBe('acme/widget')
    await expect(initConfig(dir, out, false)).rejects.toThrow(/exists/)
  })
})
