# Base de Conhecimento para o LLM — Suporte, Cancelamento e Transferência

Este documento descreve, para os três fluxos do chatbot conduzidos por atendimento (não venda), **o que
acontece em cada etapa da conversa**: gatilho, validações, mensagem enviada ao usuário e chamada de API
disparada. Ele foi escrito para ser usado como **contexto/grounding de um LLM** (system prompt e/ou fonte
de um RAG) — o objetivo é o modelo saber *quando* delegar para cada fluxo, *quais dados* precisa coletar,
*em que ordem*, e *quais ações* (endpoints) pode acionar, sem inventar passos ou parâmetros.

Os contratos completos de request/response de cada endpoint (JSON) estão nos documentos irmãos e são a
fonte de verdade para os *schemas*:

- Suporte → [`flow-suporte.md`](./flow-suporte.md)
- Cancelamento → [`flow-cancelamento.md`](./flow-cancelamento.md)
- Transferência → [`flow-transferencia.md`](./flow-transferencia.md)

## 0. Contexto compartilhado da conversa

Toda mensagem inbound chega em `POST /api/chatbot/messages/inbound` e é roteada por `WhatsappService`
com base em 4 campos persistidos na entidade `Conversation`:

| Campo | Valores | Efeito |
|---|---|---|
| `mode` | `BOT` \| `HUMAN` | Em `HUMAN`, o bot **não responde** (`NO_OP`) — um atendente humano assumiu. |
| `currentFlow` | `MAIN_MENU`, `TICKET_SALES`, `SUPPORT`, `CANCEL`, `TRANSFER` | Qual handler processa a próxima mensagem. |
| `currentStep` | enum `ConversationStep` | Etapa fina dentro do fluxo. |
| `status` | `OPEN` \| `FINISHED` | Conversa encerrada (timeout) não recebe mais mensagens do fluxo. |

Comandos globais (`menu`, `oi`, `olá`, `bom dia`, `boa tarde`, `boa noite`) **sempre** resetam para
`MAIN_MENU` / `WAITING_OPTION`, em qualquer ponto de qualquer fluxo — isso deve ser tratado antes de
entrar na lógica de um fluxo específico (o LLM não deve tentar "continuar" um fluxo se detectar um
desses comandos).

Menu principal:

```
1 → TICKET_SALES (venda de ingressos)
2 → SUPPORT
3 → TRANSFER
4 → CANCEL
```

Toda resposta do bot é uma lista de `Action { type, content }`. Os tipos usados nestes 3 fluxos são:

- `SEND_TEXT` — envia `content` como texto ao usuário.
- `NO_OP` — o gateway não faz nada (usado no handoff para humano).

---

## 1. Fluxo de Suporte (`SUPPORT`)

**Gatilho:** opção `2` no menu principal.
**Objetivo:** coletar localizador (opcional) + descrição do problema, notificar um atendente no Discord
e passar a conversa para `mode = HUMAN`. Não há decisão automatizada aqui — é sempre um handoff humano.

| Step | Entrada esperada | Validação | Ação/API | Próximo step | Resposta |
|---|---|---|---|---|---|
| *(null)* | — | — | — | `WAITING_SUPPORT_LOCATOR` | pede localizador ou "pular" |
| `WAITING_SUPPORT_LOCATOR` | localizador texto, ou `PULAR` | min. 3 caracteres | se não for `PULAR`: `GET /api/chatbot/search-by-locator` | `WAITING_SUPPORT_MESSAGE` (achou ou pulou) / permanece (não achou/erro) | dados do pedido + pede descrição do problema, ou erro |
| `WAITING_SUPPORT_MESSAGE` | descrição livre do problema | não vazio, ≥5 caracteres, com pelo menos 1 alfanumérico | notifica Discord (webhook) com nome, telefone, contato, localizador, pedido e mensagem | `WAITING_HUMAN`, `mode=HUMAN` | `NO_OP` (bot silencia) |
| `WAITING_HUMAN` | qualquer coisa | — | reforça `mode=HUMAN` (idempotente) | `WAITING_HUMAN` | avisa que o atendimento já foi encaminhado |

Regras importantes para o LLM:

- **Localizador é opcional.** O usuário pode pular digitando `PULAR`; nesse caso o contexto salvo não
  tem `orderId`, e a notificação ao Discord usa fallback (`"Nao informado!"` / `contactId` no lugar do
  pedido).
- Erro de localizador não encontrado (`422`) **não bloqueia** o suporte — o bot pede o localizador de
  novo, mas o usuário sempre pode pular.
- Diferente do cancelamento, aqui **não existe verificação de status do pedido** (`CONFIRM` etc.) — o
  suporte é aberto para qualquer pedido.
