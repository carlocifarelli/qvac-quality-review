import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'
import { afterAll, describe, it } from 'vitest'
import { plugin } from '../src/rules/index.js'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only
RuleTester.afterAll = afterAll

const tester = new RuleTester({ languageOptions: { parser: tseslint.parser, ecmaVersion: 'latest', sourceType: 'module' } })
const r = (name: string) => plugin.rules![name]!

// Invalid cases are reduced copies of the confirmed QVAC findings they generalise.

tester.run('abort-signal-race', r('abort-signal-race'), {
  valid: [
    // checked after the last await
    `async function f(signal) { await lookup(); if (signal.aborted) throw new Error('x'); await new Promise((res, rej) => { signal.addEventListener('abort', rej, { once: true }) }) }`,
    // check after adding the listener is fine too
    `async function f(signal) { await lookup(); signal.addEventListener('abort', stop, { once: true }); if (signal.aborted) stop() }`,
    `async function f(signal) { await lookup(); signal.throwIfAborted(); signal.addEventListener('abort', stop) }`,
    // a controller created here cannot be aborted before it is wired
    `async function f() { const c = new AbortController(); await x(); c.signal.addEventListener('abort', stop) }`,
    // no earlier check: passing on is the callee's job
    `async function f(opts) { await x(); return g(opts.signal) }`,
    // checked again after the await
    `async function f(opts) { if (opts.signal?.aborted) return; await x(); if (opts.signal?.aborted) return; return g(opts.signal) }`,
    // the callee is not in this file: assumed to check (fetch, library APIs)
    `async function f(opts) { if (opts.signal?.aborted) return; await x(); return fetch(url, { signal: opts.signal }) }`,
    // the local callee checks
    `function g(s) { if (s?.aborted) return; s.addEventListener('abort', h) } async function f(signal) { if (signal.aborted) return; await x(); g(signal) }`,
    // not a signal
    `async function f(emitter) { await x(); emitter.addEventListener('abort', stop) }`,
  ],
  invalid: [
    { // finding #11, hyperdrive.ts:481
      code: `async function download(drive, path, signal) {
        const entry = await drive.entry(path)
        await new Promise((resolve, reject) => {
          stream.on('finish', resolve)
          signal?.addEventListener('abort', () => reject(new Error('cancelled')), { once: true })
        })
      }`,
      errors: [{ messageId: 'listener' }],
    },
    { // finding #16, run.ts:209-258
      code: `function bounded(fit, key, ms, signal) { return new Promise((resolve) => { signal?.addEventListener('abort', () => resolve('cancelled')) }) }
      async function runFit(probe, options = {}) {
        if (options.signal?.aborted === true) return unknown('cancelled')
        const stateDir = await resolveStateDir(options.stateDir)
        mark(stateDir)
        return bounded(fit, key, 30000, options.signal)
      }`,
      errors: [{ messageId: 'listenerNoCheck' }, { messageId: 'staleCheck' }],
    },
    {
      code: `function wire(signal) { signal.addEventListener('abort', stop) }`,
      errors: [{ messageId: 'listenerNoCheck' }],
    },
  ],
})

tester.run('close-on-error', r('close-on-error'), {
  valid: [
    // handed off before anything else is awaited
    `async function setup(dir) { const store = new Corestore(dir); register(store); await other() }`,
    `async function setup(dir) { const store = new Corestore(dir); await store.ready(); return { store } }`,
    // closed on the error path
    `async function setup(dir, key) { const store = new Corestore(dir); try { const d = new Hyperdrive(store, key); await d.ready(); return { store, d } } catch (e) { await store.close(); throw e } }`,
    // stored on this immediately
    `class A { async _open() { this.store = new Corestore(this.dir); await this.store.ready() } }`,
  ],
  invalid: [
    { // finding #22, hyperdrive.ts:81-109
      code: `async function setupHyperdrive(key, dir) {
        const corestore = new Corestore(dir)
        await corestore.ready()
        const drive = new Hyperdrive(corestore, Buffer.from(key, 'hex'))
        await drive.ready()
        registerCorestore(corestore, {})
        return { corestore, drive }
      }`,
      errors: [{ messageId: 'leak', line: 5 }],
    },
    {
      code: `async function f() { const swarm = new Hyperswarm(); await swarm.join(topic).flushed(); return swarm }`,
      options: [{ classes: ['Hyperswarm'] }],
      errors: [{ messageId: 'leak' }],
    },
  ],
})

