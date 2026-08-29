# Resultados da Fase 2 — OpenClaw + Ollama

Data: 2026-08-29 UTC.

## Projeto e configuração avaliados

- Projeto oficial: `openclaw/openclaw`, licença MIT.
- Imagem fixada: `ghcr.io/openclaw/openclaw:2026.7.1-2`; CLI reportou OpenClaw 2026.7.1.
- Integração pelo protocolo nativo do Ollama em `http://ollama:11434`, sem `/v1`.
- Execução headless e isolada por `agent --local --json`, sem Gateway publicado, canais, skills ou Tools.
- Estado em volumes nomeados; imagem executada sem capabilities e com `no-new-privileges`. Um inicializador restrito recebe somente as capabilities necessárias para ajustar a propriedade dos volumes.

## Contrato observado

A saída JSON contém `payloads`, `meta.agentMeta`, identidade de provider/model, consumo, estado de vida, motivo de parada e detalhes estruturados de erro. Sucesso termina com código 0; indisponibilidade termina com código 1. O comando reproduzível é:

```bash
docker compose --profile spike run --rm openclaw-spike \
  node dist/index.js agent --local \
  --session-id <id> --message '<mensagem>' \
  --thinking off --timeout 180 --json
```

## Testes e resultados

1. Descoberta: `ollama/deepseek-r1:7b` foi encontrado pela rede interna com contexto configurado.
2. Contexto: 4K foi insuficiente para o bootstrap; 8K também falhou porque a reserva deixou apenas 4K para o prompt. Com 16K, o prompt coube.
3. DeepSeek 7B: mesmo com skills e Tools removidas e bootstrap reduzido, a chamada expirou após 120 segundos sem resposta.
4. DeepSeek 1.5B: concluiu em 67,8 segundos e o OpenClaw registrou sucesso, mas retornou `NO_REPLY`, sem payload visível; o contrato funcional esperado não foi atendido.
5. Ollama indisponível: OpenClaw retornou erro explícito de endpoint/DNS e código 1, sem inventar uma resposta. O Ollama foi restaurado e voltou saudável.

## Decisão

O spike está concluído, mas o OpenClaw não está aprovado para avançar à API NestJS neste hardware e com os modelos DeepSeek avaliados. A integração técnica existe e as falhas são explícitas, porém nenhum modelo satisfez simultaneamente qualidade, latência e entrega de resposta.

Antes da Fase 3, é necessário escolher uma destas opções e executar um novo spike:

1. testar um modelo local pequeno, instrucional e compatível com Tools, mantendo o OpenClaw;
2. simplificar ou substituir o orquestrador;
3. disponibilizar hardware mais rápido ou um provedor externo autorizado.

A configuração fica preservada no perfil Compose `spike` como evidência reproduzível, não como serviço aprovado do MVP.
