# Fluxo de Suporte — Endpoints da API Megaue

**Handler:** `SupportFlowHandler` + `SupportFlowService`  
**Client:** `MegaueChatbotClient`  
**Fluxo ativado pela opção:** `2` no menu principal

## Observação sobre este fluxo

O fluxo de suporte faz **uma única chamada** à API Megaue (busca de localizador). Após coletar a mensagem do usuário, o chatbot:

1. Envia uma notificação ao Discord via webhook.
2. Muda o `mode` da conversa para `HUMAN`, transferindo o atendimento a um agente humano.

---

## Etapas e endpoints chamados

### 1. Busca por localizador (opcional) (`WAITING_SUPPORT_LOCATOR`)

**`GET /api/chatbot/search-by-locator?locator={locator}`**

- Chamado: quando o usuário informa o localizador do pedido (ou digita `0` para pular).
- Se o usuário digitar `0`, o chatbot pula a busca e vai direto para coleta da mensagem.
- Query param: `locator` (URL-encoded).
- Request body: nenhum.
- Response de sucesso: `OrderLocatorResponse`

```json
{
  "orderId": 1023,
  "value": "240,00",
  "eventName": "Show do Artista X",
  "status": "CONFIRM",
  "locators": ["ABC12345"]
}
```

- Erro esperado: `422 Unprocessable Entity` → o chatbot exibe o erro e pede novo localizador.

> Diferente do fluxo de cancelamento, aqui **não há bloqueio por status do pedido**. O suporte é aberto independente do status.

---

## Cenários de teste recomendados

| Cenário | Endpoint(s) envolvidos | O que verificar |
|---|---|---|
| Localizador válido informado | `search-by-locator` | Dados do pedido salvos no contexto; fluxo avança |
| Localizador inválido / não encontrado | `search-by-locator` | `422` → mensagem de erro; pede novo localizador |
| Usuário pula o localizador (digita `0`) | — | Sem chamada à API; contexto sem orderId |
| Abertura de suporte sem localizador | — | `orderId` no contexto é nulo; notificação enviada ao Discord com fallback |
| Abertura de suporte com localizador | `search-by-locator` | Notificação ao Discord inclui evento e pedido corretos |
