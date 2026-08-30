import { Injectable } from '@nestjs/common';
import { ConversationStateRepository } from '../../database/conversation-state.repository';
import { ToolContext } from '../../tools/tools.types';
import { ConversationState, FlowResponse } from '../flow.types';
import { CancelFlowHandler } from './cancel-flow.handler';

@Injectable()
export class CancelFlowService {
  constructor(
    private readonly states: ConversationStateRepository,
    private readonly handler: CancelFlowHandler,
  ) {}

  async start(state: ConversationState): Promise<FlowResponse> {
    const response = this.handler.start();
    await this.states.transition(state.conversationId, state.version, response.next);
    return response;
  }

  async handle(
    state: ConversationState,
    message: string,
    toolContext: ToolContext,
  ): Promise<FlowResponse> {
    const claimed = await this.states.transition(state.conversationId, state.version, {
      mode: state.mode,
      activeFlow: state.activeFlow,
      step: state.step,
      context: state.context,
    });
    const response = await this.handler.handle(claimed, message, toolContext);
    await this.states.transition(claimed.conversationId, claimed.version, response.next);
    return response;
  }
}
