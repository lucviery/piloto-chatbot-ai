# Plano de implementação: cancelamento e atendimento humano

Data da decisão: 2026-08-30 UTC.

## Progresso

- [x] Fase 1 — Fundação: tipos e estados, migração do banco e repositório com controle otimista de concorrência.
- [x] Fase 2 — Construção dos fluxos e Tools.
- [x] Fase 3 — Integração com classificador e orquestrador.
- [x] Fase 4 — Validação integrada e ativação.

Implementação da Fase 1 concluída em 2026-08-30 UTC. A migração `003_conversation_flow_state` será aplicada automaticamente pelo `MigrationService` na próxima inicialização da API conectada ao PostgreSQL.

Implementação da Fase 2 concluída em 2026-08-30 UTC. Foram criados o cliente HTTP da Megaue, as quatro Tools autorizadas, os handlers determinísticos, os services com reserva de versão antes de efeitos externos e os testes unitários. A validação contra serviços reais permanece para a Fase 4, pois URLs e credenciais não são versionadas.

Implementação da Fase 3 concluída em 2026-08-30 UTC. O orquestrador passou a carregar o estado antes de rotear, continuar fluxos ativos sem reclassificação, classificar apenas cancelamentos explícitos e oferecer atendimento humano nos demais casos. Respostas normais, streaming, silêncio em modo humano e encerramento interno autenticado foram integrados. RAG e Ollama não são chamados pelo caminho atual de mensagens.

Fase 4 concluída em 2026-08-30 UTC. As imagens atuais foram reconstruídas, a migração `003_conversation_flow_state` foi aplicada ao PostgreSQL real e saúde, readiness, interface, persistência e transições locais foram validadas. Um cancelamento completo foi confirmado na API Megaue de homologação. O webhook real entregou a notificação antes da mudança para `HUMAN`; silêncio humano e encerramento autenticado também foram aprovados.

## Objetivo

Reduzir o escopo inicial do chatbot a dois fluxos controlados:

1. Cancelamento automatizado, executado por máquina de estados e Tools tipadas.
2. Atendimento humano para qualquer assunto que não seja cancelamento.

O LLM poderá reconhecer a intenção inicial e extrair informações da mensagem, mas não controlará as etapas do fluxo, não ignorará validações e não decidirá livremente quais APIs chamar.

## Regra principal de roteamento

```text
Mensagem recebida
  |
  |-- conversa em modo HUMAN -> bot permanece silencioso
  |
  |-- fluxo ativo -> executar a etapa determinística atual
  |
  |-- intenção de cancelamento -> iniciar fluxo de cancelamento
  |
  `-- qualquer outro assunto -> oferecer atendimento humano
                                |
                                |-- aceita -> iniciar fluxo de suporte
                                `-- recusa -> encerrar cordialmente
```

A classificação inicial terá apenas dois resultados:

```typescript
type Intent = 'CANCEL' | 'OTHER';
```

Intenções ambíguas, desconhecidas ou fora do escopo devem ser classificadas como `OTHER`. O sistema não deve tentar responder dúvidas gerais nem inventar procedimentos.

## Estado persistido da conversa

Cada conversa deverá persistir:

- `mode`: `BOT` ou `HUMAN`;
- `activeFlow`: `CANCEL`, `SUPPORT` ou nulo;
- `step`: etapa atual;
- `context`: dados permitidos já coletados;
- data da última atualização;
- versão para controle de concorrência.

Estados planejados:

```text
IDLE

Cancelamento:
WAITING_CANCEL_LOCATOR
WAITING_CANCEL_CONFIRMATION
WAITING_CANCEL_CODE

Suporte:
OFFERING_HUMAN_SUPPORT
WAITING_SUPPORT_LOCATOR
WAITING_SUPPORT_MESSAGE
HUMAN
```

O estado persistido será a fonte de verdade. Uma conversa com fluxo ativo não deve ser reclassificada a cada mensagem.

Recomenda-se criar uma tabela separada:

```text
conversation_states
- conversation_id
- mode
- active_flow
- step
- context
- updated_at
- version
```

O `context` poderá ser `jsonb`, limitado a campos autorizados. O código de cancelamento não deve ser guardado após a chamada à API.

## Fluxo de cancelamento

### 1. Coleta e consulta do localizador

