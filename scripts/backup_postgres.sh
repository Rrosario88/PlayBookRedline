#!/usr/bin/env bash
set -euo pipefail
ROOT=/root/PlaybookRedline
BACKUP_DIR="$ROOT/backups/postgres"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p "$BACKUP_DIR"
docker compose -f "$ROOT/compose.yaml" exec -T postgres pg_dump -U playbookredline -d playbookredline | gzip > "$BACKUP_DIR/playbookredline-$STAMP.sql.gz"
find "$BACKUP_DIR" -type f -name '*.sql.gz' -mtime +14 -delete
