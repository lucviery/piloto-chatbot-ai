import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from './database.service';

export interface InteractionRecord {
  sessionId: string;
  conversationId: string;
  userMessage: string;
  assistantMessage: string;
  assistantMessageId: string;
  model: string;
  correlationId: string;
}

@Injectable()
export class ConversationRepository {
  constructor(private readonly database: DatabaseService) {}

  async saveInteraction(record: InteractionRecord): Promise<void> {
    try {
      await this.database.transaction(async (client) => {
      await client.query(
        `INSERT INTO chat_sessions(id) VALUES ($1)
         ON CONFLICT (id) DO UPDATE SET last_seen_at = now()`,
        [record.sessionId],
      );
      await client.query(
        `INSERT INTO conversations(id, session_id) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET last_message_at = now()`,
        [record.conversationId, record.sessionId],
      );
      await client.query(
        `INSERT INTO messages(id, conversation_id, role, content, correlation_id)
         VALUES ($1, $2, 'user', $3, $4)`,
        [randomUUID(), record.conversationId, record.userMessage, record.correlationId],
      );
      await client.query(
        `INSERT INTO messages(id, conversation_id, role, content, model, correlation_id)
         VALUES ($1, $2, 'assistant', $3, $4, $5)`,
        [record.assistantMessageId, record.conversationId, record.assistantMessage, record.model, record.correlationId],
      );
      });
    } catch {
      throw new ServiceUnavailableException({
        code: 'DATABASE_UNAVAILABLE',
        message: 'Não foi possível persistir a conversa no momento.',
      });
    }
  }
}
