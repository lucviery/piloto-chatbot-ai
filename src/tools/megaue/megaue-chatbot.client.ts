import { Injectable } from '@nestjs/common';
import { ToolExecutionError } from '../tools.types';
import {
  MegaueErrorResponse,
  OrderLocatorResponse,
  RequestCancelCodeResponse,
} from './megaue.types';

@Injectable()
export class MegaueChatbotClient {
  private readonly baseUrl = process.env.MEGAUE_API_BASE_URL?.replace(/\/$/, '');
  private readonly token = process.env.MEGAUE_API_TOKEN;
  private readonly timeoutMs = Number(process.env.MEGAUE_API_TIMEOUT_MS ?? 15000);

  searchByLocator(locator: string): Promise<OrderLocatorResponse> {
    return this.request('/api/chatbot/search-by-locator', 'GET', { locator });
  }

  requestCancelCode(orderId: number): Promise<RequestCancelCodeResponse> {
    return this.request('/api/chatbot/request-cancel-code', 'POST', { orderId: String(orderId) });
  }

  async cancelOrder(orderId: number, code: string): Promise<void> {
    await this.request<undefined>('/api/chatbot/cancel-order', 'PUT', {
      orderId: String(orderId),
      code,
    });
  }

  private async request<T>(
    path: string,
    method: 'GET' | 'POST' | 'PUT',
    query: Record<string, string>,
  ): Promise<T> {
    if (!this.baseUrl) {
      throw new ToolExecutionError(
        'MEGAUE_API_NOT_CONFIGURED',
        'A integração com a Megauê não está configurada no momento.',
        false,
      );
    }

    const url = new URL(path, `${this.baseUrl}/`);
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
    const headers: Record<string, string> = { accept: 'application/json' };
    if (this.token) headers.authorization = `Bearer ${this.token}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error: unknown) {
      const timeout = error instanceof Error && error.name === 'TimeoutError';
      throw new ToolExecutionError(
        timeout ? 'MEGAUE_API_TIMEOUT' : 'MEGAUE_API_UNAVAILABLE',
        timeout
          ? 'A consulta à Megauê excedeu o tempo limite.'
          : 'Não foi possível acessar a Megauê no momento.',
        true,
      );
    }

    if (!response.ok) {
      const body = await this.safeErrorBody(response);
      const businessError = response.status >= 400 && response.status < 500;
      throw new ToolExecutionError(
        response.status === 422 ? 'MEGAUE_VALIDATION_ERROR' : 'MEGAUE_API_ERROR',
        body.detail ?? (businessError
          ? 'A Megauê não aceitou os dados informados.'
          : 'A Megauê não conseguiu concluir a operação.'),
        !businessError,
        response.status,
      );
    }

    if (response.status === 204) return undefined as T;
    try {
      return (await response.json()) as T;
    } catch {
      throw new ToolExecutionError(
        'MEGAUE_INVALID_RESPONSE',
        'A Megauê retornou uma resposta inválida.',
        true,
        response.status,
      );
    }
  }

  private async safeErrorBody(response: Response): Promise<MegaueErrorResponse> {
    try {
      return (await response.json()) as MegaueErrorResponse;
    } catch {
      return {};
    }
  }
}
