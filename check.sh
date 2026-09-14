#!/usr/bin/env bash
# The whole gate, run by the pre-push hook and by CI.
#   ./check.sh           types, class parity, the demo
#   ./check.sh --synced  also fails when a sibling front holds an older copy
set -euo pipefail
cd "$(dirname "$0")"

npx --no-install tsc -p .
node tools/check-classes.mjs
node build.mjs >/dev/null

if [[ "${1:-}" == "--synced" ]]; then node sync.mjs --check; fi
echo "check: ok"
