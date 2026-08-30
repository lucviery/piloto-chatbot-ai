import { Injectable } from '@nestjs/common';
import { Tool, ToolContext, ToolExecutionError, ToolResult } from '../tools.types';

export interface NotifyHumanSupportInput {
  conversationId: string;
  message: string;
  locator?: string;
  orderId?: number;
  eventName?: string;
  userName?: string;
  userContact?: string;
}

@Injectable()
export class NotifyHumanSupportTool implements Tool<NotifyHumanSupportInput, { delivered: true }> {
  readonly name = 'notify_human_support';
  readonly description = 'Notifica o canal autorizado para que um atendente humano assuma a conversa.';
  private readonly webhookUrl = process.env.SUPPORT_DISCORD_WEBHOOK_URL;
  private readonly timeoutMs = Number(process.env.SUPPORT_WEBHOOK_TIMEOUT_MS ?? 10000);

  async execute(input: NotifyHumanSupportInput, context: ToolContext): Promise<ToolResult<{ delivered: true }>> {
    if (!this.webhookUrl) {
      throw new ToolExecutionError(
        'SUPPORT_WEBHOOK_NOT_CONFIGURED',
        'O atendimento humano não está configurado no momento.',
        false,
      );
    }

    const fields = [
      `Conversa: ${input.conversationId}`,
      `Contato: ${input.userContact ?? 'Não informado'}`,
      `Nome: ${input.userName ?? 'Não informado'}`,
      `Localizador: ${input.locator ?? 'Não informado'}`,
      `Pedido: ${input.orderId ?? 'Não informado'}`,
      `Evento: ${input.eventName ?? 'Não informado'}`,
      `Mensagem: ${input.message}`,
      `Correlação: ${context.correlationId}`,
    ];

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content: fields.join('\n').slice(0, 1900),
          allowed_mentions: { parse: [] },
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) throw new Error(`webhook status ${response.status}`);
      return { data: { delivered: true }, source: 'support:discord-webhook' };
    } catch (error: unknown) {
      if (error instanceof ToolExecutionError) throw error;
      throw new ToolExecutionError(
        'SUPPORT_NOTIFICATION_FAILED',
        'Não foi possível encaminhar o atendimento humano no momento.',
        true,
      );
    }
  }
}
