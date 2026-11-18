import { ESLint } from 'eslint'
import tseslint from 'typescript-eslint'
const [root, ...globs] = process.argv.slice(2)
const eslint = new ESLint({
  cwd: root, overrideConfigFile: true, errorOnUnmatchedPattern: false,
  overrideConfig: [
    { ignores: ['**/node_modules/**','**/dist/**','**/*.d.ts','**/test/**','**/tests/**','**/examples/**','**/e2e/**'] },
    { files: ['**/*.ts','**/*.tsx'], languageOptions: { parser: tseslint.parser, parserOptions: { projectService: true, tsconfigRootDir: root } },
      plugins: { '@typescript-eslint': tseslint.plugin },
      rules: { '@typescript-eslint/no-floating-promises':'warn','@typescript-eslint/no-misused-promises':'warn','@typescript-eslint/await-thenable':'warn','@typescript-eslint/only-throw-error':'warn','@typescript-eslint/no-unnecessary-condition':'off','@typescript-eslint/switch-exhaustiveness-check':'warn','@typescript-eslint/return-await':['warn','in-try-catch'] } },
    { files: ['**/*.js','**/*.ts','**/*.mjs','**/*.cjs'], languageOptions:{ecmaVersion:'latest',sourceType:'module'}, linterOptions:{reportUnusedDisableDirectives:'off'},
      rules: { 'no-async-promise-executor':'warn','no-unsafe-finally':'warn','no-unsafe-optional-chaining':'warn','no-promise-executor-return':'warn','require-atomic-updates':'off','no-self-compare':'warn','no-unmodified-loop-condition':'warn','no-unreachable-loop':'warn','no-constant-binary-expression':'warn','no-empty':['warn',{allowEmptyCatch:false}],'no-dupe-else-if':'warn','no-fallthrough':'warn','array-callback-return':'warn','no-unsafe-negation':'warn','valid-typeof':'warn','no-cond-assign':'warn','no-loss-of-precision':'warn','no-compare-neg-zero':'warn','use-isnan':'warn','no-sparse-arrays':'warn','getter-return':'warn','no-setter-return':'warn','no-dupe-keys':'warn','no-unused-private-class-members':'warn' } },
  ],
})
const res = await eslint.lintFiles(globs)
const out = []
for (const r of res) for (const m of r.messages) out.push({ file: r.filePath.replace(root+'/',''), line: m.line, rule: m.ruleId, msg: m.message, fatal: m.fatal })
console.log(JSON.stringify(out))
