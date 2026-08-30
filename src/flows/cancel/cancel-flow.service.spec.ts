import { ConversationStateRepository } from '../../database/conversation-state.repository';
import { ConversationState } from '../flow.types';
import { CancelFlowHandler } from './cancel-flow.handler';
import { CancelFlowService } from './cancel-flow.service';

describe('CancelFlowService', () => {
  it('claims the current version before executing a flow handler', async () => {
    const current: ConversationState = {
      conversationId: '11111111-1111-4111-8111-111111111111',
      mode: 'BOT',
      activeFlow: 'CANCEL',
      step: 'WAITING_CANCEL_CODE',
      context: { orderId: 10 },
      version: 4,
      updatedAt: new Date(),
    };
    const claimed = { ...current, version: 5 };
    const transition = jest.fn()
      .mockResolvedValueOnce(claimed)
      .mockResolvedValueOnce({ ...claimed, version: 6, step: 'IDLE' });
    const handle = jest.fn().mockResolvedValue({
      route: 'cancel',
      content: 'Concluído',
      next: { mode: 'BOT', activeFlow: null, step: 'IDLE', context: {} },
    });
    const service = new CancelFlowService(
      { transition } as unknown as ConversationStateRepository,
      { handle } as unknown as CancelFlowHandler,
    );

    await service.handle(current, '123456', { correlationId: 'corr' });

    expect(transition).toHaveBeenNthCalledWith(1, current.conversationId, 4, {
      mode: 'BOT', activeFlow: 'CANCEL', step: 'WAITING_CANCEL_CODE', context: { orderId: 10 },
    });
    expect(handle).toHaveBeenCalledWith(claimed, '123456', { correlationId: 'corr' });
    expect(transition).toHaveBeenNthCalledWith(2, current.conversationId, 5, {
      mode: 'BOT', activeFlow: null, step: 'IDLE', context: {},
    });
  });
});
