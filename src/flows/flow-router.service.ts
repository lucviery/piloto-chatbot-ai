import { Injectable } from '@nestjs/common';
import { ConversationStateRepository } from '../database/conversation-state.repository';
import { ToolContext } from '../tools/tools.types';
import { CancelFlowService } from './cancel/cancel-flow.service';
import { FlowResponse } from './flow.types';
import { IntentClassifierService } from './intent-classifier.service';
import { SupportFlowService } from './support/support-flow.service';

@Injectable()
export class FlowRouterService {
  constructor(
    private readonly states: ConversationStateRepository,
    private readonly classifier: IntentClassifierService,
    private readonly cancelFlow: CancelFlowService,
    private readonly supportFlow: SupportFlowService,
  ) {}

  async route(conversationId: string, message: string, context: ToolContext): Promise<FlowResponse> {
    const state = await this.states.createInitial(conversationId);

    if (state.mode === 'HUMAN') {
      return {
        route: 'human_silent',
        content: null,
        next: {
          mode: state.mode,
          activeFlow: state.activeFlow,
          step: state.step,
          context: state.context,
        },
      };
    }
    if (state.activeFlow === 'CANCEL') return this.cancelFlow.handle(state, message, context);
    if (state.activeFlow === 'SUPPORT') return this.supportFlow.handle(state, message, context);

    return this.classifier.classify(message) === 'CANCEL'
      ? this.cancelFlow.start(state)
      : this.supportFlow.offer(state);
  }
}
