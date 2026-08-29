# piloto-chatbot-ai

Chatbot self-hosted da Megauê, projetado para execução em Ubuntu Server.

O MVP utiliza Next.js na interface e NestJS como API e camada de orquestração modular do modelo local DeepSeek via Ollama, do RAG documental com PostgreSQL + pgvector e das integrações transacionais com as APIs da Megauê.

## Arquitetura

![Arquitetura do piloto-chatbot-ai](docs/arquitetura-piloto-chatbot-ai.svg)

O RAG é reservado para conhecimento documental, como manuais, políticas e procedimentos. Informações atuais ou sensíveis — pedidos, vendas, pagamentos, eventos e ingressos — devem ser consultadas em tempo real por Tools conectadas às APIs oficiais da Megauê.

## Documentação

- [Contexto técnico, responsabilidades e ordem do MVP](PROJECT_CONTEXT.md)
- [Memória, decisões, aprendizados e continuidade do projeto](PROJECT_MEMORY.md)
- [Instruções persistentes para agentes e futuras sessões](AGENTS.md)
- [Inventário da máquina de desenvolvimento, testes e hospedagem](docs/ENVIRONMENT.md)
- [Roadmap executável e critérios de aceite do MVP](docs/ROADMAP.md)
- [Operação, diagnóstico e limpeza segura da base Docker](docs/OPERATIONS.md)
- [Resultados do benchmark da IA local](docs/PHASE1_RESULTS.md)
- [Resultados históricos e decisão do spike OpenClaw + Ollama](docs/PHASE2_RESULTS.md)
- [Imagem da arquitetura em SVG](docs/arquitetura-piloto-chatbot-ai.svg)

## Escopo inicial

- Ubuntu Server self-hosted.
- Docker Compose no MVP.
- DeepSeek local servido pelo Ollama no ambiente de desenvolvimento.
- Possibilidade futura de OpenAI API como alternativa ou fallback configurável.
- Sem Kubernetes ou K3s nesta etapa.
