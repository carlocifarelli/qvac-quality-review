/**
 * Risk-surface patterns: cheap, language-agnostic hints that a file handles
 * untrusted input, external processes, the filesystem, the network, or
 * concurrency. They do not report defects; they decide where the expensive
 * reviewer spends its budget. Each pattern has a default weight.
 */
export const PATTERNS: Record<string, { re: RegExp; weight: number }> = {
  'child-process': { re: /\b(child_process|spawn\(|execFile\(|exec\(|fork\()/g, weight: 3 },
  'fs-path': { re: /\b(path\.(join|resolve)\(|fs\.(promises\.)?(rm|unlink|rename|writeFile|createWriteStream|mkdir)|\b(rm|unlink|rename|writeFile|createWriteStream)\()/g, weight: 1.5 },
  network: { re: /\b(fetch\(|http\.request|https\.request|createServer|\.listen\(|WebSocket|hyperswarm|Hyperswarm|\.connect\()/g, weight: 2 },
  'untrusted-parse': { re: /\b(JSON\.parse|Buffer\.from|decode\(|parseInt\(|Number\()/g, weight: 1 },
  crypto: { re: /\b(createHash|createHmac|timingSafeEqual|randomBytes|verify\(|sign\(|checksum|sha256)/gi, weight: 2 },
  timers: { re: /\b(setTimeout|setInterval|AbortSignal\.timeout)\(/g, weight: 1 },
  listeners: { re: /\.(on|once|addListener|addEventListener)\(/g, weight: 0.5 },
  'promise-ctor': { re: /new Promise\(/g, weight: 1.5 },
  'catch-block': { re: /catch\s*(\(\w*\))?\s*\{/g, weight: 0.5 },
  'shared-state': { re: /\b(new Map\(|new Set\(|this\._?\w+\s*=\s*)/g, weight: 0.3 },
  streams: { re: /\b(pipe\(|pipeline\(|Readable|Writable|Transform)\b/g, weight: 1 },
}

export function countSignals(src: string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [name, { re }] of Object.entries(PATTERNS)) {
    const n = src.match(re)?.length ?? 0
    if (n) out[name] = n
  }
  return out
}

/**
 * Priority = risk density x log(size) x (1 + log(churn)) + lint weight.
 * Density keeps huge files from winning on size alone; churn favours code
 * that is changing now, where a finding is cheapest to act on.
 */
export function priority(
  loc: number,
  churn: number,
  signals: Record<string, number>,
  lintHits: number,
  weights: Record<string, number> = {},
): number {
  let risk = 0
  for (const [k, n] of Object.entries(signals)) risk += Math.min(n, 20) * (weights[k] ?? PATTERNS[k]?.weight ?? 1)
  const density = risk / Math.max(loc, 50)
  return +(density * 100 * Math.log10(loc + 10) * (1 + Math.log2(1 + churn)) + lintHits * 5).toFixed(2)
}
