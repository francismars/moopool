#!/usr/bin/env sh
set -eu

if [ $# -ne 1 ]; then
  echo "Usage: ./infra/scripts/restore-db.sh <backup-file.sql>"
  exit 1
fi

backup_file="$1"
if [ ! -f "$backup_file" ]; then
  echo "File not found: $backup_file"
  exit 1
fi

cat "$backup_file" | docker exec -i mupool-postgres psql -U postgres -d mupool
echo "Restore complete from $backup_file"
