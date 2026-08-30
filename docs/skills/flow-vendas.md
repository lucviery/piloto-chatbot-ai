# Fluxo de Vendas — Endpoints da API Megaue

**Handler:** `SalesFlowService`  
**Client:** `MegaueChatbotSalesClient`  
**Fluxo ativado pela opção:** `1` no menu principal

## Etapas e endpoints chamados

### 1. Seleção de cidade (`CITY_RESULT`)

**`GET /api/chatbot/sales/search-cities`**

- Chamado: ao entrar no fluxo de vendas e sempre que o usuário precisa (re)escolher a cidade.
- Request: sem body, sem query params.
- Response: `List<String>` — lista de nomes de cidades disponíveis.

```json
["São Paulo", "Rio de Janeiro", "Belo Horizonte"]
```

---

### 2. Seleção de evento (`EVENT_RESULT`)

**`GET /api/chatbot/sales/search-events?city={city}`**

- Chamado: após o usuário escolher uma cidade válida.
- Query param: `city` — nome da cidade (URL-encoded).
- Response: `List<ChatbotResource>`

```json
[
  {
    "id": 42,
    "name": "Show do Artista X",
    "description": "...",
    "date": "2025-08-10",
    "city": "São Paulo",
    "localAddress": "Arena XYZ",
    "value": "150,00",
    "stockId": null
  }
]
```

---

### 3. Seleção de classe de ingresso (`TICKET_CLASS_RESULT`)

**`GET /api/chatbot/sales/search-stock?city={city}&event={eventId}`**

- Chamado: após o usuário escolher um evento válido.
- Query params: `city` (URL-encoded) e `event` (inteiro).
- Response: `List<ChatbotResource>` — cada item representa uma classe de ingresso (Pista, Camarote, etc.).

```json
[
  {
    "id": 10,
    "name": "Pista",
    "description": "Área geral",
    "date": null,
    "city": null,
    "localAddress": null,
    "value": "120,00",
    "stockId": 55
  }
]
```

> O campo `stockId` é o usado para registrar a venda; se nulo, usa-se `id`.

---

### 4. Registro de pedido (`CHECKOUT_DECISION_RESULT` → opção 2)

**`POST /api/chatbot/sales/register-sales`**

- Chamado: quando o usuário decide finalizar e gerar o PIX.
- Request body: `List<SalesResource>`

```json
[
  {
    "amount": 2,
    "stockId": 55,
    "email": "teste@megaue.com.br",
    "cellphone": "5511999999999",
    "name": "João Silva",
    "contactId": "5511999999999@s.whatsapp.net"
  }
]
```

- Response: `SalesResponseResource`

```json
{
  "ordersIds": [1023],
  "response": "OK",
  "qrCodePIX": null
}
```

> O `orderId` extraído de `ordersIds` é usado imediatamente para gerar o PIX.

---

### 5. Geração de PIX (`WAITING_PAYMENT`)

**`POST /api/chatbot/sales/pix/{orderId}?coupon={coupon}`**

- Chamado: logo após o registro de vendas, ainda no mesmo fluxo de checkout.
- Path param: `orderId` (Long).
- Query param: `coupon` — opcional, omitido se nulo/vazio.
- Request body: vazio.
- Response: `PixAdapterResponse`

```json
{
  "qrCode": "<bytes do QR Code>",
  "copyAndPaste": "00020101021226870014br.gov.bcb.pix...",
  "pixId": 789,
  "status": "PENDING"
}
```

---

## Cenários de teste recomendados

| Cenário | Endpoint(s) envolvidos | O que verificar |
|---|---|---|
| Nenhuma cidade disponível | `search-cities` | Retorna lista vazia → chatbot exibe mensagem de indisponibilidade |
| Nenhum evento na cidade escolhida | `search-events` | Retorna lista vazia → chatbot pede nova seleção |
| Nenhum estoque disponível | `search-stock` | Retorna lista vazia → chatbot pede nova seleção |
| Registro de venda com sucesso | `register-sales` | `ordersIds` com pelo menos um ID |
| Registro de venda sem retornar orderId | `register-sales` | `ordersIds` nulo ou vazio → chatbot exibe erro |
| Geração de PIX com cupom | `pix/{orderId}?coupon=X` | Cupom é passado corretamente via query param |
| Geração de PIX sem cupom | `pix/{orderId}` | Query param `coupon` ausente na request |
| PIX retorna `copyAndPaste` nulo | `pix/{orderId}` | Chatbot exibe mensagem de fallback |
