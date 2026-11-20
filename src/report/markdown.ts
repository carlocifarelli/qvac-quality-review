import type { Report } from '../types.js'

const bar = (n: number) => '█'.repeat(Math.round(n / 10)) + '░'.repeat(10 - Math.round(n / 10))

export function toMarkdown(r: Report): string {
  const lines = [
    `# Code quality report`,
    ``,
    `**Target:** \`${r.target}\` · **Overall:** ${r.overall}/100 · ${r.generatedAt}`,
    ``,
    `| Dimension | Score | Findings |`,
    `| --- | --- | --- |`,
    ...r.dimensions.map((d) => `| ${d.dimension} | ${bar(d.score)} ${d.score} | ${d.findings} |`),
    ``,
  ]
  if (r.review) {
    lines.push(`## Reviewer summary`, ``, r.review.summary, ``, `## Top actions`, ``)
    r.review.topActions.forEach((a, i) =>
      lines.push(
        `${i + 1}. **${a.title}** (\`${a.file}\`, ${a.effort}) — ${a.why} → ${a.suggestion}`,
      ),
    )
    if (r.review.designNotes.length)
      lines.push(``, `## Design notes`, ``, ...r.review.designNotes.map((n) => `- ${n}`))
    lines.push(``)
  } else if (r.reviewError) {
    lines.push(`> LLM review skipped: ${r.reviewError}`, ``)
  }
  lines.push(
    `## Findings (${r.findings.length})`,
    ``,
    `| Severity | Rule | Location | Message |`,
    `| --- | --- | --- | --- |`,
  )
  for (const f of r.findings)
    lines.push(
      `| ${f.severity} | ${f.rule} | \`${f.file}${f.line ? `:${f.line}` : ''}\` | ${f.message} |`,
    )
  lines.push(``, `## Metrics`, ``, ...Object.entries(r.metrics).map(([k, v]) => `- ${k}: ${v}`))
  return lines.join('\n') + '\n'
}
