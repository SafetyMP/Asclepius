#!/usr/bin/env bash
# Definition of Done — mirrors CI gate (format, lint, typecheck, test, build).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -x ./scripts/check-stub-canary.sh ]]; then
  ./scripts/check-stub-canary.sh
fi

if command -v corepack >/dev/null 2>&1; then
  corepack enable >/dev/null 2>&1 || true
  corepack prepare npm@10.9.2 --activate >/dev/null 2>&1 || true
fi

echo "==> npm ci (expect packageManager npm@10.9.2)"
npm ci

echo "==> gate"
npm run gate

echo "verify: ok (ci/web parity)"
