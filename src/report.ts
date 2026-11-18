import { effectiveStatus, type State } from './state.js'
import type { Finding } from './types.js'

const link = (repo: string, commit: string, f: Finding) =>
  `https://github.com/${repo}/blob/${commit}/${f.file}#L${f.line}`
const cell = (s: string, max = 400) => s.replace(/\n/g, ' ').replace(/\|/g, '\\|').slice(0, max)

export function issueBody(f: Finding): string {
  const dup = (f.duplicates ?? []).map((d) => {
    const top = d.top.slice(0, 3).map((t) => `[${t.title}](${t.url}) (${t.state})`).join(', ')
    return `- \`${d.query}\` on ${d.searchedAt.slice(0, 10)}: ${d.total} results${top ? ': ' + top : ''}`
  })
  return [
    `**File:** \`${f.file}:${f.line}\`  `,
    `**Category:** ${f.category} · **Severity:** ${f.verdict?.severity ?? f.severity} · **Confidence:** ${f.confidence} · **Status:** ${effectiveStatus(f)}`,
    '',
    '### Evidence',
    f.evidence,
    '',
    '### Impact',
    f.impact,
    '',
    '### Reproduction',
    f.reproduction,
    '',
    '### Suggested fix',
    f.fix,
    ...(f.verdict ? ['', '### Adversarial verification (agent)', f.verdict.reasoning] : []),
    ...(f.human ? ['', '### Human verification', f.human.note] : []),
    ...(dup.length ? ['', '### Duplicate search (upstream issues and PRs, open and closed)', ...dup] : []),
    '',
    `<sub>fingerprint \`${f.fingerprint}\` · first seen at ${f.firstSeenCommit.slice(0, 12)}</sub>`,
  ].join('\n')
}

export function toMarkdown(state: State, repo: string, commit: string): string {
  const all = Object.values(state.findings)
  const by = (s: string) =>
    all.filter((f) => effectiveStatus(f) === s && f.presence !== 'gone').sort((a, b) => b.score - a.score)
  const confirmed = by('confirmed')
  const uncertain = by('uncertain')
  const candidate = by('candidate')
  const rejected = by('rejected')
  const gone = all.filter((f) => f.presence === 'gone')
  const fresh = all.filter((f) => f.firstSeenCommit === commit && f.presence !== 'gone')
  const row = (f: Finding, i: number) =>
    `| ${i + 1} | ${f.score} | ${f.verdict?.severity ?? f.severity} | ${f.category} | [${f.file}:${f.line}](${link(repo, commit, f)}) | ${cell(f.title)} | ${f.issue ? `[issue](${f.issue})` : '-'} |`
  const head = '| # | Score | Severity | Category | Location | Finding | Tracked |\n|---|---|---|---|---|---|---|'
  return (
    [
      `# Findings for ${repo}@${commit.slice(0, 12)}`,
      '',
      `Generated ${new Date().toISOString()}. ${confirmed.length} confirmed, ${uncertain.length} uncertain, ${candidate.length} unverified, ${rejected.length} rejected, ${gone.length} no longer present. ${fresh.length} first seen at this commit.`,
      '',
      '## Confirmed (ranked)',
      head,
      ...confirmed.map(row),
      '',
      '## Uncertain (needs a human or a runtime test)',
      head,
      ...uncertain.map(row),
      ...(candidate.length ? ['', '## Unverified candidates', head, ...candidate.map(row)] : []),
      '',
      '## Rejected',
      '| Location | Claim | Why rejected |\n|---|---|---|',
      ...rejected.map((f) => `| ${f.file}:${f.line} | ${cell(f.title)} | ${cell(f.human?.note ?? f.verdict?.reasoning ?? '')} |`),
      ...(gone.length
        ? ['', '## No longer present (fixed, or the code moved away)', ...gone.map((f) => `- ${f.file}: ${f.title} (last seen ${f.lastSeenCommit.slice(0, 12)})`)]
        : []),
      '',
      '## Details',
      ...[...confirmed, ...uncertain].flatMap((f) => ['', `### ${f.title}`, '', issueBody(f)]),
    ].join('\n') + '\n'
  )
}
