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
- Arquitetura vigente: Next.js, NestJS com orquestração modular, Ollama com DeepSeek e PostgreSQL com pgvector; OpenClaw foi retirado do MVP.
- Implantação inicial planejada com Docker Compose em Ubuntu Server.
- O modelo local é o padrão no desenvolvimento; OpenAI API permanece apenas como alternativa ou fallback futuro configurável.
- Kubernetes, K3s e canais externos estão fora do escopo inicial.
- A máquina de trabalho atual foi definida como ambiente integrado de desenvolvimento, testes e hospedagem de toda a pilha do piloto.
- Inventário da máquina registrado em `docs/ENVIRONMENT.md`: Ubuntu 26.04.1, 8 CPUs lógicas, 14 GiB de RAM, 84 GiB livres e somente GPU Intel integrada.
- Node.js, Docker Engine 29.1.3, Docker Compose 2.40.3 e Ollama em container estão disponíveis; PostgreSQL ainda não foi provisionado.
- O usuário `ia-user` pertence ao grupo `docker`; o daemon e a execução de containers foram validados.
- A Fase 1 foi concluída: Ollama 0.33.1 está saudável e restrito a `127.0.0.1:11434`; `deepseek-r1:7b` é o modelo padrão provisório.
- O spike da Fase 2 reprovou OpenClaw + DeepSeek e o OpenClaw foi retirado da arquitetura vigente e do Compose.
- A Fase 3 foi concluída: implementação, contratos de RAG/Tools, identificadores conversacionais, logs estruturados, testes, container e inferência real pela API foram validados.
- A Fase 4 foi concluída: a interface Next.js, o serviço no Compose e o fluxo vertical real em Chrome estão aprovados.
- A Fase 5 está em andamento: PostgreSQL, migrações, persistência, readiness, métricas, retenção e recuperação foram implementados; a validação real aguarda a criação do segredo local do banco.

## Ponto de retomada

Atualizado em: 2026-08-29 UTC.

- Última ação concluída: implementados PostgreSQL 18/pgvector, migração inicial idempotente, persistência transacional, readiness, métricas, retenção e procedimentos de backup/restauração.
- Verificações realizadas: tipagem e build aprovados; seis testes unitários e sete testes HTTP aprovados; configuração Compose validada com senha efêmera somente no processo; scripts shell validados sintaticamente; auditoria npm sem vulnerabilidades conhecidas.
- Trabalho em andamento: validação real do banco, reinício persistente e backup/restauração.
- Próximo passo exato: criar `.env` local com `POSTGRES_PASSWORD` forte, executar `sudo docker compose up -d --build`, confirmar `/health/ready`, gerar uma conversa não sensível, reiniciar a pilha e validar backup/restauração.
- Bloqueios conhecidos: o arquivo `.env` ainda não existe e o Compose exige deliberadamente uma senha PostgreSQL fora do Git. A URL e autorização do site para o RAG continuam pendentes, mas não bloqueiam esta fase.

## Decisões vigentes

- Todo trabalho desta iniciativa deve permanecer restrito ao repositório `piloto-chatbot-ai`.
- Aprendizados duráveis e mudanças de estado devem ser registrados neste arquivo durante o trabalho, não apenas ao final de uma conversa.
- Uma nova sessão deve reconstruir o último estado por `PROJECT_MEMORY.md`, `git status`, diffs e commits recentes antes de continuar.
- O código, os testes e a configuração atual têm precedência quando divergirem de uma anotação antiga desta memória.
- Conhecimento documental será atendido pelo RAG; dados transacionais atuais ou sensíveis serão consultados em tempo real por Tools conectadas às APIs oficiais da Megauê.
- Antes de instalar ou configurar componentes do MVP, o ambiente alvo deve ser inventariado de forma não destrutiva.
- A máquina atual é o ambiente alvo do piloto e poderá executar Next.js, NestJS com orquestração modular, Ollama/DeepSeek, PostgreSQL/pgvector e serviços auxiliares.
- O OpenClaw não faz parte da arquitetura vigente; a orquestração será implementada em módulos desacoplados do NestJS.
- O trabalho deve avançar com autonomia em ações reversíveis e de baixo risco; permissões elevadas devem ser mínimas, justificadas e restritas ao alvo necessário.
- Containers e configurações locais são preferíveis a alterações globais quando atenderem ao requisito.
- A máquina não possui GPU dedicada; o primeiro modelo local deverá ser pequeno e quantizado, com medição de desempenho antes de qualquer expansão.

