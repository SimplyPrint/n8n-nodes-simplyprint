#!/usr/bin/env bash
# Rsync this repo to home-server, build the .tgz there, then install it into
# the running n8n Docker container.
#
# Expects ssh alias `home-server` to resolve to your machine.
#
# ENV VARS:
#   N8N_CONTAINER  - name of the n8n docker container (default: n8n)
#   N8N_DATA_DIR   - path on home-server where the source lives (default: ~/simplyprint-n8n)
#
# Usage:
#   N8N_CONTAINER=n8n ./scripts/install-on-home-server.sh

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"

N8N_CONTAINER="${N8N_CONTAINER:-n8n}"
N8N_DATA_DIR="${N8N_DATA_DIR:-~/simplyprint-n8n}"

echo "==> Syncing to home-server:$N8N_DATA_DIR..."
rsync -avz --delete \
    --exclude='node_modules/' \
    --exclude='dist/' \
    --exclude='*.tgz' \
    --exclude='.git/' \
    "$ROOT/" \
    "home-server:$N8N_DATA_DIR/"

echo "==> Building .tgz on home-server..."
ssh home-server "cd $N8N_DATA_DIR && bash scripts/build.sh"

echo "==> Copying .tgz into n8n container ($N8N_CONTAINER) and installing..."
# shellcheck disable=SC2029
ssh home-server "
    set -e
    TGZ=\$(ls -t $N8N_DATA_DIR/simplyprint-n8n-nodes-simplyprint-*.tgz | head -n 1)
    echo 'Using .tgz:' \"\$TGZ\"
    docker cp \"\$TGZ\" $N8N_CONTAINER:/tmp/
    docker exec $N8N_CONTAINER npm install --prefix /home/node/.n8n /tmp/\$(basename \"\$TGZ\")
    docker restart $N8N_CONTAINER
"

echo ""
echo "Done. Open your n8n UI, Settings -> Community Nodes should show the package."
echo "If not: docker logs $N8N_CONTAINER -f"
