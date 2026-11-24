import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { git } from './util.js'

/** owner/name from a GitHub remote URL (https or ssh), else undefined. */
export function githubRepoOf(remote: string): string | undefined {
  const m = remote.trim().match(/github\.com[:/]([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/)
  return m ? `${m[1]}/${m[2]}` : undefined
}

/** Workspace globs declared in pnpm-workspace.yaml (the `packages:` list), without parsing the rest of the YAML. */
export function pnpmWorkspaces(yaml: string): string[] {
  const block = yaml.match(/^packages:\s*\n((?:[ \t]+(?:-.*|#.*)?\n?)+)/m)?.[1] ?? ''
  return [...block.matchAll(/^[ \t]+-\s*['"]?([^'"#\s]+)['"]?/gm)].map((m) => m[1]!)
}

/** Folders that hold tests, docs or demos rather than shipped code. */
const NOT_SOURCE = /(^|\/)(!|docs?|examples?|e2e|playgrounds?|benchmarks?|fixtures?|__tests__|tests?|scripts|tools)(\/|$)/

/** Source globs for a checkout: the workspaces' src and lib folders when it is a monorepo, else the usual roots. */
export function includeFor(workspaces: string[]): string[] {
  const exts = '{ts,tsx,js,mjs,cjs}'
  const ws = [...new Set(workspaces.filter((w) => !w.startsWith('!') && !NOT_SOURCE.test(w)).map((w) => w.replace(/\/\*\*?$/, '/*')))]
  if (ws.length) return ws.flatMap((w) => [`${w}/src/**/*.${exts}`, `${w}/lib/**/*.${exts}`])
  return [`src/**/*.${exts}`, `lib/**/*.${exts}`, `*.${exts}`]
}

/** Writes a starter config for `root` at `path`; returns a one-line summary. */
export async function initConfig(root: string, path: string, force: boolean): Promise<string> {
  if (!force && (await access(path).then(() => true, () => false))) throw new Error(`${path} exists (use --force to overwrite)`)
  const pkg = await readFile(join(root, 'package.json'), 'utf8').then((s) => JSON.parse(s) as Record<string, never>, () => undefined)
  const pnpm = await readFile(join(root, 'pnpm-workspace.yaml'), 'utf8').then(pnpmWorkspaces, () => [])
  const npmWs = pkg?.['workspaces'] as string[] | { packages?: string[] } | undefined
  const workspaces = [...(Array.isArray(npmWs) ? npmWs : (npmWs?.packages ?? [])), ...pnpm]
  const remote = await git(root, ['remote', 'get-url', 'origin']).catch(() => '')
  const upstreamRepo = githubRepoOf(remote)
  const name = (pkg?.['name'] as string | undefined) ?? upstreamRepo?.split('/')[1] ?? root.split('/').pop()!
  const description = (pkg?.['description'] as string | undefined)?.replace(/\.$/, '')
  const config = {
    project: { name, description: `the ${name} repository${description ? ` (${description})` : ''}` },
    include: includeFor(workspaces),
    reviewTop: 25,
    ...(upstreamRepo ? { upstreamRepo } : {}),
  }
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(config, null, 2) + '\n')
  return `wrote ${path} for ${name}${upstreamRepo ? ` (${upstreamRepo})` : ''}: check "include", then run \`qr run ${root} --select-only\``
}
