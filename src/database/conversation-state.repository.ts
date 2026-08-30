import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { QueryResultRow } from 'pg';
import {
  ConversationMode,
  ConversationState,
  ConversationStateTransition,
  ConversationStep,
  FlowContext,
  FlowName,
  initialConversationState,
} from '../flows/flow.types';
import { DatabaseService } from './database.service';

interface ConversationStateRow extends QueryResultRow {
  conversation_id: string;
  mode: ConversationMode;
  active_flow: FlowName | null;
  step: ConversationStep;
  context: FlowContext;
  version: number;
  updated_at: Date | string;
}

@Injectable()
export class ConversationStateRepository {
  constructor(private readonly database: DatabaseService) {}

  async find(conversationId: string): Promise<ConversationState | null> {
    try {
      const result = await this.database.query<ConversationStateRow>(
        `SELECT conversation_id, mode, active_flow, step, context, version, updated_at
         FROM conversation_states
         WHERE conversation_id = $1`,
        [conversationId],
      );
      return result.rows[0] ? this.toState(result.rows[0]) : null;
    } catch {
      throw this.unavailable();
    }
  }

  async createInitial(conversationId: string): Promise<ConversationState> {
    const initial = initialConversationState();
    try {
      const result = await this.database.query<ConversationStateRow>(
        `INSERT INTO conversation_states(conversation_id, mode, active_flow, step, context)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         ON CONFLICT (conversation_id) DO UPDATE SET conversation_id = EXCLUDED.conversation_id
         RETURNING conversation_id, mode, active_flow, step, context, version, updated_at`,
        [
          conversationId,
          initial.mode,
          initial.activeFlow,
          initial.step,
          JSON.stringify(initial.context),
        ],
      );
      return this.toState(result.rows[0]);
    } catch {
      throw this.unavailable();
    }
  }

  async transition(
    conversationId: string,
    expectedVersion: number,
    next: ConversationStateTransition,
  ): Promise<ConversationState> {
    let result;
    try {
      result = await this.database.query<ConversationStateRow>(
        `UPDATE conversation_states
         SET mode = $3,
             active_flow = $4,
             step = $5,
             context = $6::jsonb,
             version = version + 1,
             updated_at = now()
         WHERE conversation_id = $1 AND version = $2
         RETURNING conversation_id, mode, active_flow, step, context, version, updated_at`,
        [
          conversationId,
          expectedVersion,
          next.mode,
          next.activeFlow,
          next.step,
          JSON.stringify(next.context),
        ],
      );
    } catch {
      throw this.unavailable();
    }

    if (!result.rows[0]) {
      throw new ConflictException({
        code: 'CONVERSATION_STATE_CONFLICT',
        message: 'A conversa foi atualizada por outra mensagem. Recarregue o estado e tente novamente.',
      });
    }
    return this.toState(result.rows[0]);
  }

  private toState(row: ConversationStateRow): ConversationState {
    return {
      conversationId: row.conversation_id,
      mode: row.mode,
      activeFlow: row.active_flow,
      step: row.step,
      context: row.context ?? {},
      version: row.version,
      updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
    };
  }

  private unavailable(): ServiceUnavailableException {
    return new ServiceUnavailableException({
      code: 'DATABASE_UNAVAILABLE',
      message: 'Não foi possível acessar o estado da conversa no momento.',
    });
  }
}
