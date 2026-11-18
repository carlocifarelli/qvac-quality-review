// Repro: deviceDefaults keys for newer model types are stripped by the schema,
// and the merge order contradicts the "first matching pattern wins" doc.
// Run: QVAC=<qvac checkout> npx tsx --tsconfig $QVAC/packages/inference/tsconfig.json verification/F-device-defaults.ts
import assert from 'node:assert/strict'
const root = process.env.QVAC
if (!root) throw new Error('set QVAC to the qvac checkout')
const { qvacConfigSchema } = await import(`${root}/packages/inference/src/schemas/config.ts`)
const { resolveModelConfigWithContext } = await import(`${root}/packages/inference/src/runtime/model-config-utils.ts`)

// 1) Unknown-to-schema model types are silently dropped
const parsed = qvacConfigSchema.parse({
  deviceDefaults: [{
    name: 'android-cpu',
    match: { platform: 'android' },
    defaults: { audiogen: { device: 'cpu' }, 'ggml-classification': { device: 'cpu' }, bci: { gpu_device: 1 }, llm: { device: 'cpu' } },
  }],
})
const kept = Object.keys(parsed.deviceDefaults[0].defaults)
console.log('keys kept after parse:', kept)
assert.deepEqual(kept, ['llm'], 'expected audiogen / ggml-classification / bci to be stripped')

const { getDefaultsFromPattern } = await import(`${root}/packages/inference/src/runtime/model-config-utils.ts`)
for (const t of ['audiogen-ggml', 'ggml-classification', 'bci-whispercpp-transcription']) {
  const d = getDefaultsFromPattern(t, parsed.deviceDefaults[0])
  console.log(`defaults resolved for ${t}:`, d)
  assert.equal(d, undefined)
}

// 2) "First matching pattern wins" (config.ts JSDoc) vs actual last-wins merge
const specificFirst = { name: 'samsung', match: { platform: 'android', deviceBrand: 'samsung' }, defaults: { llm: { device: 'gpu' } } }
const generalSecond = { name: 'android', match: { platform: 'android' }, defaults: { llm: { device: 'cpu' } } }
const out = resolveModelConfigWithContext<{ device?: string }>('llamacpp-completion', {}, { platform: 'android', deviceBrand: 'samsung' }, [specificFirst, generalSecond] as any, [])
console.log('device with [specific, general]:', out.device)
assert.equal(out.device, 'cpu', 'documented behaviour would give gpu')
console.log('REPRODUCED')
