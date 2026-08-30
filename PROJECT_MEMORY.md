# PROJECT_MEMORY — piloto-chatbot-ai

Memória operacional e evolutiva do projeto. Este arquivo complementa o `PROJECT_CONTEXT.md`: o contexto define a arquitetura e as diretrizes estáveis; esta memória registra decisões, aprendizados, estado e continuidade entre sessões.

## Como manter esta memória

- Registrar apenas informações úteis e duráveis.
- Distinguir fatos confirmados, decisões, hipóteses e pendências.
- Atualizar o estado quando ele mudar e registrar decisões relevantes no histórico.
- Usar datas em UTC no formato `AAAA-MM-DD`.
- Nunca incluir credenciais, tokens, chaves privadas ou dados sensíveis.

## Estado atual confirmado

Atualizado em: 2026-08-30 UTC.

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
- A Fase 5 foi concluída: PostgreSQL, migrações, persistência após reinício, readiness, métricas, retenção e recuperação foram validados.

## Ponto de retomada

Atualizado em: 2026-08-30 UTC.

- Última ação concluída: concluída a Fase 3, integrando classificador, roteador por estado, fluxos determinísticos, silêncio humano e encerramento autenticado ao orquestrador, streaming e interface.
- Verificações realizadas: tipagem e build da API aprovados; 43 testes unitários e 7 testes HTTP aprovados; tipagem, 3 testes e build da interface aprovados. O teste HTTP precisou executar fora do sandbox apenas para abrir porta efêmera local.
- Trabalho em andamento: nenhum.
- Próximo passo exato: iniciar a Fase 4 configurando ambiente autorizado, aplicando a migração no PostgreSQL real e validando os fluxos ponta a ponta contra API Megaue e webhook de suporte.
- Bloqueios conhecidos: os contratos estão documentados, mas URLs de ambiente, autenticação da API Megaue e webhook do atendimento deverão ser fornecidos por configuração segura antes da validação integrada.

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
- O escopo inicial do chatbot terá somente cancelamento automatizado; qualquer outro assunto oferecerá atendimento humano.
- O estado persistido será a fonte de verdade dos fluxos. O LLM poderá classificar `CANCEL | OTHER`, mas não controlará transições nem chamadas transacionais.
- Durante `mode = HUMAN`, o bot permanecerá silencioso até uma ação explícita do atendente restaurar `BOT/IDLE`.

## Aprendizados validados

- A continuidade entre sessões não deve depender apenas do histórico da conversa. `AGENTS.md` mantém as regras de trabalho e este arquivo preserva o contexto evolutivo dentro do Git.
- O `Ponto de retomada` funciona como handoff entre sessões, mas precisa ser confirmado contra o estado real do Git.
- Memória útil precisa ser verificável e livre de segredos; credenciais e detalhes temporários de autenticação não pertencem ao repositório.

## Hipóteses a validar

- Capacidade do servidor alvo para executar o modelo DeepSeek escolhido com latência aceitável.
- Contratos e estratégia inicial de roteamento entre `OrchestratorModule`, `LlmModule`, `RagModule` e `ToolsModule`.
- Modelo de embeddings, estratégia de fragmentação e critérios de qualidade do RAG.
- Autorização de indexação, escopo de páginas e política de atualização de `https://dokuwiki.megaue.com.br`.
- Requisitos de autenticação, autorização, auditoria e retenção de conversas.

## Próximos passos

1. Criar a API NestJS e os módulos internos de orquestração e LLM.
2. Integrar diretamente o `LlmModule` ao Ollama pela rede interna.
3. Validar sucesso, entrada inválida, timeout e indisponibilidade pela API NestJS.
4. Criar a interface Next.js após o primeiro fluxo de API aprovado.

## Histórico

### 2026-08-30 — Roteamento por estado integrado ao canal web

