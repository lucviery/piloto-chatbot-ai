import { Test } from '@nestjs/testing';
import { LlmService } from '../llm/llm.service';
import { OrchestratorService } from './orchestrator.service';

describe('OrchestratorService', () => {
  it('returns a direct response with correlation metadata', async () => {
    const generate = jest.fn().mockResolvedValue({ content: 'Olá!', model: 'test-model' });
    const module = await Test.createTestingModule({
      providers: [OrchestratorService, { provide: LlmService, useValue: { generate } }],
    }).compile();

    const result = await module.get(OrchestratorService).respond({ message: 'Oi' }, 'corr-1');

    expect(generate).toHaveBeenCalledWith({ message: 'Oi' });
    expect(result).toMatchObject({
      correlationId: 'corr-1',
      route: 'direct',
      content: 'Olá!',
      model: 'test-model',
    });
    expect(result.id).toBeTruthy();
    expect(result.sessionId).toBeTruthy();
    expect(result.conversationId).toBeTruthy();
  });
});
