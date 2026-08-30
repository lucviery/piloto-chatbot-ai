import { Injectable } from '@nestjs/common';
import { ToolContext, ToolExecutionError } from '../../tools/tools.types';
import {
  CancelOrderTool,
  RequestCancelCodeTool,
  SearchOrderByLocatorTool,
} from '../../tools/megaue/cancel.tools';
import {
  ConversationState,
  FlowResponse,
  initialConversationState,
} from '../flow.types';

@Injectable()
export class CancelFlowHandler {
  constructor(
    private readonly searchOrder: SearchOrderByLocatorTool,
    private readonly requestCode: RequestCancelCodeTool,
    private readonly cancelOrder: CancelOrderTool,
  ) {}

  start(): FlowResponse {
    return {
      route: 'cancel',
      content: 'Posso ajudar com o cancelamento. Por favor, informe o localizador do pedido.',
      next: {
        mode: 'BOT',
        activeFlow: 'CANCEL',
        step: 'WAITING_CANCEL_LOCATOR',
        context: {},
      },
    };
  }

  async handle(state: ConversationState, message: string, toolContext: ToolContext): Promise<FlowResponse> {
    switch (state.step) {
      case 'WAITING_CANCEL_LOCATOR':
        return this.handleLocator(state, message, toolContext);
      case 'WAITING_CANCEL_CONFIRMATION':
        return this.handleConfirmation(state, message, toolContext);
      case 'WAITING_CANCEL_CODE':
        return this.handleCode(state, message, toolContext);
      default:
        return this.start();
    }
  }

  private async handleLocator(
    state: ConversationState,
    message: string,
    toolContext: ToolContext,
  ): Promise<FlowResponse> {
    const locator = message.trim();
    if (!locator) return this.stay(state, 'Informe um localizador válido para continuar.');

    try {
      const { data } = await this.searchOrder.execute({ locator }, toolContext);
      if (data.status !== 'CONFIRM') {
        return {
          route: 'support',
          content: 'Esse pedido não está disponível para cancelamento automático. Deseja falar com um atendente humano?',
          next: {
            mode: 'BOT',
            activeFlow: 'SUPPORT',
            step: 'OFFERING_HUMAN_SUPPORT',
            context: {
              locator,
              orderId: data.orderId,
              value: data.value,
              eventName: data.eventName,
              orderStatus: data.status,
              locators: data.locators,
            },
          },
        };
      }

      const totalWarning = data.locators.length > 1
        ? ' O cancelamento será aplicado a todos os ingressos desse pedido.'
        : '';
      return {
        route: 'cancel',
        content: `Encontrei o pedido do evento ${data.eventName}, no valor de ${data.value}.${totalWarning} Deseja realmente cancelar? Responda 1 para sim ou 2 para não.`,
        next: {
          mode: 'BOT',
          activeFlow: 'CANCEL',
          step: 'WAITING_CANCEL_CONFIRMATION',
          context: {
            locator,
            orderId: data.orderId,
            value: data.value,
            eventName: data.eventName,
            orderStatus: data.status,
            locators: data.locators,
          },
        },
      };
    } catch (error: unknown) {
      return this.stay(state, `${this.publicError(error)} Informe o localizador novamente.`);
    }
  }

  private async handleConfirmation(
    state: ConversationState,
    message: string,
    toolContext: ToolContext,
  ): Promise<FlowResponse> {
    const answer = this.normalizeDecision(message);
    if (answer === 'NO') {
      return { route: 'cancel', content: 'Cancelamento interrompido.', next: initialConversationState() };
    }
    if (answer !== 'YES') {
      return this.stay(state, 'Não entendi. Responda 1 para confirmar o cancelamento ou 2 para desistir.');
    }
    if (!state.context.orderId) {
      return { ...this.start(), content: 'Perdi os dados do pedido. Por favor, informe o localizador novamente.' };
    }

    try {
      const { data } = await this.requestCode.execute({ orderId: state.context.orderId }, toolContext);
      return {
        route: 'cancel',
        content: `${data.message}. O código foi enviado para ${data.maskedEmail}. Digite o código recebido.`,
        next: {
          mode: 'BOT',
          activeFlow: 'CANCEL',
          step: 'WAITING_CANCEL_CODE',
          context: state.context,
        },
      };
    } catch (error: unknown) {
      return this.stay(state, `${this.publicError(error)} Você pode tentar novamente ou responder 2 para desistir.`);
    }
  }

  private async handleCode(
    state: ConversationState,
    message: string,
    toolContext: ToolContext,
  ): Promise<FlowResponse> {
    const code = message.trim();
    if (!code) return this.stay(state, 'Informe o código recebido para continuar.');
    if (!state.context.orderId) {
      return { ...this.start(), content: 'Perdi os dados do pedido. Por favor, informe o localizador novamente.' };
    }

    try {
      await this.cancelOrder.execute({ orderId: state.context.orderId, code }, toolContext);
      return {
        route: 'cancel',
        content: 'Cancelamento realizado com sucesso. O reembolso ocorre em até 3 dias úteis para PIX ou em até 2 faturas para cartão de crédito.',
        next: initialConversationState(),
      };
    } catch (error: unknown) {
      return {
        ...this.stay(state, `${this.publicError(error)} Confira o código e tente novamente.`),
        next: {
          mode: 'BOT',
          activeFlow: 'CANCEL',
          step: 'WAITING_CANCEL_CODE',
          context: {
            ...state.context,
            cancelCodeAttempts: (state.context.cancelCodeAttempts ?? 0) + 1,
          },
        },
      };
    }
  }

  private stay(state: ConversationState, content: string): FlowResponse {
    return {
      route: 'cancel',
      content,
      next: {
        mode: state.mode,
        activeFlow: state.activeFlow,
        step: state.step,
        context: state.context,
      },
    };
  }

  private normalizeDecision(message: string): 'YES' | 'NO' | 'UNKNOWN' {
    const value = message.trim().toLocaleLowerCase('pt-BR');
    if (['1', 'sim', 's', 'confirmo', 'confirmar'].includes(value)) return 'YES';
    if (['2', 'não', 'nao', 'n', 'desistir', 'cancelar operação'].includes(value)) return 'NO';
    return 'UNKNOWN';
  }

  private publicError(error: unknown): string {
    return error instanceof ToolExecutionError
      ? error.message
      : 'Não foi possível concluir essa etapa no momento.';
  }
}
