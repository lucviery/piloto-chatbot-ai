import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { LlmService } from '../llm/llm.service';
import { ConversationRepository } from '../database/conversation.repository';
import { RagService } from '../rag/rag.service';
import { RagSource } from '../rag/rag.types';
import { SendMessageDto } from './dto/send-message.dto';

export interface MessageResponse {
  id: string;
  sessionId: string;
  conversationId: string;
  correlationId: string;
  route: 'direct' | 'rag';
  content: string;
  model: string;
  sources?: RagSource[];
}

@Injectable()
export class OrchestratorService {
  constructor(
    private readonly llm: LlmService,
    private readonly conversations: ConversationRepository,
    private readonly rag: RagService,
  ) {}

  async respond(input: SendMessageDto, correlationId: string): Promise<MessageResponse> {
    const sessionId = input.sessionId ?? randomUUID();
    const conversationId = input.conversationId ?? randomUUID();
    const id = randomUUID();
    const retrieved = await this.rag.retrieve(input.message);
    const route = retrieved.sources.length > 0 ? 'rag' : 'direct';
    const prompt = route === 'rag'
      ? `Responda em português usando somente o contexto fornecido. Se o contexto não bastar, diga que não encontrou evidência. Cite as fontes pelos números entre colchetes.\n\nContexto:\n${retrieved.context}\n\nPergunta: ${input.message}`
      : input.message;
    const result = await this.llm.generate({ message: prompt });
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
      route,
      content: result.content,
      model: result.model,
      ...(route === 'rag' ? { sources: retrieved.sources } : {}),
    };
  }
}