- O caminho de mensagens agora garante a sessão/conversa, cria ou carrega o estado e continua fluxos ativos antes de considerar uma nova intenção.
- O classificador local e conservador reconhece somente expressões explícitas de cancelamento; todo conteúdo ambíguo ou diferente segue para oferta de atendimento humano sem invocar LLM.
- O orquestrador deixou de consultar RAG e Ollama nesses fluxos e identifica respostas com `flow-engine-v1`, rota e `handledBy`.
- Respostas determinísticas funcionam em JSON e streaming. Em `HUMAN`, somente a mensagem inbound é persistida e nenhum delta ou balão vazio é produzido pela interface.
- Adicionado encerramento explícito em `POST /internal/attendance/:conversationId/close`, protegido por token interno comparado em tempo constante; a ação restaura `BOT/IDLE`.
- API: tipagem, build, 43 testes unitários e 7 testes HTTP aprovados. Interface: tipagem, 3 testes e build aprovados.

### 2026-08-30 — Tools e fluxos determinísticos concluídos

- Implementado `MegaueChatbotClient` configurável, com timeout, token Bearer opcional, codificação segura de parâmetros e erros externos normalizados.
- Criadas as Tools `SearchOrderByLocatorTool`, `RequestCancelCodeTool`, `CancelOrderTool` e `NotifyHumanSupportTool`, com validação das respostas Megaue e sem persistência do código de cancelamento.
- A notificação ao Discord limita o tamanho do conteúdo e desativa menções, evitando que texto fornecido pelo usuário acione notificações indevidas.
- Implementados handlers determinísticos para localizar e validar pedidos, confirmar cancelamento, solicitar/validar código, coletar suporte opcionalmente com localizador, realizar handoff e manter silêncio em modo humano.
- Implementados services que reservam atomicamente a versão do estado antes de executar efeitos externos, impedindo duplicidade por mensagens concorrentes.
- As configurações `MEGAUE_API_BASE_URL`, `MEGAUE_API_TOKEN`, timeouts e `SUPPORT_DISCORD_WEBHOOK_URL` foram declaradas sem valores reais em `.env.example` e encaminhadas ao container da API.
- Tipagem, build, 30 testes unitários e verificação de diff passaram. A próxima fase integrará os fluxos ao orquestrador.

### 2026-08-30 — Fundação dos fluxos de cancelamento e suporte concluída

- Registrado o plano completo em `docs/PLANO-FLUXOS-SUPORTE-CANCELAMENTO.md` e limitada a automação ao cancelamento, com encaminhamento humano para qualquer outro assunto.
- Criados contratos tipados para modo, fluxo, etapas, contexto permitido e transições de conversa.
- Adicionada a migração `003_conversation_flow_state`, com integridade entre modo, etapa e fluxo, contexto `jsonb`, versão e data de atualização.
- Implementado `ConversationStateRepository` com inicialização idempotente e transições atômicas condicionadas à versão esperada; atualizações concorrentes obsoletas retornam conflito explícito.
- A migração será aplicada ao PostgreSQL pelo mecanismo existente na próxima inicialização da API; nenhuma alteração operacional em container foi necessária nesta fase.
- Tipagem e 12 testes unitários passaram. O próximo trabalho é implementar o cliente Megaue e as Tools de cancelamento.

### 2026-08-29 — Latência percebida reduzida com streaming

- Adicionado `POST /messages/stream` em NDJSON, mantendo `POST /messages` para compatibilidade; os fragmentos atravessam API NestJS, proxy Next.js e interface conforme são gerados.
- A resposta completa continua sendo persistida antes do evento final `done`, preservando IDs, correlação, rota, modelo e fontes.
- O limite padrão de geração caiu de 768 para 384 tokens e o `OLLAMA_KEEP_ALIVE` aumentou de 5 para 30 minutos.
- Na validação real pela rota web, a primeira chamada após recriar o Ollama começou a responder em 35,0 s; com o modelo aquecido, começou em 12,6 s e terminou em 18,2 s. O streaming melhora a percepção após o primeiro token, mas a CPU continua sendo o principal gargalo desse 7B.
- Passaram oito testes unitários, oito testes HTTP, três testes da interface, tipagem e builds de produção da API e web.

### 2026-08-29 — Resposta RAG de procedimento excedeu o limite