tester.run('exit-code-ignores-signal', r('exit-code-ignores-signal'), {
  valid: [
    `child.on('exit', (code, signal) => { if (signal) process.exit(1); process.exit(code ?? 0) })`,
    `child.on('exit', (code) => process.exit(code ?? 1))`,
    `child.on('data', (code) => process.exit(code || 0))`,
  ],
  invalid: [
    { // finding #8, run-consumer-external.ts:46-48
      code: `child.on('exit', (code) => { process.exit(code || 0) })`,
      errors: [{ messageId: 'exit' }],
    },
    {
      code: `child.once('close', (code, signal) => { process.exit(code ?? 0) })`,
      errors: [{ messageId: 'exit' }],
    },
  ],
})

tester.run('spawn-without-error-listener', r('spawn-without-error-listener'), {
  valid: [
    `const c = spawn('x', []); c.on('error', onError)`,
    `spawn('x', []).on('exit', done).on('error', done)`,
    `function f() { return spawn('x', []) }`,
    `async function f() { const c = spawn('x', []); await once(c, 'exit') }`,
    `const c = cp.fork('w.js'); c.once('error', fail)`,
    `const x = pool.spawn(task)`,
    // package-manager.ts:294-306: conditional spawn, listener added later
    `const proc = win ? spawn(cmd, { shell: true }) : spawn(m, args); proc.on('error', done)`,
    // doctor/deep.ts:126-171: declared first, assigned in a try
    `let child; try { child = fork(p) } catch (e) { return } child.once('error', fail)`,
  ],
  invalid: [
    { // finding #31, process-manager.ts:61-84
      code: `function spawnTracked(command, args, opts) {
        const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
        const pid = child.pid
        child.stdout?.on('data', (chunk) => log.write(chunk))
        child.on('close', () => log.end())
        return { pid, child }
      }`,
      errors: [{ messageId: 'spawn' }],
    },
    {
      code: `child_process.spawn('x', [], { stdio: 'inherit' })`,
      errors: [{ messageId: 'spawn' }],
    },
  ],
})

tester.run('stale-error-reject', r('stale-error-reject'), {
  valid: [
    `new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, resolve) })`,
    `new Promise((resolve, reject) => { server.on('error', reject); server.listen(port, () => { server.off('error', reject); resolve() }) })`,
    // short-lived stream: not checked
    `new Promise((resolve, reject) => { ws.on('error', reject); ws.on('finish', resolve) })`,
  ],
  invalid: [
    { // finding #29, metrics-server.js:39-51
      code: `class M { _open() { return new Promise((resolve, reject) => {
        this._server.listen(this._port, this._host, () => resolve())
        this._server.on('error', reject)
      }) } }`,
      errors: [{ messageId: 'stale' }],
    },
  ],
})

tester.run('throw-in-promise-listener', r('throw-in-promise-listener'), {
  valid: [
    `new Promise((resolve, reject) => { extract.on('entry', (h, s, next) => { try { fs.mkdirSync(d) } catch (e) { reject(e) } }) })`,
    `function f() { extract.on('entry', () => { fs.mkdirSync(d) }) }`,
    `new Promise((resolve) => { fs.mkdirSync(d); resolve() })`,
  ],
  invalid: [
    { // finding #6, archive.ts:140-190
      code: `function extractTarStream(archivePath, extractDir) {
        return new Promise((resolve, reject) => {
          extract.on('entry', (header, stream, next) => {
            const filePath = path.resolve(path.join(extractDir, header.name))
            if (header.type === 'file') {
              fs.mkdirSync(path.dirname(filePath), { recursive: true })
              stream.pipe(fs.createWriteStream(filePath))
            }
          })
        })
      }`,
      errors: [{ messageId: 'escape', line: 6 }],
    },
    {
      code: `new Promise((resolve, reject) => { sock.on('data', (b) => { resolve(JSON.parse(b)) }) })`,
      errors: [{ messageId: 'escape' }],
    },
  ],
})
