# Fluxo de Transferência — Endpoints da API Megaue

**Handler:** `TransferWhatsappFlowHandler` + `TransferFlowService`  
**Client:** `MegaueChatbotClient`  
**Fluxo ativado pela opção:** `3` no menu principal

O fluxo possui dois caminhos: **Proprietário** (quem cede o ingresso) e **Recebedor** (quem recebe).

---

## Caminho A — Proprietário cede o ingresso

### 1. Verificação de localizador (`TRANSFER_WAITING_LOCATOR`)

**`POST /api/transfer/check-locator`**

- Chamado: quando o proprietário informa o localizador do ingresso a transferir.
- Request body: `CheckLocatorRequest`

```json
{
  "locator": "ABC12345"
}
```

- Response: `CheckLocatorResponse`

```json
{
  "locator": "ABC12345",
  "orderId": 1023,
  "ticketId": 55,
  "eventName": "Show do Artista X",
  "status": "CONFIRM",
  "transferEligible": true,
  "reason": null
}
```

> Se `transferEligible == false`, a API retorna `reason` com a explicação; o chatbot exibe e encerra o fluxo.

---

### 2. Solicitação de código ao proprietário (`TRANSFER_WAITING_OWNER_EMAIL`)

**`POST /api/transfer/request-owner-code`**

- Chamado: quando o proprietário informa o e-mail cadastrado.
- Request body: `RequestOwnerCodeRequest`

```json
{
  "locator": "ABC12345",
  "buyerEmail": "proprietario@email.com",
  "ownerWhatsappId": "5511999999999@s.whatsapp.net"
}
```

- Response: `GenericSuccessResponse`

```json
{
  "success": true,
  "message": "Código enviado para o e-mail cadastrado"
}
```

---

### 3. Confirmação do código do proprietário (`TRANSFER_WAITING_OWNER_CODE`)

**`POST /api/transfer/confirm-owner-code`**

- Chamado: quando o proprietário informa o código recebido.
- Request body: `ConfirmOwnerCodeRequest`

```json
{
  "locator": "ABC12345",
  "code": "123456"
}
```

- Response: `ConfirmOwnerCodeResponse`

```json
{
  "success": true,
  "ownerValidated": true
}
```

---

### 4. Início da transferência (`TRANSFER_WAITING_RECEIVER_EMAIL`)

**`POST /api/transfer/start`**

- Chamado: após coletar nome, CPF e e-mail do recebedor (etapas sem chamada à API).
- Request body: `StartTransferRequest`

```json
{
  "locator": "ABC12345",
  "receiverName": "Maria Souza",
  "receiverDocument": "123.456.789-00",
  "receiverEmail": "maria@email.com"
}
```

- Response: `StartTransferResponse`

```json
{
  "transferCode": "TRF-XYZ-001",
  "locator": "ABC12345",
  "eventName": "Show do Artista X",
  "receiverEmailMasked": "ma***@email.com",
  "status": "PENDING",
  "expiresAt": "2025-08-10T23:59:59"
}
```

> O `transferCode` é enviado ao recebedor para que ele use no Caminho B.

---

### Cancelamento pelo proprietário (comando `0` durante o fluxo)

#### Após confirmar o código do proprietário (steps: `OWNER_CODE`, `RECEIVER_NAME`, `RECEIVER_DOCUMENT`, `RECEIVER_EMAIL`)

**`POST /api/transfer/cancel-by-locator`**

- Request body: `CancelTransferByLocatorRequest`

```json
{
  "locator": "ABC12345"
}
```

- Response: `CancelTransferResponse`

```json
{
  "success": true,
  "status": "CANCELLED"
}
```

---

## Caminho B — Recebedor aceita a transferência

### 1. Verificação do código de transferência (`TRANSFER_WAITING_TRANSFER_CODE`)

**`POST /api/transfer/check`**

- Chamado: quando o recebedor informa o código de transferência recebido.
- Request body: `CheckTransferRequest`

```json
{
  "transferCode": "TRF-XYZ-001",
  "receiverWhatsappId": "5511888888888@s.whatsapp.net"
}
```

- Response: `CheckTransferResponse`

```json
{
  "transferCode": "TRF-XYZ-001",
  "locator": "ABC12345",
  "eventName": "Show do Artista X",
  "status": "PENDING",
  "receiverEmailMasked": "ma***@email.com",
  "expiresAt": "2025-08-10T23:59:59"
}
```

---

### 2. Solicitação de código ao recebedor (`TRANSFER_WAITING_RECEIVER_EMAIL_CONFIRM`)

**`POST /api/transfer/request-receiver-code`**

- Chamado: após o recebedor confirmar o e-mail.
- Request body: `RequestReceiverCodeRequest`

```json
{
  "transferCode": "TRF-XYZ-001",
  "receiverEmail": "maria@email.com"
}
```

- Response: `GenericSuccessResponse`

```json
{
  "success": true,
  "message": "Código enviado para o e-mail do recebedor"
}
```

---

### 3. Confirmação do código do recebedor (`TRANSFER_WAITING_RECEIVER_CODE`)

**`POST /api/transfer/confirm-receiver-code`**

- Chamado: quando o recebedor informa o código recebido.
- Request body: `ConfirmReceiverCodeRequest`

```json
{
  "transferCode": "TRF-XYZ-001",
  "code": "654321"
}
```

- Response: `ConfirmReceiverCodeResponse`

```json
{
  "success": true,
  "receiverValidated": true
}
```

---

### 4. Conclusão da transferência (`TRANSFER_WAITING_COMPLETE_CONFIRMATION` → opção 1)

**`POST /api/transfer/complete`**

- Chamado: quando o recebedor confirma que deseja concluir.
- Request body: `CompleteTransferRequest`

```json
{
  "transferCode": "TRF-XYZ-001"
}
```

- Response: `CompleteTransferResponse`

```json
{
  "success": true,
  "status": "COMPLETED",
  "locator": "NEW-LOCATOR",
  "message": "Transferência concluída com sucesso"
}
```

---

### Cancelamento pelo recebedor (opção 2 na confirmação ou comando `0`)

**`POST /api/transfer/cancel`**

- Request body: `CancelTransferRequest`

```json
{
  "transferCode": "TRF-XYZ-001"
}
```

- Response: `CancelTransferResponse`

```json
{
  "success": true,
  "status": "CANCELLED"
}
```

---

## Cenários de teste recomendados

| Cenário | Endpoint(s) envolvidos | O que verificar |
|---|---|---|
| Localizador inelegível para transferência | `check-locator` | `transferEligible == false` → exibe `reason` e encerra |
| Localizador não encontrado | `check-locator` | Erro da API → mensagem ao usuário |
| E-mail do proprietário incorreto | `request-owner-code` | API retorna erro → mensagem ao usuário |
| Código do proprietário inválido | `confirm-owner-code` | `ownerValidated == false` ou erro → mensagem |
| Início de transferência bem-sucedido | `start` | Retorna `transferCode` válido |
| Código de transferência expirado/inválido | `check` | Erro da API → mensagem ao usuário |
| E-mail do recebedor não bate | `request-receiver-code` | API retorna erro → mensagem ao usuário |
| Código do recebedor inválido | `confirm-receiver-code` | `receiverValidated == false` ou erro |
| Transferência concluída com sucesso | `complete` | `success == true` → chatbot exibe confirmação |
| Recebedor cancela na confirmação final | `cancel` | `success == true` → chatbot volta ao menu |
| Proprietário cancela após validar código | `cancel-by-locator` | `success == true` → chatbot volta ao menu |
