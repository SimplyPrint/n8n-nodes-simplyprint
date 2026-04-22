#!/usr/bin/env bash
# Build n8n-nodes-simplyprint into a .tgz ready for side-loading onto a
# running n8n instance. Must be run from a host with bun (or npm) installed.
#
# Output: ./simplyprint-n8n-nodes-simplyprint-<version>.tgz (at the repo root)
#
# ~90 seconds on first run (dependency install) + ~10 seconds for tsc on
# subsequent runs.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"

cd "$ROOT"

echo "==> Installing deps..."
if command -v bun >/dev/null 2>&1; then
    bun install
else
    echo "    bun not found, falling back to npm"
    npm install
fi

echo "==> Compiling TypeScript + copying icons..."
npm run build

echo "==> Packing .tgz..."
npm pack

TGZ="$(ls -t simplyprint-n8n-nodes-simplyprint-*.tgz | head -n 1)"
echo ""
echo "Done. Built: $ROOT/$TGZ"
echo ""
echo "Next: ship this .tgz to your running n8n instance and install it."
echo "  - UI: Settings -> Community Nodes -> Install (accepts npm names only)"
echo "  - OR: docker cp $TGZ <container>:/tmp/ && docker exec <container> npm i /tmp/$TGZ && docker restart <container>"
