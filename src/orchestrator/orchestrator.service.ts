import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { LlmService } from '../llm/llm.service';
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
  constructor(private readonly llm: LlmService) {}

  async respond(input: SendMessageDto, correlationId: string): Promise<MessageResponse> {
    const result = await this.llm.generate({ message: input.message });
    return {
      id: randomUUID(),
      sessionId: input.sessionId ?? randomUUID(),
      conversationId: input.conversationId ?? randomUUID(),
      correlationId,
      route: 'direct',
      content: result.content,
      model: result.model,
    };
  }
}