## Aprendizados validados

- A continuidade entre sessões não deve depender apenas do histórico da conversa. `AGENTS.md` mantém as regras de trabalho e este arquivo preserva o contexto evolutivo dentro do Git.
- O `Ponto de retomada` funciona como handoff entre sessões, mas precisa ser confirmado contra o estado real do Git.
- Memória útil precisa ser verificável e livre de segredos; credenciais e detalhes temporários de autenticação não pertencem ao repositório.

## Hipóteses a validar

- Capacidade do servidor alvo para executar o modelo DeepSeek escolhido com latência aceitável.
- Contratos e estratégia inicial de roteamento entre `OrchestratorModule`, `LlmModule`, `RagModule` e `ToolsModule`.
- Modelo de embeddings, estratégia de fragmentação e critérios de qualidade do RAG.
- URL do site inicial do RAG, autorização de indexação, escopo de páginas e política de atualização.
- Requisitos de autenticação, autorização, auditoria e retenção de conversas.

## Próximos passos

1. Criar a API NestJS e os módulos internos de orquestração e LLM.
2. Integrar diretamente o `LlmModule` ao Ollama pela rede interna.
3. Validar sucesso, entrada inválida, timeout e indisponibilidade pela API NestJS.
4. Criar a interface Next.js após o primeiro fluxo de API aprovado.

## Histórico

### 2026-08-29 — Base da Fase 5 implementada

- Adicionado PostgreSQL 18 com pgvector 0.8.6, sem porta publicada e com volume persistente.
- Criada migração versionada e idempotente para sessões, conversas e mensagens, aplicada automaticamente na inicialização da API.
- Cada interação bem-sucedida passa a ser persistida em uma única transação após a resposta do modelo.
- Adicionados readiness para PostgreSQL e Ollama, métricas essenciais em formato Prometheus e logs sem conteúdo das mensagens.
- Definida retenção inicial de 30 dias e implementados limpeza, backup e validação de restauração em banco temporário.
- A validação real aguarda a criação explícita do segredo local `POSTGRES_PASSWORD`.

### 2026-08-29 — Fase 4 concluída

- A imagem Next.js foi construída e o serviço `web` iniciou corretamente no Docker Compose, restrito a `127.0.0.1:3001`.
- A página respondeu HTTP 200 e serviu seus assets CSS e JavaScript no container.
- O teste Playwright percorreu o fluxo containerizado completo no Google Chrome e exibiu a resposta `OK` do modelo local em 1,1 minuto.
- O navegador acessou somente o site e sua rota `/api/messages`; API NestJS e Ollama permaneceram atrás do proxy server-side e da rede interna.
- Todos os critérios de aceite da Fase 4 foram demonstrados e o Marco 1 do roadmap foi atingido.
- A Fase 5 está liberada para persistência e observabilidade.

### 2026-08-29 — Interface e fluxo web da Fase 4 implementados

- Criada aplicação Next.js 16.3.3 separada em `web/`, com layout responsivo, sem assets externos e com controles acessíveis.
- Implementados histórico em memória da sessão atual, envio por Enter, carregamento, erros compreensíveis e repetição sem duplicar a mensagem original.
- O navegador chama somente `/api/messages`; o proxy server-side é o único componente web que conhece a API NestJS interna.
- Dois testes de componentes validam sucesso, erro e repetição; o build de produção e a tipagem estrita foram aprovados.
- Um teste Playwright no Google Chrome percorreu o fluxo real até o `deepseek-r1:7b` e exibiu `OK` em 1,8 minuto.
- O serviço `web` foi declarado no Compose, restrito a `127.0.0.1:3001`, mas sua execução em container aguarda autenticação administrativa interativa.

