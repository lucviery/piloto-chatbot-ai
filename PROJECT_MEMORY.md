# PROJECT_MEMORY — piloto-chatbot-ai

Memória operacional e evolutiva do projeto. Este arquivo complementa o `PROJECT_CONTEXT.md`: o contexto define a arquitetura e as diretrizes estáveis; esta memória registra decisões, aprendizados, estado e continuidade entre sessões.

## Como manter esta memória

- Registrar apenas informações úteis e duráveis.
- Distinguir fatos confirmados, decisões, hipóteses e pendências.
- Atualizar o estado quando ele mudar e registrar decisões relevantes no histórico.
- Usar datas em UTC no formato `AAAA-MM-DD`.
- Nunca incluir credenciais, tokens, chaves privadas ou dados sensíveis.

## Estado atual confirmado

Atualizado em: 2026-08-29 UTC.

- Repositório GitHub: `lucviery/piloto-chatbot-ai`.
- Branch principal: `main`.
- O repositório contém documentação de contexto e um diagrama de arquitetura; a implementação do MVP ainda não foi iniciada.
- Arquitetura planejada: Next.js, NestJS, OpenClaw, Ollama com DeepSeek e PostgreSQL com pgvector.
- Implantação inicial planejada com Docker Compose em Ubuntu Server.
- O modelo local é o padrão no desenvolvimento; OpenAI API permanece apenas como alternativa ou fallback futuro configurável.
- Kubernetes, K3s e canais externos estão fora do escopo inicial.

## Ponto de retomada

Atualizado em: 2026-08-29 UTC.

- Última ação concluída: criada a estrutura de memória persistente do repositório com `AGENTS.md` e `PROJECT_MEMORY.md`, e adicionados os links correspondentes ao `README.md`.
- Verificações realizadas: conteúdo documental existente e estado inicial do Git foram inspecionados antes das mudanças.
- Trabalho em andamento: nenhum.
- Próximo passo exato: identificar o ambiente Ubuntu Server alvo e executar o inventário não destrutivo definido em `PROJECT_CONTEXT.md`.
- Bloqueios conhecidos: nenhum.

## Decisões vigentes

- Todo trabalho desta iniciativa deve permanecer restrito ao repositório `piloto-chatbot-ai`.
- Aprendizados duráveis e mudanças de estado devem ser registrados neste arquivo durante o trabalho, não apenas ao final de uma conversa.
- Uma nova sessão deve reconstruir o último estado por `PROJECT_MEMORY.md`, `git status`, diffs e commits recentes antes de continuar.
- O código, os testes e a configuração atual têm precedência quando divergirem de uma anotação antiga desta memória.
- Conhecimento documental será atendido pelo RAG; dados transacionais atuais ou sensíveis serão consultados em tempo real por Tools conectadas às APIs oficiais da Megauê.
- Antes de instalar ou configurar componentes do MVP, o ambiente alvo deve ser inventariado de forma não destrutiva.

## Aprendizados validados

- A continuidade entre sessões não deve depender apenas do histórico da conversa. `AGENTS.md` mantém as regras de trabalho e este arquivo preserva o contexto evolutivo dentro do Git.
- O `Ponto de retomada` funciona como handoff entre sessões, mas precisa ser confirmado contra o estado real do Git.
- Memória útil precisa ser verificável e livre de segredos; credenciais e detalhes temporários de autenticação não pertencem ao repositório.

## Hipóteses a validar

- Capacidade do servidor alvo para executar o modelo DeepSeek escolhido com latência aceitável.
- Versões exatas e contratos de integração entre OpenClaw, Ollama, NestJS e os demais serviços.
- Modelo de embeddings, estratégia de fragmentação e critérios de qualidade do RAG.
- Requisitos de autenticação, autorização, auditoria e retenção de conversas.

## Próximos passos

1. Inventariar o ambiente Ubuntu Server conforme `PROJECT_CONTEXT.md`.
2. Registrar os resultados do inventário e os riscos encontrados.
3. Selecionar versões compatíveis dos primeiros componentes.
4. Instalar e validar OpenClaw, Ollama e um modelo DeepSeek adequado ao hardware.
5. Executar um teste local de inferência ponta a ponta antes de criar Next.js, NestJS ou o RAG.

## Histórico

### 2026-08-29 — Memória persistente criada

- Criado `AGENTS.md` para obrigar leitura, atualização e higiene da memória em futuras sessões.
- Criado `PROJECT_MEMORY.md` com o estado inicial, decisões, aprendizados, hipóteses e próximos passos.
- Nenhuma credencial de acesso ao GitHub foi registrada no repositório.
- Definido um procedimento de recuperação para analisar as últimas ações e continuar após a perda de uma sessão.