Ao identificar uma intenção de cancelamento, solicitar o localizador e mudar o estado para `WAITING_CANCEL_LOCATOR`.

Chamada:

```http
GET /api/chatbot/search-by-locator?locator={locator}
```

Tratamento:

- localizador inválido ou inexistente: exibir mensagem segura e solicitar novamente;
- pedido com `status != CONFIRM`: bloquear o cancelamento automático e oferecer atendimento humano;
- pedido com `status == CONFIRM`: salvar os dados autorizados do pedido e pedir confirmação.

### 2. Confirmação do cancelamento

No estado `WAITING_CANCEL_CONFIRMATION`, exibir um resumo seguro e perguntar se o usuário deseja prosseguir.

- confirmação clara: solicitar o código de cancelamento;
- recusa ou desistência: limpar o fluxo e retornar a `IDLE`;
- resposta ambígua: repetir as opções sem avançar.

Chamada após a confirmação:

```http
POST /api/chatbot/request-cancel-code?orderId={orderId}
```

Em caso de sucesso, mostrar o `maskedEmail` retornado pela API e mudar para `WAITING_CANCEL_CODE`.

Em caso de falha, permanecer na etapa de confirmação, permitindo nova tentativa ou transferência para atendimento humano.

### 3. Validação do código e cancelamento

No estado `WAITING_CANCEL_CODE`, chamar:

```http
PUT /api/chatbot/cancel-order?orderId={orderId}&code={code}
```

Tratamento:

- sucesso: informar a conclusão, limpar o contexto e retornar a `IDLE`;
- código inválido: permanecer em `WAITING_CANCEL_CODE`;
- erro recuperável: permitir nova tentativa;
- erro não recuperável ou repetido: oferecer atendimento humano.

O código será validado exclusivamente pela API Megaue.

## Fluxo de atendimento humano

Para qualquer assunto diferente de cancelamento, informar que o atendimento automático cobre apenas cancelamentos e perguntar se o usuário deseja falar com uma pessoa.

Estado inicial: `OFFERING_HUMAN_SUPPORT`.

### Usuário aceita

Solicitar opcionalmente o localizador. O usuário poderá digitar `0` para continuar sem ele.

Estado: `WAITING_SUPPORT_LOCATOR`.

- Com localizador: consultar `search-by-locator` e salvar os dados autorizados.
- Sem localizador: continuar sem pedido associado.
- Localizador inválido: permitir nova tentativa ou continuação sem ele.
- Diferentemente do cancelamento, o status do pedido não bloqueia o suporte.

Em seguida, solicitar uma mensagem curta sobre o assunto e mudar para `WAITING_SUPPORT_MESSAGE`.

Quando a mensagem for recebida:

1. salvar a descrição no contexto;
2. enviar uma notificação ao Discord;
3. mudar a conversa para `mode = HUMAN`;
4. confirmar ao usuário que o atendimento foi encaminhado.

A mudança para `HUMAN` somente deve ocorrer depois que a entrega ao canal humano for confirmada. Se a notificação falhar, o sistema deve informar a indisponibilidade e oferecer nova tentativa.

### Usuário recusa

Limpar o fluxo, retornar a `IDLE` e encerrar cordialmente, sem tentar responder ao assunto fora do escopo.

### Conversa em modo humano

Enquanto `mode == HUMAN`, o bot não deve produzir respostas automáticas. As mensagens poderão ser persistidas e encaminhadas para o atendimento, conforme a integração disponível.

O encerramento será explícito: uma ação do atendente deverá mudar `HUMAN` para `BOT`, limpar o fluxo e restaurar o estado `IDLE`.

## Tools tipadas

Implementar as seguintes Tools:

- `SearchOrderByLocatorTool`;
- `RequestCancelCodeTool`;
- `CancelOrderTool`;
- `NotifyHumanSupportTool`.

As Tools serão responsáveis por:

- validar entradas e saídas;
- montar URLs e parâmetros;
- aplicar timeout;
- interpretar as respostas externas;
- normalizar erros em tipos conhecidos;
- impedir que endpoints e detalhes internos sejam apresentados ao usuário;
- registrar `correlationId` sem expor códigos ou dados sensíveis.

## Organização sugerida