### 2026-08-29 — Fase 3 concluída

- A imagem da API foi construída e o serviço iniciou corretamente no Docker Compose.
- O endpoint `GET /health` respondeu `{"status":"ok"}` no container.
- O endpoint `POST /messages` chamou o `deepseek-r1:7b` pela rede interna e retornou `OK`, preservando IDs de sessão, conversa, mensagem e correlação.
- Todos os critérios de aceite foram demonstrados: resposta real do modelo, erros consistentes para entrada inválida, timeout e indisponibilidade e logs rastreáveis sem conteúdo sensível.
- A Fase 4 está liberada para implementar o primeiro fluxo web vertical.

### 2026-08-29 — Contrato conversacional e observabilidade da Fase 3 completos

- Adicionados IDs de sessão e conversa opcionais e validados como UUID; a API gera IDs quando o cliente não os envia.
- A correlação é normalizada no middleware, devolvida no header e no corpo e usada em logs estruturados de método, caminho, status e duração.
- Criados contratos explícitos e módulos isolados para RAG e Tools, ainda sem provedores ou roteamento antecipado.
- Cinco testes HTTP cobrem saúde, sucesso, entrada inválida, timeout e indisponibilidade; quatro testes unitários cobrem orquestração e o provedor Ollama.
- A versão atual da API respondeu `OK` do modelo real em 30,261 s e preservou todos os identificadores enviados.
- Resta apenas a validação da imagem e execução da API no Compose; a autenticação administrativa interativa bloqueia essa evidência nesta sessão.

### 2026-08-29 — Base da Fase 3 implementada

- Criada a API NestJS com módulos separados de saúde, orquestração e provedor LLM.
- Implementado o contrato inicial de mensagens com validação, limite de 4.000 caracteres, identificadores de mensagem e correlação e rota `direct` explícita.
- A integração com Ollama usa endpoint interno configurável, modelo configurável e timeout de 180 segundos, retornando erros explícitos para timeout, indisponibilidade e resposta vazia.
- Adicionado serviço `api` ao Compose, restrito por padrão a `127.0.0.1:3000`, sem privilégios adicionais e com sistema de arquivos somente leitura.
- Tipagem, build, quatro testes unitários, três testes HTTP ponta a ponta e validação estática do Compose passaram.
- A API executada diretamente recebeu uma requisição real e retornou `OK` do `deepseek-r1:7b`, preservando o identificador de correlação e a rota `direct`.
- A validação em container ficou pendente porque o processo da sessão não possui acesso efetivo ao socket Docker.

### 2026-08-29 — OpenClaw retirado da arquitetura vigente

- Decidido que a orquestração do MVP será implementada por módulos internos e desacoplados no NestJS.
- Removidos do Compose os serviços, volumes e configurações executáveis do OpenClaw.
- Excluídos os dois volumes temporários do spike e a imagem Docker local `ghcr.io/openclaw/openclaw:2026.7.1-2`; os dados temporários não são recuperáveis.
- Preservado `docs/PHASE2_RESULTS.md` como evidência histórica da avaliação.
- A Fase 3 foi liberada para implementar o fluxo NestJS direto com Ollama.

### 2026-08-29 — Spike da Fase 2 concluído sem aprovação

- Confirmados projeto oficial, licença MIT, imagem `2026.7.1-2` e protocolo nativo Ollama `/api/chat`.
- Criado perfil Compose isolado, sem Tools, skills, canais ou Gateway publicado.
- O DeepSeek 7B atingiu timeout; o 1.5B concluiu, mas produziu `NO_REPLY`.
- A indisponibilidade do Ollama gerou erro explícito e código 1, sem resposta inventada.
- A Fase 3 foi suspensa até revisão do modelo, orquestrador ou infraestrutura.

### 2026-08-29 — Site definido como fonte inicial do RAG

- O primeiro corpus documental será coletado de um site autorizado.
- A ingestão deverá ser idempotente e preservar URL canônica, título, data de coleta, versão e rastreabilidade por fragmento.
- A URL, a autorização de indexação e o escopo de páginas permanecem pendentes.

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
