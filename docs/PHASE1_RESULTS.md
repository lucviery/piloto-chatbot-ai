# Resultados da Fase 1 — IA local

Data: 2026-08-29 UTC.

## Configuração validada

- Ollama 0.33.1 em container oficial, somente em `127.0.0.1:11434`.
- Volume persistente `piloto-chatbot-ai-ollama-data`.
- CPU Intel i7-8565U, sem GPU dedicada, 14 GiB de RAM.
- Modelos comparados: `deepseek-r1:1.5b` (1,1 GB) e `deepseek-r1:7b` (4,7 GB).
- Benchmark: `node scripts/benchmark-ollama.mjs`, via `POST /api/generate`, sem streaming e com modelo mantido carregado por cinco minutos.

## Resultados

| Modelo | Carga inicial | Geração aquecida | Memória observada | Qualidade |
| --- | ---: | ---: | ---: | --- |
| 1.5B | 1,62 s | 22,46–25,21 tokens/s | 1,28 GiB | Reprovado: errou instruções sobre indisponibilidade da API e JSON. |
| 7B | 5,64 s | 5,34–6,10 tokens/s | 6,00 GiB | Aceito provisoriamente: conteúdo correto nos três testes, com desvios de formatação em dois. |

As durações totais do 7B foram 15,32 s, 45,68 s e 18,79 s. A máquina permaneceu estável e o container voltou saudável após reinício. Os dois modelos continuaram disponíveis no volume.

## Decisão

`deepseek-r1:7b` é o modelo padrão do piloto. A velocidade é suficiente para avançar ao spike de integração, mas a latência de respostas longas deve ser considerada na experiência do usuário. Saída estruturada, limite de geração e prompts serão refinados posteriormente; o modelo não deve ser usado sozinho para garantir contratos ou dados transacionais.

O 1.5B fica instalado apenas para comparação e fallback de desempenho. A API local não deve ser exposta além do loopback até ser consumida exclusivamente pela rede interna do Compose.