```text
src/flows/
  flow.types.ts
  flow-router.service.ts

  cancel/
    cancel-flow.handler.ts
    cancel-flow.service.ts
    cancel-flow.types.ts

  support/
    support-flow.handler.ts
    support-flow.service.ts
    support-flow.types.ts

src/tools/megaue/
  megaue-chatbot.client.ts
  search-order-by-locator.tool.ts
  request-cancel-code.tool.ts
  cancel-order.tool.ts

src/tools/support/
  notify-human-support.tool.ts
```

Responsabilidades:

- `FlowRouter`: seleciona o fluxo usando o estado e a intenção;
- `Handler`: interpreta a mensagem na etapa atual;
- `Service`: controla transições e chama Tools;
- `Tool`: integra com sistemas externos;
- `Repository`: persiste o estado da conversa.

## Alterações no orquestrador

A consulta automática ao RAG deverá sair do início do processamento. A nova ordem será:

1. carregar o estado;
2. respeitar o modo `HUMAN`;
3. continuar um fluxo ativo;
4. classificar uma nova intenção como `CANCEL` ou `OTHER`;
5. iniciar o fluxo correspondente.

Rotas de resposta sugeridas:

```typescript
type Route =
  | 'cancel'
  | 'support'
  | 'human_handoff'
  | 'human_silent';
```

As mensagens determinísticas serão retornadas sem chamar embeddings ou o LLM. Para `human_silent`, a API e o frontend deverão adotar um contrato previsível, como `handledBy: "human"`, evitando interpretar o silêncio como erro.

## Testes obrigatórios

### Cancelamento

- reconhecimento da intenção de cancelamento;
- localizador válido com pedido `CONFIRM`;
- localizador inexistente;
- pedido com status diferente de `CONFIRM`;
- confirmação, desistência e resposta ambígua;
- sucesso e falha ao solicitar código;
- código correto e cancelamento concluído;
- código inválido com nova tentativa;
- erro não recuperável oferecendo atendimento humano;
- mensagem duplicada sem executar o cancelamento duas vezes.

### Suporte

- assunto fora de cancelamento oferecendo atendimento humano;
- aceite e recusa da transferência;
- suporte com e sem localizador;
- localizador inválido;
- notificação com mensagem e dados corretos;
- falha no Discord sem mudança prematura para `HUMAN`;
- silêncio do bot depois da transferência;
- encerramento explícito pelo atendente devolvendo a conversa para `BOT/IDLE`.

### Segurança e roteamento

- conversa em fluxo ativo não é reclassificada;
- prompt injection não altera estados nem escolhe endpoints;
- código de cancelamento não aparece nos logs;
- RAG não é consultado nesses fluxos;
- assunto ambíguo é encaminhado para a oferta de atendimento humano;
- controle de concorrência impede duas transições simultâneas.

## Ordem de implementação

1. [Concluído] Criar tipos, estados e migração do banco.
2. [Concluído] Implementar o repositório de estado com controle de concorrência.
3. [Concluído] Criar o cliente da API e as três Tools de cancelamento.
4. [Concluído] Implementar o handler e o serviço de cancelamento.
5. [Concluído] Criar a Tool de notificação e implementar o fluxo de suporte.
6. [Concluído] Implementar o classificador `CANCEL | OTHER` e o roteador de fluxos.
7. [Concluído] Substituir no orquestrador a estratégia atual de consultar RAG primeiro.
8. [Concluído] Ajustar os contratos de resposta normal e streaming.
9. Criar testes unitários dos estados, handlers, serviços e Tools.
10. Criar testes de integração dos dois fluxos.
11. Validar em ambiente de teste com a API Megaue e o webhook.
12. Ativar gradualmente e acompanhar erros, transferências e tempo de resposta.

## Critério de conclusão

O trabalho estará concluído quando:

- cancelamentos válidos puderem percorrer todas as etapas sem decisão livre do LLM;
- qualquer assunto fora de cancelamento oferecer atendimento humano;
- o bot permanecer silencioso durante o atendimento humano;
- o atendente puder encerrar explicitamente o atendimento e devolver a conversa a `BOT/IDLE`;
- erros externos não provocarem avanço indevido de estado;
- os cenários críticos estiverem cobertos por testes automatizados;
- nenhum desses fluxos depender de RAG.
