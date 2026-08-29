# piloto-chatbot-ai

Chatbot self-hosted da Megauê, projetado para execução em Ubuntu Server.

O MVP utiliza Next.js na interface, NestJS como API e OpenClaw para orquestrar o modelo local DeepSeek via Ollama, o RAG documental com PostgreSQL + pgvector e as integrações transacionais com as APIs da Megauê.

## Arquitetura

![Arquitetura do piloto-chatbot-ai](docs/arquitetura-piloto-chatbot-ai.svg)

O RAG é reservado para conhecimento documental, como manuais, políticas e procedimentos. Informações atuais ou sensíveis — pedidos, vendas, pagamentos, eventos e ingressos — devem ser consultadas em tempo real por Tools conectadas às APIs oficiais da Megauê.

## Documentação

- [Contexto técnico, responsabilidades e ordem do MVP](PROJECT_CONTEXT.md)
- [Imagem da arquitetura em SVG](docs/arquitetura-piloto-chatbot-ai.svg)

## Escopo inicial

- Ubuntu Server self-hosted.
- Docker Compose no MVP.
- DeepSeek local servido pelo Ollama no ambiente de desenvolvimento.
- Possibilidade futura de OpenAI API como alternativa ou fallback configurável.
- Sem Kubernetes ou K3s nesta etapa.
