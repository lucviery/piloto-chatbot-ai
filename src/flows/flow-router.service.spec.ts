import { ConversationStateRepository } from '../database/conversation-state.repository';
import { CancelFlowService } from './cancel/cancel-flow.service';
import { ConversationState } from './flow.types';
import { FlowRouterService } from './flow-router.service';
import { IntentClassifierService } from './intent-classifier.service';
import { SupportFlowService } from './support/support-flow.service';

const initial: ConversationState = {
  conversationId: '11111111-1111-4111-8111-111111111111', mode: 'BOT' as const,
  activeFlow: null, step: 'IDLE' as const, context: {}, version: 0, updatedAt: new Date(),
};

describe('FlowRouterService', () => {
  const cancel = { start: jest.fn(), handle: jest.fn() };
  const support = { offer: jest.fn(), handle: jest.fn() };
  beforeEach(() => jest.clearAllMocks());

  const router = (state: ConversationState = initial) => new FlowRouterService(
    { createInitial: jest.fn().mockResolvedValue(state) } as unknown as ConversationStateRepository,
    new IntentClassifierService(), cancel as unknown as CancelFlowService, support as unknown as SupportFlowService,
  );

  it('starts cancellation only for an explicit cancellation intent', async () => {
    cancel.start.mockResolvedValue({ route: 'cancel' });
    await router().route(initial.conversationId, 'Quero cancelar', { correlationId: 'corr' });
    expect(cancel.start).toHaveBeenCalledWith(initial);
    expect(support.offer).not.toHaveBeenCalled();
  });

  it('offers human attendance for every other subject', async () => {
    support.offer.mockResolvedValue({ route: 'support' });
    await router().route(initial.conversationId, 'Preciso de ajuda', { correlationId: 'corr' });
    expect(support.offer).toHaveBeenCalledWith(initial);
  });

  it('continues an active flow without reclassifying the message', async () => {
    const active = { ...initial, activeFlow: 'CANCEL' as const, step: 'WAITING_CANCEL_CODE' as const };
    cancel.handle.mockResolvedValue({ route: 'cancel' });
    await router(active).route(initial.conversationId, '123456', { correlationId: 'corr' });
    expect(cancel.handle).toHaveBeenCalledWith(active, '123456', { correlationId: 'corr' });
    expect(support.offer).not.toHaveBeenCalled();
  });

  it('does not invoke any flow while a human owns the conversation', async () => {
    const human = { ...initial, mode: 'HUMAN' as const, activeFlow: 'SUPPORT' as const, step: 'HUMAN' as const };
    const result = await router(human).route(initial.conversationId, 'Olá?', { correlationId: 'corr' });
    expect(result).toMatchObject({ route: 'human_silent', content: null });
    expect(cancel.handle).not.toHaveBeenCalled();
    expect(support.handle).not.toHaveBeenCalled();
  });
});
