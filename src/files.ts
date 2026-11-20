import { readdir } from 'node:fs/promises'
import { join, relative, extname } from 'node:path'
import type { Config } from './config.js'

/** Walks the tree and returns source files relative to root. */
export async function listFiles(root: string, cfg: Config): Promise<string[]> {
  const out: string[] = []
  async function walk(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!cfg.ignoreDirs.includes(entry.name)) await walk(full)
      } else if (cfg.include.includes(extname(entry.name))) {
        out.push(relative(root, full))
      }
    }
  }
  await walk(root)
  return out.sort()
}
