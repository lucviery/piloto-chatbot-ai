# Fluxo de Cancelamento — Endpoints da API Megaue

**Handler:** `CancelFlowHandler` + `CancelFlowService`  
**Client:** `MegaueChatbotClient`  
**Fluxo ativado pela opção:** `4` no menu principal

## Etapas e endpoints chamados

### 1. Busca por localizador (`WAITING_CANCEL_LOCATOR`)

**`GET /api/chatbot/search-by-locator?locator={locator}`**

- Chamado: quando o usuário informa o localizador do pedido.
- Query param: `locator` (URL-encoded).
- Request body: nenhum.
- Response de sucesso: `OrderLocatorResponse`

```json
{
  "orderId": 1023,
  "value": "240,00",
  "eventName": "Show do Artista X",
  "status": "CONFIRM",
  "locators": ["ABC12345", "DEF67890"]
}
```

- Erro esperado: `422 Unprocessable Entity` com body `MegaueErrorResponse`

```json
{
  "type": "...",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "Locator não encontrado",
  "instance": "...",
  "timeStamp": "..."
}
```

> O chatbot só prossegue se `status == "CONFIRM"`. Pedidos em outros status são rejeitados antes de solicitar o código.

---

### 2. Solicitação de código de cancelamento (`WAITING_CANCEL_CONFIRMATION` → opção 1)

**`POST /api/chatbot/request-cancel-code?orderId={orderId}`**

- Chamado: quando o usuário confirma a intenção de cancelar (digita `1`).
- Query param: `orderId` (Long) — recuperado do contexto salvo após o passo anterior.
- Request body: nenhum.
- Response: `RequestCancelCodeResponse`

```json
{
  "message": "Código enviado para o e-mail cadastrado",
  "maskedEmail": "jo***@gmail.com"
}
```

> O `maskedEmail` é exibido ao usuário para confirmar para qual e-mail o código foi enviado.

---

### 3. Cancelamento com código (`WAITING_CANCEL_CODE`)

**`PUT /api/chatbot/cancel-order?orderId={orderId}&code={code}`**

- Chamado: quando o usuário informa o código recebido por e-mail/SMS.
- Query params: `orderId` (Long) e `code` (URL-encoded).
- Request body: nenhum.
- Response: vazio (`204 No Content` esperado).
- Em caso de erro: API retorna exceção capturada como `MegaueIntegrationException`, com mensagem exibida ao usuário.

---

## Cenários de teste recomendados

| Cenário | Endpoint(s) envolvidos | O que verificar |
|---|---|---|
| Localizador válido com pedido confirmado | `search-by-locator` | `status == "CONFIRM"` → prossegue |
| Localizador válido com pedido não confirmado | `search-by-locator` | `status != "CONFIRM"` → exibe mensagem de bloqueio |
| Localizador inexistente | `search-by-locator` | `422` → `LocatorNotFoundException` → mensagem de erro ao usuário |
| Código de cancelamento enviado com sucesso | `request-cancel-code` | Retorna `maskedEmail` válido |
| Falha ao solicitar código | `request-cancel-code` | API retorna erro → mensagem ao usuário, permanece no step de confirmação |
| Cancelamento bem-sucedido com código correto | `cancel-order` | `2xx` → chatbot exibe mensagem de sucesso e volta ao menu |
| Código inválido | `cancel-order` | API retorna erro → mensagem ao usuário, permanece no step de código |
| Usuário aborta (digita `2` na confirmação) | — | Sem chamada à API; retorna ao menu principal |
