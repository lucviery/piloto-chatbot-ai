# Roadmap do MVP — piloto-chatbot-ai

Este roadmap transforma a arquitetura definida em `PROJECT_CONTEXT.md` em etapas executáveis. A regra de avanço é simples: uma fase só termina quando seus critérios de aceite forem demonstrados e registrados.

## Resultado esperado do piloto

Disponibilizar, nesta máquina, um chatbot web capaz de:

1. receber uma mensagem pela interface Next.js;
2. processá-la pela API NestJS;
3. orquestrar a resposta por módulos internos do NestJS;
4. usar um modelo DeepSeek local servido pelo Ollama;
5. recuperar conhecimento documental com PostgreSQL e pgvector;
6. consultar dados transacionais por Tools/APIs autorizadas;
7. operar com logs, controles mínimos de segurança e implantação reproduzível por Docker Compose.

## Regras de execução

- Entregas pequenas, testáveis e reversíveis.
- Uma única composição Docker para o ambiente do piloto, com perfis apenas se houver necessidade real.
- Banco, Ollama e serviços internos não devem ser expostos publicamente.
- Segredos entram por variáveis de ambiente ou mecanismo local equivalente e nunca são versionados.
- Toda fase atualiza testes, documentação, inventário e `PROJECT_MEMORY.md`.
- Versões e compatibilidades devem ser confirmadas imediatamente antes de instalar cada componente.

## Fase 0 — Base operacional da máquina

Objetivo: preparar uma fundação reproduzível sem expor serviços.

Status: concluída em 2026-08-29. Evidências e comandos estão em `docs/OPERATIONS.md` e `PROJECT_MEMORY.md`.

Entregas:

- Confirmar acesso administrativo e estado do firewall.
- Instalar e validar Docker Engine e Docker Compose.
- Definir estrutura inicial do repositório, `.env.example`, política de segredos e volumes.
- Definir portas internas e reservar somente a porta de entrada do site/proxy.
- Criar verificações básicas de saúde e comandos operacionais documentados.

Critérios de aceite:

- `docker run hello-world` e `docker compose version` funcionam.
- Um Compose mínimo inicia e encerra sem erros.
- Nenhuma porta adicional fica publicamente exposta.
- Procedimento de diagnóstico e limpeza segura está documentado.

## Fase 1 — Prova de capacidade da IA local

Objetivo: validar cedo se o hardware atende ao piloto.

Status: concluída em 2026-08-29. O `deepseek-r1:7b` foi aceito provisoriamente; resultados em `docs/PHASE1_RESULTS.md`.

Entregas:

- Instalar ou executar Ollama de forma compatível com a máquina.
- Selecionar um modelo DeepSeek pequeno e quantizado adequado a CPU e 14 GiB de RAM.
- Medir tempo de carregamento, latência da primeira resposta, tokens por segundo e pico de memória.
- Testar persistência do modelo e reinicialização do serviço.

Critérios de aceite:

- O modelo responde a um conjunto pequeno de prompts previsíveis.
- A máquina permanece estável durante inferência repetida.
- Métricas e limites observados são registrados.
- Há uma decisão explícita: modelo aceito, modelo menor necessário ou provedor alternativo necessário.

## Fase 2 — Decisão de orquestração

Objetivo: remover o maior risco de integração antes de criar as aplicações.

Status: concluída em 2026-08-29. O spike reprovou o OpenClaw para este MVP e a decisão foi implementar orquestração modular no NestJS. Evidências históricas em `docs/PHASE2_RESULTS.md`.

Entregas:

- Confirmar projeto, versão, licença, modo de instalação e contrato de integração do OpenClaw.
- Integrar OpenClaw ao endpoint interno do Ollama.
- Definir o contrato mínimo de entrada e saída da orquestração.
- Validar resposta direta, timeout, erro do modelo e indisponibilidade do Ollama.

Critérios de aceite:

- Um comando ou teste automatizado envia uma pergunta ao OpenClaw e recebe resposta do modelo local.
- Falhas retornam erro estruturado e não causam resposta inventada.
- Configuração é reproduzível e não contém segredos.

Decisão tomada: o OpenClaw foi retirado da arquitetura vigente; seus artefatos de runtime foram removidos e o relatório foi preservado como histórico.

## Fase 3 — API NestJS e fluxo conversacional

Objetivo: oferecer um contrato de aplicação estável para qualquer cliente.

Entregas:

- Criar API NestJS com endpoint de saúde e endpoint de mensagens.
- Criar `OrchestratorModule`, `LlmModule`, `RagModule` e `ToolsModule` com interfaces explícitas.
- Validar payloads, padronizar respostas e erros e implementar timeouts.
- Introduzir identificadores de sessão, conversa, mensagem e correlação.
- Integrar o `LlmModule` ao Ollama pela rede interna do Compose.
- Adicionar testes unitários, de integração e um teste ponta a ponta da API.

Critérios de aceite:

- Uma chamada HTTP à API retorna resposta produzida pelo modelo local.
- Entradas inválidas, timeout e indisponibilidade recebem códigos e mensagens consistentes.
- Logs permitem acompanhar uma requisição sem registrar segredos.

## Fase 4 — Interface Next.js e primeiro fluxo vertical

Objetivo: entregar o primeiro chatbot utilizável na rede autorizada.

