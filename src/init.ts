import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { git } from './util.js'

/** owner/name from a GitHub remote URL (https or ssh), else undefined. */
export function githubRepoOf(remote: string): string | undefined {
  const m = remote.trim().match(/github\.com[:/]([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/)
  return m ? `${m[1]}/${m[2]}` : undefined
}

/** Source globs for a checkout: workspaces' src folders when it is a monorepo, else the usual roots. */
export function includeFor(pkg: { workspaces?: string[] | { packages?: string[] } } | undefined): string[] {
  const ws = Array.isArray(pkg?.workspaces) ? pkg.workspaces : (pkg?.workspaces?.packages ?? [])
  const exts = '{ts,tsx,js,mjs,cjs}'
  if (ws.length) return ws.flatMap((w) => [`${w.replace(/\/\*\*?$/, '/*')}/src/**/*.${exts}`, `${w.replace(/\/\*\*?$/, '/*')}/lib/**/*.${exts}`])
  return [`src/**/*.${exts}`, `lib/**/*.${exts}`, `*.${exts}`]
}

/** Writes a starter config for `root` at `path`; returns a one-line summary. */
export async function initConfig(root: string, path: string, force: boolean): Promise<string> {
  if (!force && (await access(path).then(() => true, () => false))) throw new Error(`${path} exists (use --force to overwrite)`)
  const pkg = await readFile(join(root, 'package.json'), 'utf8').then((s) => JSON.parse(s) as Record<string, never>, () => undefined)
  const remote = await git(root, ['remote', 'get-url', 'origin']).catch(() => '')
  const upstreamRepo = githubRepoOf(remote)
  const name = (pkg?.['name'] as string | undefined) ?? upstreamRepo?.split('/')[1] ?? root.split('/').pop()!
  const description = (pkg?.['description'] as string | undefined)?.replace(/\.$/, '')
  const config = {
    project: { name, description: `the ${name} repository${description ? ` (${description})` : ''}` },
    include: includeFor(pkg),
    reviewTop: 25,
    ...(upstreamRepo ? { upstreamRepo } : {}),
  }
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(config, null, 2) + '\n')
  return `wrote ${path} for ${name}${upstreamRepo ? ` (${upstreamRepo})` : ''}: check "include", then run \`qr run ${root} --select-only\``
}
