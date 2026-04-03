#!/usr/bin/env bash
set -euo pipefail
ROOT=/root/PlaybookRedline
docker compose -f "$ROOT/compose.yaml" exec -T postgres psql -U playbookredline -d playbookredline -c "DELETE FROM matters WHERE delete_after <= NOW();"
