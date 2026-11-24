import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

export const exec = promisify(execFile)
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

export async function git(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await exec('git', args, { cwd, maxBuffer: 256 * 1024 * 1024 })
  return stdout
}

export async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return fallback
    throw err
  }
}

export async function writeJson(path: string, data: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(data, null, 2) + '\n')
}

/** Runs async tasks with bounded concurrency, preserving order. */
export async function pool<T, R>(items: T[], n: number, fn: (t: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) {
        const i = next++
        out[i] = await fn(items[i]!, i)
      }
    }),
  )
  return out
}

/** Whitespace-insensitive form of a source line, used to re-locate anchors across edits. */
export const normalizeLine = (s: string) => s.replace(/\s+/g, ' ').trim()

/** Markdown link to a line on GitHub when the target repo is known, else a plain `file:line`. */
export function sourceLink(repo: string | undefined, commit: string, file: string, line: number): string {
  return repo ? `[${file}:${line}](https://github.com/${repo}/blob/${commit}/${file}#L${line})` : `\`${file}:${line}\``
}
