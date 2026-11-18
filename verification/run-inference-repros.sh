#!/usr/bin/env bash
# Usage: verification/run-inference-repros.sh /path/to/qvac   (deps installed: pnpm install --ignore-scripts)
set -euo pipefail
QVAC=$(cd "$1" && pwd)
HERE=$(cd "$(dirname "$0")" && pwd)
PKG="$QVAC/packages/inference"
cp "$HERE/inference-archive.repro.test.ts" "$PKG/test/zz-qr-repro.test.ts"
trap 'rm -f "$PKG/test/zz-qr-repro.test.ts"' EXIT
cd "$PKG"
npx tsc -p test/tsconfig.build.json >/dev/null || true   # noEmitOnError=false: emits despite unrelated type errors
npx tsc-alias -p test/tsconfig.alias.json
npx brittle-bare test/dist/test/zz-qr-repro.test.js
