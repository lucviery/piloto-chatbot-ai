import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { LlmService } from '../llm/llm.service';
import { ConversationRepository } from '../database/conversation.repository';
import { SendMessageDto } from './dto/send-message.dto';

export interface MessageResponse {
  id: string;
  sessionId: string;
  conversationId: string;
  correlationId: string;
  route: 'direct';
  content: string;
  model: string;
}

@Injectable()
export class OrchestratorService {
  constructor(
    private readonly llm: LlmService,
    private readonly conversations: ConversationRepository,
  ) {}

  async respond(input: SendMessageDto, correlationId: string): Promise<MessageResponse> {
    const sessionId = input.sessionId ?? randomUUID();
    const conversationId = input.conversationId ?? randomUUID();
    const id = randomUUID();
    const result = await this.llm.generate({ message: input.message });
    await this.conversations.saveInteraction({
      sessionId,
      conversationId,
      userMessage: input.message,
      assistantMessage: result.content,
      assistantMessageId: id,
      model: result.model,
      correlationId,
    });
    return {
      id,
      sessionId,
      conversationId,
      correlationId,
      route: 'direct',
      content: result.content,
      model: result.model,
    };
  }
}
