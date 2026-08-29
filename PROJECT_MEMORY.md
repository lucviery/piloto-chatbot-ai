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
- A Fase 0 foi concluída com Compose mínimo, health check, `.env.example`, política de segredos e procedimentos operacionais validados.
- Arquitetura planejada: Next.js, NestJS, OpenClaw, Ollama com DeepSeek e PostgreSQL com pgvector.
- Implantação inicial planejada com Docker Compose em Ubuntu Server.
- O modelo local é o padrão no desenvolvimento; OpenAI API permanece apenas como alternativa ou fallback futuro configurável.
- Kubernetes, K3s e canais externos estão fora do escopo inicial.
- A máquina de trabalho atual foi definida como ambiente integrado de desenvolvimento, testes e hospedagem de toda a pilha do piloto.
- Inventário da máquina registrado em `docs/ENVIRONMENT.md`: Ubuntu 26.04.1, 8 CPUs lógicas, 14 GiB de RAM, 84 GiB livres e somente GPU Intel integrada.
- Node.js, Docker Engine 29.1.3 e Docker Compose 2.40.3 estão instalados; PostgreSQL e Ollama ainda não estão instalados.
- O usuário `ia-user` pertence ao grupo `docker`; o daemon e a execução de containers foram validados.
- A Fase 1 foi concluída: Ollama 0.33.1 está saudável e restrito a `127.0.0.1:11434`; `deepseek-r1:7b` é o modelo padrão provisório.

## Ponto de retomada

Atualizado em: 2026-08-29 UTC.

- Última ação concluída: comparados `deepseek-r1:1.5b` e `deepseek-r1:7b` pela API local do Ollama; o 7B foi aceito provisoriamente.
- Verificações realizadas: três prompts por modelo; 7B com 5,34–6,10 tokens/s, carga de 5,64 s e 6,00 GiB observados; serviço saudável após reinício; modelos persistidos; API vinculada somente a `127.0.0.1:11434`.
- Trabalho em andamento: nenhum.
- Próximo passo exato: iniciar a Fase 2 confirmando versão, licença e contrato do OpenClaw e integrando-o ao Ollama.
- Bloqueios conhecidos: nenhum para iniciar a Fase 2. O UFW está inativo; o Ollama está protegido por bind em loopback.

## Decisões vigentes

- Todo trabalho desta iniciativa deve permanecer restrito ao repositório `piloto-chatbot-ai`.
- Aprendizados duráveis e mudanças de estado devem ser registrados neste arquivo durante o trabalho, não apenas ao final de uma conversa.
- Uma nova sessão deve reconstruir o último estado por `PROJECT_MEMORY.md`, `git status`, diffs e commits recentes antes de continuar.
- O código, os testes e a configuração atual têm precedência quando divergirem de uma anotação antiga desta memória.
- Conhecimento documental será atendido pelo RAG; dados transacionais atuais ou sensíveis serão consultados em tempo real por Tools conectadas às APIs oficiais da Megauê.
- Antes de instalar ou configurar componentes do MVP, o ambiente alvo deve ser inventariado de forma não destrutiva.
- A máquina atual é o ambiente alvo do piloto e poderá executar Next.js, NestJS, OpenClaw, Ollama/DeepSeek, PostgreSQL/pgvector e serviços auxiliares.
- O trabalho deve avançar com autonomia em ações reversíveis e de baixo risco; permissões elevadas devem ser mínimas, justificadas e restritas ao alvo necessário.
- Containers e configurações locais são preferíveis a alterações globais quando atenderem ao requisito.
- A máquina não possui GPU dedicada; o primeiro modelo local deverá ser pequeno e quantizado, com medição de desempenho antes de qualquer expansão.

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

### 2026-08-29 — Fase 1 concluída

- Ollama 0.33.1 foi adicionado ao Compose com volume persistente, health check e API restrita ao loopback.
- O 1.5B apresentou 22,46–25,21 tokens/s e 1,28 GiB, mas falhou em instruções essenciais.
- O 7B apresentou 5,34–6,10 tokens/s e 6,00 GiB, com conteúdo correto e pequenos desvios de formato; foi aceito provisoriamente.
- Reinício, saúde e persistência dos modelos foram validados. Resultados detalhados estão em `docs/PHASE1_RESULTS.md`.

### 2026-08-29 — Base versionável da Fase 0 preparada

- Confirmada a instalação prévia do Docker Engine 29.1.3 e Docker Compose 2.40.3, corrigindo o inventário anterior.
- Criado Compose mínimo sem portas publicadas, com health check, volume nomeado, sistema de arquivos somente leitura e `no-new-privileges`.
- Documentados configuração, diagnóstico, encerramento e limpeza segura.
- A validação estática passou; naquele momento, a validação do daemon, `hello-world`, subida do Compose e UFW ficou bloqueada pela autenticação administrativa interativa.

### 2026-08-29 — Estado do UFW confirmado

- O UFW está inativo.
- Nenhuma ativação ou regra foi aplicada nesta fase; o Compose mínimo continua sem portas publicadas.
- A validação de runtime do Docker permanece pendente por falta de acesso do usuário ao socket.

### 2026-08-29 — Fase 0 concluída

- Confirmada a associação de `ia-user` ao grupo `docker` e validado o daemon com Engine 29.1.3 e driver `overlayfs`.
- `hello-world` executou corretamente.
- O primeiro teste detectou que a imagem Alpine não inclui o applet `httpd`; o smoke service foi corrigido para usar o `nc` disponível na própria imagem.
- O Compose corrigido ficou saudável, permaneceu saudável após reinício, preservou o volume, não publicou portas e encerrou sem erros.
- A Fase 0 atende aos critérios de aceite e a Fase 1 está liberada.

### 2026-08-29 — Roadmap executável do MVP definido

- Organizado o projeto em fases da base operacional à avaliação final do piloto.
- Definidos critérios de aceite para impedir avanço sem validação da etapa anterior.
- Priorizada a prova de capacidade do modelo local e do OpenClaw antes da criação das aplicações web e API.
- Segurança e observabilidade foram definidas como responsabilidades contínuas.

### 2026-08-29 — Máquina atual definida como ambiente integrado do piloto

- Definido que a máquina atual hospedará o site, chatbot, banco de dados e os demais componentes do piloto.
- Registrada a preferência por maior autonomia em ações seguras e solicitações de permissão mínimas e objetivas.
- Mantidos os requisitos básicos de isolamento, proteção de segredos e avaliação prévia do ambiente.
- Concluído o inventário inicial e registrado em `docs/ENVIRONMENT.md`.

### 2026-08-29 — Memória persistente criada

- Criado `AGENTS.md` para obrigar leitura, atualização e higiene da memória em futuras sessões.
- Criado `PROJECT_MEMORY.md` com o estado inicial, decisões, aprendizados, hipóteses e próximos passos.
- Nenhuma credencial de acesso ao GitHub foi registrada no repositório.
- Definido um procedimento de recuperação para analisar as últimas ações e continuar após a perda de uma sessão.
