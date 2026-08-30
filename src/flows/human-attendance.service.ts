import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConversationStateRepository } from '../database/conversation-state.repository';
import { ConversationState, initialConversationState } from './flow.types';

@Injectable()
export class HumanAttendanceService {
  constructor(private readonly states: ConversationStateRepository) {}

  async close(conversationId: string): Promise<ConversationState> {
    const state = await this.states.find(conversationId);
    if (!state) {
      throw new NotFoundException({
        code: 'CONVERSATION_NOT_FOUND',
        message: 'Conversa não encontrada.',
      });
    }
    if (state.mode !== 'HUMAN') {
      throw new ConflictException({
        code: 'CONVERSATION_NOT_IN_HUMAN_MODE',
        message: 'A conversa não está em atendimento humano.',
      });
    }
    return this.states.transition(conversationId, state.version, initialConversationState());
  }
}
