import { Injectable } from '@nestjs/common';
import { Tool, ToolContext, ToolExecutionError, ToolResult } from '../tools.types';
import { MegaueChatbotClient } from './megaue-chatbot.client';
import { OrderLocatorResponse, RequestCancelCodeResponse } from './megaue.types';

@Injectable()
export class SearchOrderByLocatorTool implements Tool<{ locator: string }, OrderLocatorResponse> {
  readonly name = 'search_order_by_locator';
  readonly description = 'Busca um pedido atual pelo localizador informado pelo usuário.';

  constructor(private readonly client: MegaueChatbotClient) {}

  async execute(input: { locator: string }, _context: ToolContext): Promise<ToolResult<OrderLocatorResponse>> {
    const locator = input.locator.trim();
    if (!locator) throw new Error('locator is required');
    const data = await this.client.searchByLocator(locator);
    if (
      !Number.isSafeInteger(data.orderId)
      || data.orderId <= 0
      || typeof data.value !== 'string'
      || typeof data.eventName !== 'string'
      || typeof data.status !== 'string'
      || !Array.isArray(data.locators)
      || !data.locators.every((item) => typeof item === 'string')
    ) {
      throw new ToolExecutionError(
        'MEGAUE_INVALID_RESPONSE',
        'A Megauê retornou dados inválidos para o pedido.',
        true,
      );
    }
    return { data, source: 'megaue:search-by-locator' };
  }
}

@Injectable()
export class RequestCancelCodeTool implements Tool<{ orderId: number }, RequestCancelCodeResponse> {
  readonly name = 'request_cancel_code';
  readonly description = 'Solicita à Megauê o envio do código de cancelamento.';

  constructor(private readonly client: MegaueChatbotClient) {}

  async execute(input: { orderId: number }, _context: ToolContext): Promise<ToolResult<RequestCancelCodeResponse>> {
    if (!Number.isSafeInteger(input.orderId) || input.orderId <= 0) throw new Error('valid orderId is required');
    const data = await this.client.requestCancelCode(input.orderId);
    if (typeof data.message !== 'string' || !data.message || typeof data.maskedEmail !== 'string' || !data.maskedEmail) {
      throw new ToolExecutionError(
        'MEGAUE_INVALID_RESPONSE',
        'A Megauê retornou dados inválidos ao solicitar o código.',
        true,
      );
    }
    return { data, source: 'megaue:request-cancel-code' };
  }
}

@Injectable()
export class CancelOrderTool implements Tool<{ orderId: number; code: string }, void> {
  readonly name = 'cancel_order';
  readonly description = 'Cancela integralmente um pedido usando o código validado pela Megauê.';

  constructor(private readonly client: MegaueChatbotClient) {}

  async execute(input: { orderId: number; code: string }, _context: ToolContext): Promise<ToolResult<void>> {
    const code = input.code.trim();
    if (!Number.isSafeInteger(input.orderId) || input.orderId <= 0) throw new Error('valid orderId is required');
    if (!code) throw new Error('code is required');
    await this.client.cancelOrder(input.orderId, code);
    return { data: undefined, source: 'megaue:cancel-order' };
  }
}
