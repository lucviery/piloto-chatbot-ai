# Ticket Link — Endpoints da API Megaue

**Classe:** `TicketLinkService`
**Client:** `MegaueChatbotClient`
**Acionado por:** mensagem com formato `Me envia o(s) ingresso(s) do pedido <número do pedido>, e-mail usado na compra: <e-mail>` (case-insensitive)

Este é um comando global disponível em qualquer momento da conversa, sem fluxo de etapas. Após a execução, a conversa é resetada para o menu principal.

O e-mail é obrigatório: a API da Megaue valida se o e-mail informado corresponde ao cliente dono do pedido (tanto para cadastro rápido `FAST_LOGIN` quanto completo `COMPLETE_LOGIN`) antes de liberar os ingressos. Isso evita que alguém consiga os ingressos de terceiros apenas sabendo o número do pedido.

---

## Endpoint chamado

### Busca de ingressos do pedido (com validação de e-mail)

**`GET /api/chatbot/sales/order/{orderId}?email={email}`**

- Chamado: imediatamente ao receber o comando com número de pedido e e-mail identificados.
- Path param: `orderId` — número do pedido extraído da mensagem.
- Query param: `email` — e-mail usado na compra, extraído da mensagem (URL-encoded).
- Request body: nenhum.
- Response: URLs públicas (GCP Storage) dos PDFs dos ingressos, prontas para envio via WhatsApp.

```json
{
  "status": "CONFIRM",
  "orderId": 123,
  "tickets": [
    {
      "ticketId": 456,
      "ticketUrl": "https://storage.googleapis.com/<bucket>/tickets/<uuid>"
    }
  ]
}
```

Cada `ticketUrl` é enviado ao contato via `GatewayClient.sendDocument` (arquivo `ingresso-{ticketId}.pdf`, `application/pdf`) — o gateway anexa o documento a partir da URL, sem o chatbot precisar baixar/decodificar o PDF.

> ⚠️ Contrato alterado na branch `feat-chatbot-ticket-url` (commit `75d8f44c`) do backend Megaue. O campo `ticketPdf` (base64) foi substituído por `ticketUrl` (string). Essa branch ainda não foi mergeada em produção — só habilitar este código em produção depois que o backend Megaue publicar a mudança.

### Erros (retornados pela Megaue via `detail` e exibidos diretamente ao usuário)

| Cenário | Mensagem da Megaue |
|---|---|
| `orderId` inexistente | `Order não encontrado!` |
| E-mail não confere com o dono do pedido | `O cliente informado é diferente do cliente dono do Order!` |

---

## Cenários de teste recomendados

| Cenário | O que verificar |
|---|---|
| Pedido + e-mail corretos | PDFs enviados via `sendDocument`; mensagem de confirmação exibida |
| Pedido existente, e-mail divergente | Nenhum PDF enviado; mensagem de erro da Megaue exibida ao usuário |
| `orderId` inexistente | Nenhum PDF enviado; mensagem de erro da Megaue exibida ao usuário |
| Mensagem sem número de pedido ou sem e-mail | Sem chamada à API → chatbot exibe mensagem de formato inválido |
| Pedido com ingressos, mas todos com PDF vazio/inválido | Nenhum PDF enviado; mensagem de falha genérica |
