// Repro: getModelByName (public via @qvac/inference/models) returns
// Object.prototype members for prototype key names instead of undefined.
// Run: QVAC=<qvac> npx tsx --tsconfig <qvac>/packages/inference/tsconfig.json verification/get-model-by-name-prototype.repro.ts
import assert from 'node:assert/strict'
const { getModelByName } = await import(`${process.env.QVAC}/packages/inference/src/models/registry/index.ts`)
for (const name of ['NOT_A_MODEL', 'constructor', 'toString', '__proto__', 'hasOwnProperty']) {
  const r = getModelByName(name)
  console.log(`${name.padEnd(15)} -> ${r === undefined ? 'undefined' : typeof r + (typeof r === 'function' ? ' ' + r.name : '')}`)
}
assert.equal(getModelByName('NOT_A_MODEL'), undefined)
assert.equal(typeof getModelByName('constructor'), 'function', 'documented to return undefined')
console.log('REPRODUCED')
