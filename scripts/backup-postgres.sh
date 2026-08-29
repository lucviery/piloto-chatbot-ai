#!/bin/sh
set -eu

target=${1:-backups/piloto-chatbot.dump}
mkdir -p "$(dirname "$target")"
docker compose exec -T postgres sh -ec \
  'pg_dump --format=custom --no-owner --no-privileges --username="$POSTGRES_USER" --dbname="$POSTGRES_DB"' \
  > "$target"
test -s "$target"
printf 'Backup criado em %s\n' "$target"

