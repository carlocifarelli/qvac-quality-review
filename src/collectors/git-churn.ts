import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { Collector, Finding } from '../types.js'

const run = promisify(execFile)

/**
 * Example collector: files changed most often in recent history ("hotspots").
 * Churn alone is not a defect; combined with complexity it tells you where to look first.
 * Returns no findings if the target is not a git repository.
 */
export function gitChurnCollector(opts: { since?: string; top?: number } = {}): Collector {
  return {
    name: 'git-churn',
    async run(target): Promise<{ findings: Finding[]; metrics: Record<string, number> }> {
      let stdout: string
      try {
        ;({ stdout } = await run(
          'git',
          ['log', `--since=${opts.since ?? '6 months ago'}`, '--name-only', '--pretty=format:'],
          { cwd: target.root, maxBuffer: 64 * 1024 * 1024 },
        ))
      } catch {
        return { findings: [], metrics: { gitAvailable: 0 } }
      }
      const counts = new Map<string, number>()
      for (const f of stdout.split('\n').filter(Boolean)) counts.set(f, (counts.get(f) ?? 0) + 1)
      const tracked = new Set(target.files)
      const hot = [...counts].filter(([f]) => tracked.has(f)).sort((a, b) => b[1] - a[1])
      return {
        findings: hot.slice(0, opts.top ?? 5).map(([file, n]) => ({
          collector: 'git-churn',
          rule: 'hotspot',
          dimension: 'maintainability' as const,
          severity: 'info' as const,
          file,
          message: `changed in ${n} commits recently`,
        })),
        metrics: { gitAvailable: 1, changedFiles: hot.length },
      }
    },
  }
}
