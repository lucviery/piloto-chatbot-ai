import { Test } from '@nestjs/testing';
import { ConversationRepository } from '../database/conversation.repository';
import { FlowRouterService } from '../flows/flow-router.service';
import { OrchestratorService } from './orchestrator.service';

describe('OrchestratorService', () => {
  it('returns and persists a deterministic flow response', async () => {
    const ensureConversation = jest.fn().mockResolvedValue(undefined);
    const saveInteraction = jest.fn().mockResolvedValue(undefined);
    const route = jest.fn().mockResolvedValue({
      route: 'support', content: 'Deseja falar com um atendente?',
      next: { mode: 'BOT', activeFlow: 'SUPPORT', step: 'OFFERING_HUMAN_SUPPORT', context: {} },
    });
    const module = await Test.createTestingModule({ providers: [
      OrchestratorService,
      { provide: ConversationRepository, useValue: { ensureConversation, saveInteraction } },
      { provide: FlowRouterService, useValue: { route } },
    ] }).compile();

    const result = await module.get(OrchestratorService).respond({ message: 'Oi' }, 'corr-1');

    expect(ensureConversation).toHaveBeenCalledWith(result.sessionId, result.conversationId);
    expect(route).toHaveBeenCalledWith(result.conversationId, 'Oi', { correlationId: 'corr-1' });
    expect(result).toMatchObject({
      route: 'support', content: 'Deseja falar com um atendente?',
      model: 'flow-engine-v1', handledBy: 'bot',
    });
    expect(saveInteraction).toHaveBeenCalledWith(expect.objectContaining({
      assistantMessage: result.content, assistantMessageId: result.id,
    }));
  });

  it('streams a deterministic response as one delta', async () => {
    const module = await Test.createTestingModule({ providers: [
      OrchestratorService,
      { provide: ConversationRepository, useValue: { ensureConversation: jest.fn(), saveInteraction: jest.fn() } },
      { provide: FlowRouterService, useValue: { route: jest.fn().mockResolvedValue({
        route: 'cancel', content: 'Informe o localizador.',
        next: { mode: 'BOT', activeFlow: 'CANCEL', step: 'WAITING_CANCEL_LOCATOR', context: {} },
      }) } },
    ] }).compile();
    const deltas: string[] = [];

    const result = await module.get(OrchestratorService).respondStreaming(
      { message: 'Quero cancelar' }, 'corr-stream', (delta) => deltas.push(delta),
    );

    expect(deltas).toEqual(['Informe o localizador.']);
    expect(result.route).toBe('cancel');
  });

  it('persists only the inbound message while human attendance is active', async () => {
    const saveInteraction = jest.fn();
    const module = await Test.createTestingModule({ providers: [
      OrchestratorService,
      { provide: ConversationRepository, useValue: { ensureConversation: jest.fn(), saveInteraction } },
      { provide: FlowRouterService, useValue: { route: jest.fn().mockResolvedValue({
        route: 'human_silent', content: null,
        next: { mode: 'HUMAN', activeFlow: 'SUPPORT', step: 'HUMAN', context: {} },
      }) } },
    ] }).compile();

    const result = await module.get(OrchestratorService).respond({ message: 'Olá?' }, 'corr-human');

    expect(result).toMatchObject({ content: '', handledBy: 'human', route: 'human_silent' });
    expect(saveInteraction).toHaveBeenCalledWith(expect.not.objectContaining({ assistantMessage: expect.anything() }));
  });
});