- Uma vez que a mensagem de suporte é enviada com sucesso, o fluxo **termina** em `mode=HUMAN`: a partir
  daí `WhatsappService` intercepta tudo antes mesmo de chegar no handler e devolve `NO_OP` — o bot não
  deve gerar mais respostas de texto até um humano encerrar o atendimento
  (`POST /api/chatbot/internal/close-attendance`, chamado pelo gateway/painel, fora do escopo do LLM).

---

## 2. Fluxo de Cancelamento (`CANCEL`)

**Gatilho:** opção `4` no menu principal.
**Objetivo:** localizar o pedido, confirmar a intenção, validar um código enviado por e-mail e cancelar
o pedido **inteiro** (não há cancelamento parcial de ingresso).

| Step | Entrada esperada | Validação | Ação/API | Próximo step | Resposta |
|---|---|---|---|---|---|
| *(null)* | — | — | — | `WAITING_CANCEL_LOCATOR` | pede localizador |
| `WAITING_CANCEL_LOCATOR` | localizador | não vazio | `GET /api/chatbot/search-by-locator` | `WAITING_CANCEL_CONFIRMATION` (achou + `status == CONFIRM`) / permanece (não achou, ou status ≠ `CONFIRM`, ou erro de API) | dados do pedido + pergunta "1-Sim / 2-Não", ou erro |
| `WAITING_CANCEL_CONFIRMATION` | `1` ou `2` | — | `1` → `POST /api/chatbot/request-cancel-code?orderId=` | `1`→`WAITING_CANCEL_CODE`; `2`→volta ao `MAIN_MENU` (aborta); outro→permanece | código enviado (com e-mail mascarado) / cancelamento abortado / opção inválida |
| `WAITING_CANCEL_CODE` | código recebido por e-mail | não vazio | `PUT /api/chatbot/cancel-order?orderId=&code=` | sucesso→`MAIN_MENU`; erro de negócio→permanece; contexto perdido→volta a `WAITING_CANCEL_LOCATOR` | sucesso + prazos de reembolso, ou erro |

Regras importantes para o LLM:

- Só é permitido cancelar pedidos com `status == "CONFIRM"`. Qualquer outro status deve ser recusado
  antes mesmo de perguntar sobre confirmação.
- **Cancelamento é sempre total**: se o pedido tem mais de um localizador/ingresso, todos são cancelados
  juntos — isso deve ser avisado ao usuário no momento em que o pedido é encontrado.
- O código de cancelamento é enviado por e-mail (endpoint `request-cancel-code`); o bot não gera nem
  valida esse código localmente, apenas repassa para a API (`cancel-order`).
- Prazos de reembolso informados ao usuário no sucesso: PIX = 3 dias úteis; Cartão de crédito = até 2
  faturas.
- Se o contexto de cancelamento salvo na conversa se perder (ex.: erro interno), o fluxo volta para pedir
  o localizador novamente em vez de travar.

---

## 3. Fluxo de Transferência (`TRANSFER`)

**Gatilho:** opção `3` no menu principal.
**Objetivo:** transferir um ingresso de um titular (proprietário) para outra pessoa (recebedor). Tem
**dois caminhos independentes**, escolhidos em um submenu, e um comando global de cancelamento (`0`) que
se comporta de forma diferente dependendo de onde a conversa está.

Submenu (`TRANSFER_WAITING_MENU`):

```
1 → Caminho A: Solicitar transferência (sou o proprietário)
2 → Caminho B: Completar transferência (sou o recebedor, já tenho um código)
0 → cancela o processo a qualquer momento
```

### Caminho A — Proprietário cede o ingresso

| Step | Entrada | Validação | API | Próximo step |
|---|---|---|---|---|
| `TRANSFER_WAITING_LOCATOR` | localizador | regex `^[A-Za-z0-9]{8}$` | `POST /api/transfer/check-locator` | `TRANSFER_WAITING_OWNER_EMAIL` (ok) / volta ao `MAIN_MENU` (erro/API) |
| `TRANSFER_WAITING_OWNER_EMAIL` | e-mail da compra | contém `@` | `POST /api/transfer/request-owner-code` | `TRANSFER_WAITING_OWNER_CODE` |
| `TRANSFER_WAITING_OWNER_CODE` | código recebido | não vazio | `POST /api/transfer/confirm-owner-code` | `TRANSFER_WAITING_RECEIVER_NAME` |
| `TRANSFER_WAITING_RECEIVER_NAME` | nome completo do recebedor | não vazio | — (sem API) | `TRANSFER_WAITING_RECEIVER_DOCUMENT` |
| `TRANSFER_WAITING_RECEIVER_DOCUMENT` | documento do recebedor | não vazio | — (sem API) | `TRANSFER_WAITING_RECEIVER_EMAIL` |
| `TRANSFER_WAITING_RECEIVER_EMAIL` | e-mail do recebedor | contém `@` | `POST /api/transfer/start` | sucesso → volta ao `MAIN_MENU` com `transferCode` gerado |

