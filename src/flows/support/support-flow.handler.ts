import { Injectable } from '@nestjs/common';
import { SearchOrderByLocatorTool } from '../../tools/megaue/cancel.tools';
import { NotifyHumanSupportTool } from '../../tools/support/notify-human-support.tool';
import { ToolContext, ToolExecutionError } from '../../tools/tools.types';
import { ConversationState, FlowResponse, initialConversationState } from '../flow.types';

@Injectable()
export class SupportFlowHandler {
  constructor(
    private readonly searchOrder: SearchOrderByLocatorTool,
    private readonly notifySupport: NotifyHumanSupportTool,
  ) {}

  offer(context: ConversationState['context'] = {}): FlowResponse {
    return {
      route: 'support',
      content: 'No momento, consigo realizar automaticamente apenas cancelamentos. Deseja falar com um atendente humano?',
      next: {
        mode: 'BOT',
        activeFlow: 'SUPPORT',
        step: 'OFFERING_HUMAN_SUPPORT',
        context,
      },
    };
  }

  async handle(state: ConversationState, message: string, toolContext: ToolContext): Promise<FlowResponse> {
    switch (state.step) {
      case 'OFFERING_HUMAN_SUPPORT':
        return this.handleOffer(state, message);
      case 'WAITING_SUPPORT_LOCATOR':
        return this.handleLocator(state, message, toolContext);
      case 'WAITING_SUPPORT_MESSAGE':
        return this.handleMessage(state, message, toolContext);
      case 'HUMAN':
        return { route: 'human_silent', content: null, next: this.copyState(state) };
      default:
        return this.offer(state.context);
    }
  }

  private handleOffer(state: ConversationState, message: string): FlowResponse {
    const decision = this.normalizeDecision(message);
    if (decision === 'NO') {
      return { route: 'support', content: 'Tudo bem. Quando precisar, estarei disponível.', next: initialConversationState() };
    }
    if (decision !== 'YES') {
      return this.stay(state, 'Não entendi. Responda sim para falar com um atendente ou não para encerrar.');
    }
    return {
      route: 'support',
      content: 'Se tiver um localizador de pedido, envie agora. Caso não tenha, digite 0 para continuar.',
      next: {
        mode: 'BOT',
        activeFlow: 'SUPPORT',
        step: 'WAITING_SUPPORT_LOCATOR',
        context: state.context,
      },
    };
  }

  private async handleLocator(
    state: ConversationState,
    message: string,
    toolContext: ToolContext,
  ): Promise<FlowResponse> {
    const locator = message.trim();
    if (['0', 'pular'].includes(locator.toLocaleLowerCase('pt-BR'))) {
      return this.waitForMessage({});
    }
    if (!locator) return this.stay(state, 'Informe o localizador ou digite 0 para continuar sem ele.');

    try {
      const { data } = await this.searchOrder.execute({ locator }, toolContext);
      return this.waitForMessage({
        locator,
        orderId: data.orderId,
        value: data.value,
        eventName: data.eventName,
        orderStatus: data.status,
        locators: data.locators,
      });
    } catch (error: unknown) {
      const messageText = error instanceof ToolExecutionError
        ? error.message
        : 'Não foi possível consultar esse localizador.';
      return this.stay(state, `${messageText} Tente novamente ou digite 0 para continuar sem ele.`);
    }
  }

  private async handleMessage(
    state: ConversationState,
    message: string,
    toolContext: ToolContext,
  ): Promise<FlowResponse> {
    const supportMessage = message.trim();
    if (supportMessage.length < 5 || !/[\p{L}\p{N}]/u.test(supportMessage)) {
      return this.stay(state, 'Descreva o assunto em pelo menos 5 caracteres para encaminharmos ao atendente.');
    }

    try {
      await this.notifySupport.execute({
        conversationId: state.conversationId,
        message: supportMessage,
        locator: state.context.locator,
        orderId: state.context.orderId,
        eventName: state.context.eventName,
      }, toolContext);
      return {
        route: 'human_handoff',
        content: 'Seu atendimento foi encaminhado. Um atendente humano continuará a conversa.',
        next: {
          mode: 'HUMAN',
          activeFlow: 'SUPPORT',
          step: 'HUMAN',
          context: { ...state.context, supportMessage },
        },
      };
    } catch (error: unknown) {
      const messageText = error instanceof ToolExecutionError
        ? error.message
        : 'Não foi possível encaminhar o atendimento humano no momento.';
      return this.stay(state, `${messageText} Tente novamente em instantes.`);
    }
  }

  private waitForMessage(context: ConversationState['context']): FlowResponse {
    return {
      route: 'support',
      content: 'Descreva brevemente o assunto para o atendente.',
      next: {
        mode: 'BOT',
        activeFlow: 'SUPPORT',
        step: 'WAITING_SUPPORT_MESSAGE',
        context,
      },
    };
  }

  private stay(state: ConversationState, content: string): FlowResponse {
    return { route: 'support', content, next: this.copyState(state) };
  }

  private copyState(state: ConversationState) {
    return {
      mode: state.mode,
      activeFlow: state.activeFlow,
      step: state.step,
      context: state.context,
    };
  }

  private normalizeDecision(message: string): 'YES' | 'NO' | 'UNKNOWN' {
    const value = message.trim().toLocaleLowerCase('pt-BR');
    if (['sim', 's', '1', 'quero', 'pode'].includes(value)) return 'YES';
    if (['não', 'nao', 'n', '2', 'encerrar'].includes(value)) return 'NO';
    return 'UNKNOWN';
  }
}
