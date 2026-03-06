#!/usr/bin/env sh
set -eu

mkdir -p backups
ts=$(date +"%Y%m%d-%H%M%S")
docker exec mupool-postgres pg_dump -U postgres mupool > "backups/mupool-${ts}.sql"
echo "Backup saved to backups/mupool-${ts}.sql"
