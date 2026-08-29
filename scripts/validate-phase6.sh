#!/bin/sh
set -eu

response_file=/tmp/piloto-chatbot-phase6-response.json
trap 'rm -f "$response_file"' EXIT

docker compose exec -T ollama ollama pull embeddinggemma:latest
docker compose up -d --build --wait api web
docker compose exec -T api npm run rag:ingest
docker compose exec -T api npm run rag:evaluate

curl --fail --silent --show-error --max-time 190 \
  -X POST http://127.0.0.1:3000/messages \
  -H 'content-type: application/json' \
  -H 'x-correlation-id: fase-6-rag' \
  -d '{"message":"Como criar uma cortesia?"}' > "$response_file"

node -e '
  const fs = require("node:fs");
  const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  if (body.route !== "rag" || !Array.isArray(body.sources) || body.sources.length === 0) process.exit(1);
  console.log(JSON.stringify({ route: body.route, sources: body.sources }));
' "$response_file"

printf 'Ingestão, avaliação e resposta RAG com fontes validadas.\n'
