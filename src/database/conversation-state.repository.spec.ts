import { ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { ConversationStateRepository } from './conversation-state.repository';
import { DatabaseService } from './database.service';

const row = {
  conversation_id: '11111111-1111-4111-8111-111111111111',
  mode: 'BOT',
  active_flow: null,
  step: 'IDLE',
  context: {},
  version: 0,
  updated_at: new Date('2026-08-30T00:00:00.000Z'),
};

describe('ConversationStateRepository', () => {
  it('creates the initial BOT/IDLE state idempotently', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [row] });
    const repository = new ConversationStateRepository({ query } as unknown as DatabaseService);

    const state = await repository.createInitial(row.conversation_id);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT (conversation_id)'),
      [row.conversation_id, 'BOT', null, 'IDLE', '{}'],
    );
    expect(state).toEqual({
      conversationId: row.conversation_id,
      mode: 'BOT',
      activeFlow: null,
      step: 'IDLE',
      context: {},
      version: 0,
      updatedAt: row.updated_at,
    });
  });

  it('updates the state only when the expected version matches', async () => {
    const updated = {
      ...row,
      active_flow: 'CANCEL',
      step: 'WAITING_CANCEL_LOCATOR',
      version: 1,
    };
    const query = jest.fn().mockResolvedValue({ rows: [updated] });
    const repository = new ConversationStateRepository({ query } as unknown as DatabaseService);

    const state = await repository.transition(row.conversation_id, 0, {
      mode: 'BOT',
      activeFlow: 'CANCEL',
      step: 'WAITING_CANCEL_LOCATOR',
      context: {},
    });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE conversation_id = $1 AND version = $2'),
      [row.conversation_id, 0, 'BOT', 'CANCEL', 'WAITING_CANCEL_LOCATOR', '{}'],
    );
    expect(state.version).toBe(1);
    expect(state.step).toBe('WAITING_CANCEL_LOCATOR');
  });

  it('rejects a stale concurrent transition', async () => {
    const repository = new ConversationStateRepository({
      query: jest.fn().mockResolvedValue({ rows: [] }),
    } as unknown as DatabaseService);

    await expect(repository.transition(row.conversation_id, 0, {
      mode: 'BOT',
      activeFlow: 'CANCEL',
      step: 'WAITING_CANCEL_LOCATOR',
      context: {},
    })).rejects.toBeInstanceOf(ConflictException);
  });

  it('normalizes database failures without exposing internals', async () => {
    const repository = new ConversationStateRepository({
      query: jest.fn().mockRejectedValue(new Error('secret connection detail')),
    } as unknown as DatabaseService);

    await expect(repository.find(row.conversation_id)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
