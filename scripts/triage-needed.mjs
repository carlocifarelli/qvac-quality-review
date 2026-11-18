// Used by scheduled-scan.yml: is there anything for a human to triage?
// Compares the committed state/findings.json with the one the scan produced.
// Prints a one-line summary and exits 0 when triage is needed, 1 when not.
// `lastSeenCommit` and line moves alone are not worth a PR.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const before = JSON.parse(execFileSync('git', ['show', 'HEAD:state/findings.json'], { encoding: 'utf8' })).findings
const after = JSON.parse(readFileSync('state/findings.json', 'utf8')).findings
const rulesNew = Number(process.env.RULES_NEW || 0)

const added = Object.keys(after).filter((k) => !before[k])
const gone = Object.keys(after).filter((k) => before[k] && before[k].presence !== 'gone' && after[k].presence === 'gone')
const back = Object.keys(after).filter((k) => before[k]?.presence === 'gone' && after[k].presence !== 'gone')

console.log(`${added.length} new leads, ${gone.length} no longer present, ${back.length} reappeared, ${rulesNew} untriaged rule hits`)
process.exit(added.length || gone.length || back.length || rulesNew ? 0 : 1)