Qualquer erro de API em qualquer etapa do Caminho A **encerra o fluxo e volta ao menu principal**
(não fica "tentando de novo" no mesmo step).

### Caminho B — Recebedor aceita a transferência

| Step | Entrada | Validação | API | Próximo step |
|---|---|---|---|---|
| `TRANSFER_WAITING_TRANSFER_CODE` | código de transferência recebido do proprietário | não vazio | `POST /api/transfer/check` | `TRANSFER_WAITING_RECEIVER_EMAIL_CONFIRM` |
| `TRANSFER_WAITING_RECEIVER_EMAIL_CONFIRM` | e-mail do recebedor | contém `@` | `POST /api/transfer/request-receiver-code` | `TRANSFER_WAITING_RECEIVER_CODE` |
| `TRANSFER_WAITING_RECEIVER_CODE` | código recebido | não vazio | `POST /api/transfer/confirm-receiver-code` | `TRANSFER_WAITING_COMPLETE_CONFIRMATION` |
| `TRANSFER_WAITING_COMPLETE_CONFIRMATION` | `1` (concluir) ou `2` (cancelar) | — | `1`→`POST /api/transfer/complete`; `2`→`POST /api/transfer/cancel` | volta ao `MAIN_MENU` em ambos os casos |

Mesma regra: qualquer erro de API encerra o fluxo e volta ao menu.

### Cancelamento global (`0`) durante o fluxo

O comando `0` é interceptado em qualquer step (exceto `WAITING_OPTION`) e o efeito depende de qual
caminho e etapa a conversa está:

- **Caminho B em andamento** (`TRANSFER_WAITING_TRANSFER_CODE`, `..._RECEIVER_EMAIL_CONFIRM`,
  `..._RECEIVER_CODE`, `..._COMPLETE_CONFIRMATION`) e já existe `transferCode` no contexto →
  `POST /api/transfer/cancel` (cancela pelo código).
- **Caminho A após confirmar o código do proprietário** (`TRANSFER_WAITING_OWNER_CODE`,
  `..._RECEIVER_NAME`, `..._RECEIVER_DOCUMENT`, `..._RECEIVER_EMAIL`) e já existe `locator` no contexto →
  `POST /api/transfer/cancel-by-locator` (cancela pelo localizador).
- **Em qualquer outro ponto** (menu, aguardando localizador, aguardando e-mail do proprietário) → não há
  nada a cancelar no backend ainda; o bot apenas limpa o contexto local e volta ao menu.

Em todos os casos, o contexto em memória da transferência (`TransferContext`, guardado por `contactId`)
é sempre limpo e a conversa volta para `MAIN_MENU` / `WAITING_OPTION`.

Regras importantes para o LLM:

- O `transferCode` é o identificador do Caminho B; o `locator` é o identificador do Caminho A. **Nunca
  confundir os dois** — os endpoints exigem parâmetros diferentes.
- Nome e documento do recebedor **não são validados contra nenhuma API** — são apenas texto livre não
  vazio; só o e-mail, o código e o localizador passam por validação de formato antes de qualquer chamada.
- O localizador tem formato fixo de 8 caracteres alfanuméricos — o LLM deve rejeitar localmente antes de
  chamar `check-locator` se o texto não bater com esse formato.

---

## Apêndice: como interpretar isso em prompts/tools de um LLM

- Cada linha das tabelas acima corresponde 1:1 a um método de `MegaueIntegrationService` /
  `MegaueChatbotClient` — ao expor **function calling/tools** para o LLM, declare uma tool por linha, com
  o mesmo nome e mesmos parâmetros do request DTO (ver docs de contrato). Isso evita que o modelo invente
  endpoints ou parâmetros.
- Os steps (`ConversationStep`) são a fonte de verdade de "onde a conversa está". Um LLM não deve pular
  etapas (ex.: ir direto de `TRANSFER_WAITING_LOCATOR` para `TRANSFER_WAITING_RECEIVER_EMAIL`) mesmo que
  o usuário informe tudo de uma vez — extraia os dados da mensagem, mas siga validando e chamando as APIs
  na ordem descrita, pois cada etapa depende do resultado (ex.: token/código) da anterior.
- Mensagens de erro de negócio (`MegaueIntegrationException.getMessage()`) devem ser repassadas ao
  usuário como texto explicativo, não como erro técnico.
