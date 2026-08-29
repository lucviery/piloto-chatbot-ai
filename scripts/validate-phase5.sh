#!/bin/sh
set -eu

backup_file=/tmp/piloto-chatbot-phase5-validation.dump
trap 'rm -f "$backup_file"' EXIT

query() {
  docker compose exec -T postgres sh -ec \
    "psql --username=\"\$POSTGRES_USER\" --dbname=\"\$POSTGRES_DB\" --tuples-only --no-align --command=\"$1\""
}

migrations_before=$(query 'SELECT count(*) FROM schema_migrations')
messages_before=$(query 'SELECT count(*) FROM messages')
test "$migrations_before" -ge 1
test "$messages_before" -ge 2
printf 'Migrações: %s; mensagens antes do reinício: %s\n' "$migrations_before" "$messages_before"

docker compose restart postgres api
docker compose up -d --wait postgres api

migrations_after=$(query 'SELECT count(*) FROM schema_migrations')
messages_after=$(query 'SELECT count(*) FROM messages')
test "$migrations_after" = "$migrations_before"
test "$messages_after" = "$messages_before"
printf 'Persistência após reinício confirmada: %s mensagens.\n' "$messages_after"

sh scripts/backup-postgres.sh "$backup_file"
sh scripts/verify-restore-postgres.sh "$backup_file"
docker compose exec -T api npm run retention:cleanup

curl --fail --silent --show-error --max-time 10 http://127.0.0.1:3000/health/ready >/dev/null
curl --fail --silent --show-error --max-time 10 http://127.0.0.1:3000/metrics | grep -q chatbot_http_requests_total
printf 'Readiness, métricas, retenção, backup e restauração validados.\n'