- A pergunta “Como ativo a conta no site?” retornou termos sem evidência (“Brevi”) e terminou no meio do terceiro passo após 86 s; o registro confirmou que o corte ocorreu na geração, não na interface.
- O prompt de sistema passou a proibir nomes inventados e limitar orientações a três passos e 80 palavras; o padrão de geração foi reduzido para 256 tokens para diminuir cortes e latência.
- Como o RAG não encontrou evidência para ativação de conta, a rota direta passou a instruir explicitamente o modelo a recusar procedimentos específicos sem contexto, evitando inventar telas, botões ou passos.

### 2026-08-29 — Português brasileiro fixado no provedor local

- O teste real revelou que mensagens diretas podiam receber respostas em outros idiomas porque somente o prompt RAG instruía o uso de português.
- O provedor Ollama passou a enviar uma mensagem de sistema que exige português brasileiro, clareza, objetividade e transparência quando faltar informação.
- A temperatura padrão foi definida como 0,2 e tornou-se configurável por `OLLAMA_TEMPERATURE`; o prompt RAG também passou a especificar português brasileiro.
- Tipagem e seis testes unitários passaram; após reconstrução da API, a validação real respondeu em português brasileiro pela rota direta.

### 2026-08-29 — Escopo do corpus DokuWiki autorizado

- Autorizada a indexação de todas as páginas públicas acessíveis em `https://dokuwiki.megaue.com.br`.
- Inicialmente foi definida atualização diária; essa decisão foi substituída por atualização manual durante o piloto. Ações técnicas, busca, histórico, mídia e administração ficam fora do crawler.
- Implementados versionamento documental, fragmentos vetoriais, ingestão idempotente, recuperação com limiar, fontes na API/interface e avaliação inicial com meta de 80%.
- A primeira resposta RAG excedeu 180 segundos com cinco fragmentos no DeepSeek 7B em CPU; o contexto foi reduzido a três fragmentos de até 800 caracteres e a geração limitada a 512 tokens para nova validação.
- A segunda validação confirmou rota `rag` e a fonte `criar_cortesia`, mas uma tentativa retornou `503` e outra foi truncada ao consumir 512 tokens em raciocínio; `think: false` foi aplicado no nível superior da API Ollama e o limite visível elevado a 768 tokens.
- A validação com `think: false` retornou HTTP 201, rota `rag`, resposta completa e fonte `criar_cortesia` em cerca de 2,5 minutos.
- A atualização automática foi retirada por decisão do usuário; no piloto, a ingestão do DokuWiki será acionada manualmente quando necessário.
- No acesso pela LAN em HTTP, alguns navegadores não disponibilizam `crypto.randomUUID`; a interface passou a usar fallback local para o ID visual da mensagem, mantendo UUIDs persistentes gerados pela API.

### 2026-08-29 — DokuWiki indicado como corpus inicial do RAG

- A URL indicada foi `https://dokuwiki.megaue.com.br` e respondeu HTTP 200.
- O `robots.txt` contém explicações sobre sinais de uso, mas não declara sinal explícito nem regras `User-agent`/`Disallow`; isso não substitui autorização do responsável.
- Coleta e armazenamento não foram iniciados; continuam pendentes autorização explícita, escopo e política de atualização.

### 2026-08-29 — Fase 5 concluída

- Criado segredo PostgreSQL forte em `.env` local com permissão `600`, sem exibição ou versionamento.
- A interação de teste não sensível retornou `PERSISTIDO` somente após a transação do banco ser confirmada.
- O script operacional validou migrações, contagens preservadas após reinício, limpeza de retenção, backup customizado e restauração em banco temporário removido ao final.
- Após o reinício, readiness confirmou PostgreSQL e Ollama saudáveis, métricas continuaram disponíveis e o site respondeu HTTP 200.
- Todos os critérios de aceite da Fase 5 foram demonstrados.
- A Fase 6 depende agora da definição e autorização do corpus documental inicial.

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
- A URL foi definida como `https://dokuwiki.megaue.com.br`; autorização, escopo de páginas e política de atualização permanecem pendentes.

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
