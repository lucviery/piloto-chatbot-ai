import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ConversationRepository } from '../database/conversation.repository';
import { FlowRouterService } from '../flows/flow-router.service';
import { SendMessageDto } from './dto/send-message.dto';

export type MessageRoute = 'cancel' | 'support' | 'human_handoff' | 'human_silent';

export interface MessageResponse {
  id: string;
  sessionId: string;
  conversationId: string;
  correlationId: string;
  route: MessageRoute;
  content: string;
  model: 'flow-engine-v1';
  handledBy: 'bot' | 'human';
}

@Injectable()
export class OrchestratorService {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly flowRouter: FlowRouterService,
  ) {}

  async respond(input: SendMessageDto, correlationId: string): Promise<MessageResponse> {
    return this.respondWith(input, correlationId);
  }

  async respondStreaming(
    input: SendMessageDto,
    correlationId: string,
    onDelta: (delta: string) => void,
  ): Promise<MessageResponse> {
    const result = await this.respondWith(input, correlationId);
    if (result.content) onDelta(result.content);
    return result;
  }

  private async respondWith(
    input: SendMessageDto,
    correlationId: string,
  ): Promise<MessageResponse> {
    const sessionId = input.sessionId ?? randomUUID();
    const conversationId = input.conversationId ?? randomUUID();
    const id = randomUUID();
    await this.conversations.ensureConversation(sessionId, conversationId);
    const flow = await this.flowRouter.route(conversationId, input.message, { correlationId });
    const content = flow.content ?? '';
    const handledBy = flow.route === 'human_silent' ? 'human' : 'bot';
    await this.conversations.saveInteraction({
      sessionId,
      conversationId,
      userMessage: input.message,
      ...(content ? {
        assistantMessage: content,
        assistantMessageId: id,
        model: 'flow-engine-v1' as const,
      } : {}),
      correlationId,
    });
    return {
      id,
      sessionId,
      conversationId,
      correlationId,
      route: flow.route,
      content,
      model: 'flow-engine-v1',
      handledBy,
    };
  }
}
