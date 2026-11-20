#!/usr/bin/env node
import { writeFile } from 'node:fs/promises'
import { Command } from 'commander'
import { analyze } from './analyze.js'
import { claudeReviewer } from './llm/review.js'
import { toMarkdown } from './report/markdown.js'

const program = new Command()
  .name('qc')
  .description('Assess code quality: measured findings, a score, and an LLM review on top')

program
  .command('analyze')
  .argument('<path>', 'folder to analyse')
  .option('--format <format>', 'md | json', 'md')
  .option('--out <file>', 'write the report to a file instead of stdout')
  .option('--no-llm', 'skip the LLM review')
  .option('--fail-under <n>', 'exit 1 if the overall score is below n (overrides config)')
  .action(async (path: string, o) => {
    const { report, failUnder } = await analyze(path, {
      reviewer: o.llm ? claudeReviewer() : undefined,
    })
    const text = o.format === 'json' ? JSON.stringify(report, null, 2) : toMarkdown(report)
    if (o.out) await writeFile(o.out, text)
    else process.stdout.write(text)
    const limit = o.failUnder !== undefined ? Number(o.failUnder) : failUnder
    if (report.overall < limit) {
      console.error(`\nqc: overall ${report.overall} < ${limit}`)
      process.exitCode = 1
    }
  })

await program.parseAsync()
