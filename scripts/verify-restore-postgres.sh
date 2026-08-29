#!/bin/sh
set -eu

source_file=${1:-backups/piloto-chatbot.dump}
test -s "$source_file"

docker compose exec -T postgres sh -ec \
  'dropdb --if-exists --username="$POSTGRES_USER" piloto_restore_validation && createdb --username="$POSTGRES_USER" piloto_restore_validation'
docker compose exec -T postgres sh -ec \
  'pg_restore --exit-on-error --no-owner --no-privileges --username="$POSTGRES_USER" --dbname=piloto_restore_validation' \
  < "$source_file"
docker compose exec -T postgres sh -ec \
  'psql --username="$POSTGRES_USER" --dbname=piloto_restore_validation --tuples-only --command="SELECT count(*) FROM schema_migrations"'
docker compose exec -T postgres sh -ec \
  'dropdb --username="$POSTGRES_USER" piloto_restore_validation'
printf 'Restauração validada em banco temporário removido após o teste.\n'