Entregas:

- Criar interface de conversa responsiva e acessível.
- Integrar somente com a API NestJS.
- Exibir carregamento, erro, repetição e histórico da sessão atual.
- Adicionar testes dos componentes críticos e teste ponta a ponta do fluxo web.

Critérios de aceite:

- Um usuário abre o site, envia uma mensagem e recebe a resposta local.
- Falhas são compreensíveis e permitem nova tentativa.
- O navegador não acessa diretamente Ollama ou PostgreSQL.

Marco 1: chatbot local ponta a ponta sem RAG e sem Tools.

## Fase 5 — Persistência e observabilidade

Objetivo: tornar o fluxo diagnosticável e preparar dados próprios do chatbot.

Entregas:

- Adicionar PostgreSQL e migrações versionadas.
- Persistir conversas e metadados estritamente necessários em tabelas próprias.
- Definir retenção, limpeza e backup do piloto.
- Implementar logs estruturados, health checks e métricas essenciais.

Critérios de aceite:

- Migrações funcionam em banco vazio e em atualização.
- Reiniciar containers não perde dados persistentes esperados.
- Backup e restauração são testados com dados não sensíveis.
- Falha de cada dependência pode ser identificada pelos health checks e logs.

## Fase 6 — RAG documental com pgvector

Objetivo: responder perguntas documentais com rastreabilidade.

Fonte inicial definida: um site autorizado, cuja URL e permissão de indexação ainda serão confirmadas. Cada fragmento deverá preservar URL canônica, título, data de coleta e versão do conteúdo.

Entregas:

- Habilitar pgvector e definir esquema de documentos, fragmentos, versões e metadados.
- Implementar ingestão idempotente, limpeza, fragmentação e embeddings.
- Implementar recuperação com filtros e referências às fontes.
- Criar conjunto de avaliação com perguntas, respostas esperadas e documentos de origem.

Critérios de aceite:

- Reprocessar um documento não cria duplicatas indevidas.
- Respostas documentais indicam suas fontes.
- O conjunto de avaliação atinge o limiar de qualidade que será definido antes do teste.
- Ausência de evidência gera resposta de incerteza, não invenção.

Marco 2: chatbot web com conhecimento documental avaliado.

## Fase 7 — Tools e APIs transacionais da Megauê

Objetivo: consultar dados atuais sem misturá-los ao RAG.

Entregas:

- Selecionar uma única integração de baixo risco para o piloto.
- Definir contrato, autenticação, autorização, timeout, repetição e auditoria da Tool.
- Validar entradas e saídas com schemas explícitos.
- Diferenciar visualmente ou por metadados respostas documentais e transacionais.
- Testar falha, indisponibilidade, acesso negado e dado inexistente.

Critérios de aceite:

- O modelo não recebe credenciais e não chama endpoints fora da Tool autorizada.
- A resposta transacional vem da API oficial e pode ser auditada.
- Falhas nunca são convertidas em valores inventados.

Marco 3: chatbot combina RAG e uma consulta transacional controlada.

## Fase 8 — Acesso, segurança e publicação do piloto

Objetivo: disponibilizar o piloto somente ao público autorizado.

Entregas:

- Definir acesso inicial: rede local, VPN/túnel ou internet.
- Implementar proxy reverso e TLS se houver acesso fora da máquina.
- Introduzir autenticação e autorização adequadas aos dados disponíveis.
- Aplicar limites de requisição, tamanho, concorrência e tempo.
- Revisar firewall, portas, headers, containers, volumes, backups e tratamento de segredos.

Critérios de aceite:

- Apenas a entrada necessária está acessível; serviços internos permanecem privados.
- Usuários não autorizados não acessam conversas nem Tools.
- Reinicialização completa da máquina recupera a pilha automaticamente ou por procedimento documentado.
- Um checklist básico de segurança e recuperação foi executado.

## Fase 9 — Avaliação do piloto e decisão

Objetivo: medir valor, qualidade e viabilidade antes de expandir.

Entregas:

- Executar casos representativos de resposta direta, RAG e Tool.
- Medir qualidade, latência, disponibilidade, consumo de recursos e falhas.
- Coletar feedback dos usuários autorizados.
- Registrar limitações, custo operacional e riscos.
- Recomendar continuar, ajustar arquitetura ou encerrar o piloto.

Critérios de aceite:

- Resultados são reproduzíveis e comparados a metas definidas.
- Existe uma decisão documentada sobre modelo, infraestrutura e próximos investimentos.

## Dependências e sequência crítica

```text
Base operacional
  -> IA local
  -> Decisão de orquestração
  -> API NestJS + orquestração modular + Ollama
  -> Interface Next.js
  -> Persistência
  -> RAG
  -> Tool transacional
  -> Publicação controlada
  -> Avaliação final
```

Observabilidade e segurança começam na base e evoluem em todas as fases; não ficam reservadas apenas à publicação.

## Decisões necessárias ao longo do caminho

- Modelo DeepSeek e quantização compatíveis com o hardware.
- Contratos internos entre orquestrador, LLM, RAG e Tools.
- Método de embeddings e modelo de avaliação do RAG.
- Primeira API transacional e escopo de dados permitido.
- Forma de acesso ao piloto: local, VPN/túnel ou internet.
- Identidade dos usuários, retenção das conversas e política de backup.
