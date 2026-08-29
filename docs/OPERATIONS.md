# Operação da base do piloto

Este documento cobre a composição mínima da Fase 0. O serviço `smoke` existe apenas para validar Docker Compose, persistência, isolamento e health checks antes da entrada dos componentes do MVP.

## Pré-requisitos e acesso ao Docker

Versões validadas no ambiente:

- Docker Engine 29.1.3;
- Docker Compose 2.40.3.

O usuário operacional precisa acessar `/var/run/docker.sock`. Se ainda não pertencer ao grupo `docker`, um administrador deve executar:

```bash
sudo usermod -aG docker "$USER"
```

Depois, encerre a sessão SSH e entre novamente. Confirme com:

```bash
docker info
docker run --rm hello-world
```

Pertencer ao grupo `docker` equivale, na prática, a conceder privilégios administrativos. O acesso deve ficar limitado aos operadores autorizados.

## Configuração

Os valores seguros de referência estão em `.env.example`. Para sobrescrever valores localmente:

```bash
cp .env.example .env
```

O `.env` é ignorado pelo Git. Nenhum segredo deve ser adicionado ao Compose ou versionado. O serviço de validação não publica portas no host; sua porta HTTP existe somente na rede interna do Compose.

## Iniciar e verificar

```bash
docker compose config --quiet
docker compose up -d --wait
docker compose ps
docker compose logs --tail=100 smoke
```

O estado esperado em `docker compose ps` é `healthy`. Para confirmar que nenhuma porta foi publicada:

```bash
docker compose port smoke 8080
```

O comando não deve retornar um endereço.

## Encerrar e limpar com segurança

Encerrar preservando o volume:

```bash
docker compose down
```

Remover também o volume de validação e os dados descartáveis, depois de confirmar o projeto exibido por `docker compose ls`:

```bash
docker compose down --volumes
```

Não use limpeza global como `docker system prune` nesta máquina, pois ela poderá remover recursos de outros projetos.

## Diagnóstico

```bash
docker info
docker compose config
docker compose ps --all
docker compose logs --tail=200
docker inspect piloto-chatbot-ai-smoke-1
```

## PostgreSQL: migrações, retenção e recuperação

O PostgreSQL não publica porta no host. A API aplica migrações pendentes na inicialização e registra cada versão em `schema_migrations`. O endpoint `GET /health/ready` verifica PostgreSQL e Ollama; `GET /metrics` expõe contadores essenciais sem conteúdo das mensagens.

A política inicial do piloto retém conversas por 30 dias. Para executar a limpeza após o build da API:

```bash
docker compose exec api npm run retention:cleanup
```

Crie backup em formato customizado, fora dos volumes Docker:

```bash
sh scripts/backup-postgres.sh backups/piloto-chatbot.dump
```

Valide a restauração em um banco temporário isolado, que é removido ao final:

```bash
sh scripts/verify-restore-postgres.sh backups/piloto-chatbot.dump
```

O teste de restauração nunca deve usar o banco principal como destino. Backups podem conter conversas e devem receber as mesmas proteções de acesso, retenção e descarte aplicadas ao banco.

Erros de acesso ao socket indicam que a sessão atual ainda não recebeu o grupo `docker`. Erros de download exigem verificar DNS, rota de saída e acesso ao registro de imagens. Falha no health check deve ser investigada pelos logs e pelo campo `State.Health` do `docker inspect`.

## Firewall e portas reservadas

- Porta de entrada futura do site/proxy: `3000/tcp` apenas durante desenvolvimento local; a publicação definitiva será decidida na Fase 8.
- Next.js, NestJS, Ollama e PostgreSQL permanecerão internos à rede do Compose por padrão.
- Nenhuma regra de firewall deve ser aberta nesta fase.

Um administrador deve registrar o estado atual sem alterá-lo:

```bash
sudo ufw status verbose
```
