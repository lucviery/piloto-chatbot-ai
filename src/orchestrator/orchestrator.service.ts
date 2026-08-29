import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { LlmService } from '../llm/llm.service';

export interface MessageResponse {
  id: string;
  correlationId: string;
  route: 'direct';
  content: string;
  model: string;
}

@Injectable()
export class OrchestratorService {
  constructor(private readonly llm: LlmService) {}

  async respond(message: string, correlationId?: string): Promise<MessageResponse> {
    const result = await this.llm.generate({ message });
    return {
      id: randomUUID(),
      correlationId: correlationId ?? randomUUID(),
      route: 'direct',
      content: result.content,
      model: result.model,
    };
  }
}

